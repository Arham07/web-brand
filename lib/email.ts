import "server-only";
import nodemailer from "nodemailer";

/**
 * The only module that knows who the mail provider is.
 *
 * Hostinger SMTP, because the mailbox already lives there: mail leaves the
 * server that is this domain's actual MX host, so SPF and DKIM align with no
 * DNS work at all. Swapping to Resend/SES later is a change to this file and
 * nothing else.
 *
 * `server-only` at the top is not decoration — it makes an accidental import
 * from a client component a build error rather than an SMTP password shipped
 * in a JavaScript bundle.
 */

export interface Lead {
  name: string;
  email: string;
  phone: string;
  website?: string;
  /** the "I don't have one yet" tick — never inferred from an empty website */
  hasNoSite?: boolean;
  need?: string;
  budget?: string;
  notes?: string;
  ip?: string;
  userAgent?: string;
  /** stamped by the route, so the log line and the email agree to the ms */
  receivedAt: Date;
}

export class EmailConfigError extends Error {}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new EmailConfigError(`Missing required env var: ${key}`);
  return v;
}

/** `&` first — escaping it later would double-escape the entities we just added. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Mail headers are line-oriented: a CR or LF in a visitor-supplied name is a
 * header injection — `Name\r\nBcc: someone@else` turns this endpoint into an
 * open relay. Angle brackets go too, because nodemailer re-parses address
 * strings, so a name of `x <attacker@evil.com>` would silently redirect the
 * reply. Everything that reaches Subject or an address header comes through
 * here, and addresses use the object form so a display name is never parsed
 * as an address in the first place.
 */
function headerSafe(value: string, max = 120): string {
  return value
    .replace(/[\r\n<>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * A link is only ever built for http(s). Without this, a `website` of
 * `javascript:…` or `data:text/html,…` becomes a live link inside our own
 * mail client. A bare `acme.com` gets https:// so it stays one tap away;
 * anything else renders as plain text with no href at all.
 */
function safeHref(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  // A scheme we don't recognise — never link it.
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return undefined;
  return `https://${v}`;
}

function buildTransport() {
  const host = requireEnv("SMTP_HOST");
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const port = Number(process.env.SMTP_PORT ?? 465);
  if (!Number.isFinite(port) || port <= 0) {
    throw new EmailConfigError(`SMTP_PORT is not a valid port: ${process.env.SMTP_PORT}`);
  }

  return nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 is plaintext then STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    // No `pool: true`, deliberately (and it is the default, so it isn't set
    // here at all). This is one long-lived Node process, so a pool *would* be
    // reused — but at a handful of leads a day the socket sits idle for hours,
    // and a pool gone stale overnight fails the first lead of the morning. A
    // fresh connection costs ~300ms and never surprises us. Building the
    // transport per call also keeps the env reads lazy, so a missing variable
    // is one logged 502 rather than a crash at import time.
    // Without these a hung SMTP server hangs the request, and on a shared
    // single-process host that is how you run out of sockets.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/* ------------------------------------------------------------------ */
/*  1. The lead email — to us                                          */
/* ------------------------------------------------------------------ */

type Row = { k: string; v: string; href?: string; strong?: boolean; meta?: boolean };

function rowsFor(lead: Lead): Row[] {
  const raw = lead.website?.trim() ?? "";
  // The tick replaces the value rather than annotating a dash: "—" reads as
  // missing data, "No site yet" reads as an answer — and a greenfield build
  // is a *positive* qualifier, not an absence.
  const site = lead.hasNoSite ? "No site yet — starting from scratch" : raw || "—";
  const siteHref = lead.hasNoSite ? undefined : safeHref(raw);

  return [
    { k: "Name", v: lead.name },
    { k: "Email", v: lead.email, href: `mailto:${lead.email}` },
    { k: "Phone", v: lead.phone, href: `tel:${lead.phone.replace(/[^\d+]/g, "")}` },
    { k: "Website", v: site, href: siteHref },
    // The two rows the decision actually turns on.
    { k: "Needs", v: lead.need?.trim() || "—", strong: true },
    { k: "Budget", v: lead.budget?.trim() || "Not given", strong: true },
    { k: "Notes", v: lead.notes?.trim() || "—" },
    {
      k: "Submitted",
      v: `${lead.receivedAt.toLocaleString("en-GB", { timeZone: "Asia/Karachi" })} PKT · ${lead.receivedAt.toISOString()}`,
      meta: true,
    },
    { k: "IP", v: lead.ip || "—", meta: true },
    { k: "User agent", v: lead.userAgent || "—", meta: true },
  ];
}

function renderHtml(lead: Lead, rows: Row[]): string {
  const cells = rows
    .map((r) => {
      const label = r.meta ? "#6b727c" : "#8b9199";
      const size = r.meta ? "11px" : r.strong ? "15px" : "14px";
      const weight = r.strong ? "600" : "400";
      const bg = r.strong ? "background:#1b1d22;" : "";
      const top = r.meta ? "border-top:1px solid #23262b;" : "";
      const value = r.href
        ? `<a href="${esc(r.href)}" style="color:#c7ccd4;text-decoration:underline;">${esc(r.v)}</a>`
        : esc(r.v);
      return `<tr>
  <td style="${bg}${top}padding:10px 14px;color:${label};font-size:11px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">${esc(r.k)}</td>
  <td style="${bg}${top}padding:10px 14px;color:#e8eaed;font-size:${size};font-weight:${weight};line-height:1.6;">${value}</td>
</tr>`;
    })
    .join("\n");

  return `<!doctype html><html><body style="margin:0;background:#0a0b0c;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;margin:0 auto;background:#111318;border:1px solid #23262b;border-radius:10px;">
<tr><td style="padding:20px 14px 6px;color:#fff;font-size:16px;font-weight:600;">New lead — American Web Guild</td></tr>
<tr><td style="padding:0 0 8px;"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
${cells}
</table></td></tr>
<tr><td style="padding:12px 14px 20px;color:#6b727c;font-size:12px;">Hit Reply to answer ${esc(headerSafe(lead.name, 64))} directly.</td></tr>
</table></body></html>`;
}

function renderText(lead: Lead, rows: Row[]): string {
  const body = rows
    .filter((r) => !r.meta)
    .map((r) => `${r.k}: ${r.v}`)
    .join("\n");
  const meta = rows
    .filter((r) => r.meta)
    .map((r) => `${r.k}: ${r.v}`)
    .join("\n");
  return `New lead — American Web Guild\n\n${body}\n\n---\n${meta}\n\nHit Reply to answer ${headerSafe(lead.name, 64)} directly.\n`;
}

function smtpErr(err: unknown) {
  const e = err as {
    message?: string;
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
  };
  return {
    code: e?.code ?? "unknown",
    responseCode: e?.responseCode,
    command: e?.command,
    message: e?.message ?? "unknown",
  };
}

export async function sendLeadEmail(lead: Lead): Promise<void> {
  try {
    const user = requireEnv("SMTP_USER");
    const to = process.env.CONTACT_TO_EMAIL || "info@americanwebguild.com";
    const rows = rowsFor(lead);

    // Name first so repeat submissions from one person thread together;
    // need · budget means the inbox list is already a qualification queue.
    const parts = [headerSafe(lead.name, 60)];
    if (lead.need?.trim()) parts.push(headerSafe(lead.need, 40));
    if (lead.budget?.trim()) parts.push(headerSafe(lead.budget, 40));

    console.log("[email] sendLeadEmail: attempting", {
      to,
      from: user,
      replyTo: lead.email,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ?? "465",
    });

    const info = await buildTransport().sendMail({
      // Must be the authenticated mailbox. Hostinger refuses to send as anything
      // else, and a visitor's address here would fail SPF and land in spam.
      from: { name: "American Web Guild", address: user },
      to,
      // Object form, never `"Name <addr>"` — see headerSafe().
      replyTo: { name: headerSafe(lead.name, 64), address: lead.email },
      subject: `New lead — ${parts.join(" · ")}`,
      text: renderText(lead, rows),
      html: renderHtml(lead, rows),
      headers: { "X-Lead-Source": "contact-form" },
    });

    console.log("[email] sendLeadEmail: SUCCESS", {
      to,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    console.error("[email] sendLeadEmail: FAILED", smtpErr(err));
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  2. The receipt — to the person who submitted                       */
/* ------------------------------------------------------------------ */

/**
 * Anyone can type anyone else's address into a public form, so this function
 * can be pointed at a stranger. Two rules keep that from being useful to an
 * attacker:
 *
 *   1. The body is STATIC. The only variable is a first name, stripped to
 *      letters and a couple of punctuation marks. Reflecting the visitor's
 *      own `notes` back would turn this endpoint into a free anonymous mailer
 *      that sends arbitrary text from our domain — and gets that domain
 *      blacklisted, which kills every reply we ever send afterwards.
 *   2. A daily cap (below) stops a script turning one victim's inbox into a
 *      flood. The route additionally rate-limits on the submitted address.
 */
const RECEIPT_DAILY_CAP = 200;
let receiptCount = 0;
let receiptWindowStart = 0;

/** Letters, spaces and the punctuation that appears in real names. Nothing else. */
function safeFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const clean = first.replace(/[^\p{L}'-]/gu, "").slice(0, 40);
  return clean || "there";
}

export async function sendLeadReceipt(lead: Lead): Promise<void> {
  try {
    const now = Date.now();
    if (now - receiptWindowStart > 24 * 60 * 60 * 1000) {
      receiptWindowStart = now;
      receiptCount = 0;
    }
    if (receiptCount >= RECEIPT_DAILY_CAP) {
      // A circuit breaker, not an error: the lead itself has already been mailed
      // and logged. Only the courtesy copy is suppressed.
      throw new Error(`Receipt daily cap reached (${RECEIPT_DAILY_CAP})`);
    }
    receiptCount += 1;

    const user = requireEnv("SMTP_USER");
    const first = safeFirstName(lead.name);

    const text = `Hi ${first},

Thanks — we've got your request, and it's already with a designer.

What happens next:
  • Within 1 business hour, a real human replies.
  • Within 72 hours, your custom homepage concept lands in your inbox.
  • It's free, yours to keep, and there's no call unless you ask for one.

One favour: add info@americanwebguild.com to your contacts, so the concept
doesn't end up in a spam folder.

— American Web Guild
https://americanwebguild.com
`;

    const html = `<!doctype html><html><body style="margin:0;background:#0a0b0c;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;background:#111318;border:1px solid #23262b;border-radius:10px;">
<tr><td style="padding:26px 24px 8px;color:#fff;font-size:18px;font-weight:600;">Hi ${esc(first)}, we've got it.</td></tr>
<tr><td style="padding:0 24px 16px;color:#c3c7cd;font-size:14px;line-height:1.7;">Your request is already with a designer.</td></tr>
<tr><td style="padding:0 24px 6px;color:#c3c7cd;font-size:14px;line-height:1.8;">
  <strong style="color:#fff;">Within 1 business hour</strong> — a real human replies.<br>
  <strong style="color:#fff;">Within 72 hours</strong> — your custom homepage concept lands in your inbox.<br>
  Free, yours to keep, and no call unless you ask for one.
</td></tr>
<tr><td style="padding:16px 24px 24px;color:#8b9199;font-size:12px;line-height:1.7;border-top:1px solid #23262b;">
  One favour: add <span style="color:#c7ccd4;">info@americanwebguild.com</span> to your contacts, so the concept doesn't end up in a spam folder.<br><br>
  — American Web Guild
</td></tr>
</table></body></html>`;

    console.log("[email] sendLeadReceipt: attempting", {
      to: lead.email,
      from: user,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ?? "465",
    });

    const info = await buildTransport().sendMail({
      from: { name: "American Web Guild", address: user },
      to: lead.email,
      replyTo: { name: "American Web Guild", address: user },
      subject: "We've got your request — concept within 72 hours",
      text,
      html,
      headers: { "X-Lead-Source": "contact-form-receipt", "Auto-Submitted": "auto-replied" },
    });

    console.log("[email] sendLeadReceipt: SUCCESS", {
      to: lead.email,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    console.error("[email] sendLeadReceipt: FAILED", smtpErr(err));
    throw err; 
  }
}