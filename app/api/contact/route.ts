import {
  FORM_FIELDS,
  REQUIRED_SERVER,
  FIELD_ERRORS,
  fieldValid,
} from "@/components/contact/contact-data";
import { sendLeadEmail, sendLeadReceipt, type Lead } from "@/lib/email";

/**
 * POST /api/contact — the only write endpoint on the site.
 *
 * Public, unauthenticated, and it sends mail, which makes it the one piece of
 * this codebase an attacker has any reason to care about. The ordering below
 * is deliberate: cheap rejections first, SMTP last, and the lead written to
 * the log *before* anything that can fail.
 *
 * The rule every trade-off here is settled by: a real lead must never be
 * rejected or lost. Every one of them arrived from a paid click.
 */

// SMTP is a raw TCP connection and Edge has no sockets. 'nodejs' is the Next 16
// default; declared anyway so the constraint is visible at the top of the file.
export const runtime = "nodejs";

const FIELD_NAMES = FORM_FIELDS.map((f) => f.name);
/** Only `notes` is a textarea; every other field is a single-line input. */
const MULTILINE = new Set(FORM_FIELDS.filter((f) => f.multiline).map((f) => f.name));
const MAX_BODY_BYTES = 16 * 1024;

// Never a cached answer, and never sniffed as anything but JSON.
const SAFE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function bad(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status, headers: SAFE_HEADERS });
}
function ok() {
  return Response.json({ ok: true }, { headers: SAFE_HEADERS });
}

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/*                                                                     */
/*  This is one long-lived Node process on Hostinger, not a fleet of   */
/*  serverless instances, so the Map genuinely persists between        */
/*  requests and the limit genuinely holds — the usual "only within a  */
/*  warm instance" caveat doesn't apply. It still isn't a security     */
/*  control (see clientKey), it's a cap so one client can't burn the   */
/*  mailbox's daily send quota and take the form down for real people. */
/* ------------------------------------------------------------------ */
const WINDOW_MS = 10 * 60 * 1000;
/**
 * Loose: protects the process from a flood of garbage POSTs. Generous on
 * purpose — this fires before validation, so every typo a visitor fixes
 * spends one. It has to be impossible for a real person to hit, and a NAT'd
 * office where several people enquire on the same day still has headroom.
 */
const MAX_REQUESTS = 20;
/** Tight: protects the mailbox quota. Checked only when we're about to send. */
const MAX_SENDS = 5;

const requestHits = new Map<string, number[]>();
const sendHits = new Map<string, number[]>();

/**
 * Checking and recording are separate so a request rejected by the *second*
 * of two keys doesn't leave the first one incremented — that quietly costs a
 * later, legitimate submit one of its allowance.
 */
function isOver(store: Map<string, number[]>, key: string, max: number): boolean {
  const now = Date.now();
  // Evict by age, never wholesale. Clearing the Map on overflow would let
  // anyone reset every counter on the site by spraying enough distinct keys.
  if (store.size > 5000) {
    for (const [k, ts] of store) {
      if (!ts.some((t) => now - t < WINDOW_MS)) store.delete(k);
    }
  }
  const recent = (store.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  store.set(key, recent);
  return recent.length >= max;
}

function record(store: Map<string, number[]>, key: string) {
  const recent = store.get(key) ?? [];
  recent.push(Date.now());
  store.set(key, recent);
}

/**
 * Hostinger's CDN sits in front of this app, and Next 16 removed
 * `NextRequest.ip`, so the client address has to come from a header — which
 * means it is only as trustworthy as the proxy chain.
 *
 * `x-forwarded-for` is the trap. A proxy *appends* the peer it saw, so index 0
 * is whatever the client sent and can be rotated at will to dodge the limit.
 * Taking the last entry is worse: that is the CDN itself, so every visitor on
 * earth shares one bucket and lead #6 of the day gets a 429.
 *
 * So: prefer a single-value header (those aren't appendable), fall back to the
 * head of the chain, and log the whole chain on the first real lead so the
 * correct extraction can be pinned from evidence rather than guessed.
 */
function clientKey(request: Request): { ip: string; chain: string } {
  const chain = request.headers.get("x-forwarded-for") ?? "";
  const single =
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "";
  return { ip: single.trim() || chain.split(",")[0]?.trim() || "unknown", chain };
}

/**
 * One JSON line per lead, written BEFORE the SMTP attempt. Hostinger's Runtime
 * logs are the backstop: if mail breaks silently for a week, every lead from
 * that week is still recoverable by grepping `"t":"lead"`.
 *
 * JSON.stringify, never concatenation — it escapes newlines, so a name
 * containing a fake log line can't forge entries.
 */
function logLead(t: "lead" | "lead-hp" | "lead-send-failed", data: unknown) {
  try {
    console.log(JSON.stringify({ t, at: new Date().toISOString(), data }));
  } catch {
    /* logging must never be the thing that loses the lead */
  }
}

// A warning, not a throw: throwing at module scope takes the whole site down
// rather than just this route.
for (const k of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]) {
  if (!process.env[k]) {
    console.error(`[contact] MISSING ENV ${k} — lead emails will fail with 502`);
  }
}

export async function POST(request: Request) {
  /* 1. Content type. A cross-origin HTML form cannot send application/json
        without a CORS preflight the browser will block, so insisting on it is
        most of a CSRF defence for free. */
  const ctype = request.headers.get("content-type") ?? "";
  if (!ctype.toLowerCase().includes("application/json")) {
    return bad("Expected application/json.", 415);
  }

  /* 2. Origin must match the host actually being served — NOT a hardcoded
        domain. Hardcoding americanwebguild.com breaks the form on localhost
        and on every preview/staging host, which is a self-inflicted outage
        the moment anyone tests anywhere else. Comparing Origin to Host is
        both more portable and no weaker: a browser sets Origin itself and a
        page on evil.com cannot forge it, while a real request to us always
        carries our own Host.

        Absent Origin is allowed — curl and uptime monitors don't send one,
        and a request with no Origin isn't CSRF in the first place. */
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host") ?? "";
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host.toLowerCase() === host.toLowerCase();
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      return bad("Cross-origin requests are not accepted.", 403);
    }
  }

  /* 3. Body size. Next 16 route handlers have NO body limit of their own
        (`bodySizeLimit` is a serverActions option and does not apply here), so
        without this `request.json()` will buffer whatever arrives into a
        single shared process. */
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return bad("Request too large.", 413);
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return bad("Request too large.", 413);
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return bad("Malformed request.");
    }
    raw = parsed as Record<string, unknown>;
  } catch {
    return bad("Malformed request.");
  }

  /* 4. Honeypot. Answer 200 either way — an error tells a bot exactly which
        field tripped it, and it comes back with that field fixed.

        But LOG it. autoComplete="off" is a hint browsers routinely ignore, and
        if a password manager ever writes into _hp the visitor gets a thank-you
        page while their lead evaporates in silence. That is the worst failure
        this system can have, and the log is the only way it is ever visible.
        A weekly `grep '"t":"lead-hp"'` answers "is the honeypot eating
        humans?". */
  const hp = raw._hp;
  if (typeof hp === "string" && hp.trim() !== "") {
    // Password managers ignore autoComplete="off" and write the email (or
    // name/phone) into the hidden field. That is a human, not a bot — same
    // value in a visible field is the tell. Dropping those is worse than
    // letting a rare copy-paste bot through.
    const filled = hp.trim().toLowerCase();
    const sameAs = (v: unknown) =>
      typeof v === "string" && v.trim().toLowerCase() === filled;
    if (sameAs(raw.email) || sameAs(raw.name) || sameAs(raw.phone)) {
      logLead("lead-hp-autofill", { hp: hp.slice(0, 200) });
    } else {
      logLead("lead-hp", { hp: hp.slice(0, 200), body: raw });
      return ok();
    }
  }

  const { ip, chain } = clientKey(request);
  if (isOver(requestHits, ip, MAX_REQUESTS)) {
    return bad("Too many requests. Please try again in a few minutes.", 429);
  }
  record(requestHits, ip);

  /* 5. Read ONLY declared fields, and only if they are actually strings.
        Never spread the body: `{"__proto__": {...}}` is a prototype-pollution
        attempt, and it simply isn't in this allowlist. Never coerce either —
        String({}) is "[object Object]", which would sail through validation
        as a perfectly valid-looking junk lead. */
  const values: Record<string, string> = Object.create(null);
  for (const name of FIELD_NAMES) {
    const v = Object.hasOwn(raw, name) ? raw[name] : "";
    if (v !== undefined && v !== null && typeof v !== "string") {
      return bad(`Invalid value for "${name}".`);
    }
    let text = typeof v === "string" ? v : "";
    // Strip control characters from single-line fields. Not a header-injection
    // fix — lib/email.ts already handles that, and a newline in a *body* is
    // inert. This is about the human reading the lead: a name of
    // "Eve\nBudget: $50,000" renders as an extra row in the email and reads
    // exactly like a field the visitor filled in. `notes` keeps its newlines,
    // because there it is real formatting.
    if (!MULTILINE.has(name)) text = text.replace(/[\u0000-\u001f\u007f]+/g, " ");
    else text = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "");
    values[name] = text.trim();
  }
  const hasNoSite = raw.hasNoSite === true;

  /* 6. Server-side validation. The client's checks are UX; this is the door. */
  for (const name of REQUIRED_SERVER) {
    if (!fieldValid(name, values[name] ?? "", REQUIRED_SERVER)) {
      return bad(FIELD_ERRORS[name] ?? `Please check the "${name}" field.`);
    }
  }
  // Optional fields still have to respect their caps.
  for (const name of FIELD_NAMES) {
    if (!fieldValid(name, values[name] ?? "", REQUIRED_SERVER)) {
      return bad(FIELD_ERRORS[name] ?? `Please check the "${name}" field.`);
    }
  }

  const lead: Lead = {
    name: values.name!,
    email: values.email!,
    phone: values.phone!,
    website: values.website,
    hasNoSite,
    need: values.need,
    budget: values.budget,
    notes: values.notes,
    ip,
    userAgent: (request.headers.get("user-agent") ?? "").slice(0, 400),
    receivedAt: new Date(),
  };

  /* 7. The lead is now safe on disk regardless of what SMTP does.
        `chain` rides along so the correct x-forwarded-for index can be pinned
        from a real request instead of guessed (see clientKey). */
  logLead("lead", { ...lead, xff: chain });

  /* 8. Tight limit, keyed on the address too. The email key is the one an
        attacker cannot spoof with a header, and it is what stops someone
        using our autoresponder to flood a stranger's inbox. */
  const addr = lead.email.toLowerCase();
  const keys = [`${ip}|${addr}`, `email:${addr}`];
  if (keys.some((k) => isOver(sendHits, k, MAX_SENDS))) {
    return bad("Too many requests. Please try again in a few minutes.", 429);
  }
  keys.forEach((k) => record(sendHits, k));

  /* 9. The lead email is the one that matters. */
  try {
    await sendLeadEmail(lead);
  } catch (err) {
    // Message and code only. Some nodemailer errors carry the whole transport
    // config, auth included, and writing the SMTP password into the runtime 
    // log is exactly the thing the rest of this file exists to prevent.
    const e = err as { message?: string; code?: string };
    console.error(`[contact] send failed: ${e?.code ?? ""} ${e?.message ?? "unknown"}`);
    logLead("lead-send-failed", { email: lead.email, at: lead.receivedAt.toISOString() });
    // Never the provider's message — it quotes host, user and config.
    return bad("Could not send your message. Please try again.", 502);
  }

  /* 10. The receipt is a courtesy. The lead already reached us and is already
         logged, so a failure here must not show the visitor an error. */
  try {
    await sendLeadReceipt(lead);
  } catch (err) {
    const e = err as { message?: string; code?: string };
    console.error(`[contact] receipt failed: ${e?.code ?? ""} ${e?.message ?? "unknown"}`);
  }

  return ok();
}