export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "choice";
  placeholder?: string;
  required: boolean;
  multiline?: boolean;
  autoComplete?: string;
  /** choice fields render as a single-select chip row */
  options?: readonly string[];
}

/**
 * The form asks what producing a free homepage concept requires (copy doc
 * C-02, adapted). Phone is required by the owner's decision — the doc
 * recommends optional for cold traffic, noted here so the trade-off is on
 * the record if completion rates need investigating later.
 */
export const FORM_FIELDS: FormField[] = [
  {
    name: "name",
    label: "Your name",
    type: "text",
    placeholder: "Your name",
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "Your phone number",
    required: true,
    autoComplete: "tel",
  },
  {
    // required, but satisfied by the "I don't have one yet" tick —
    // the concept needs either a site to react to or that explicit signal
    name: "website",
    label: "Your current website",
    type: "text",
    placeholder: "yoursite.com",
    required: true,
    autoComplete: "url",
  },
  {
    name: "need",
    label: "What do you need?",
    type: "choice",
    required: true,
    options: [
      "New website",
      "Redesign",
      "E-commerce",
      "Landing page",
      "Not sure yet",
    ],
  },
  {
    // "Tell me what it should be" deliberately captures the buyer who
    // genuinely doesn't know — often the best lead on the list
    name: "budget",
    label: "Budget (optional)",
    type: "choice",
    required: false,
    options: [
      "Under $500",
      "$500–$1,500",
      "$1,500–$5,000",
      "$5,000+",
      "Tell me what it should be",
    ],
  },
  {
    name: "notes",
    label: "Anything else? (optional)",
    type: "text",
    placeholder: "Timeline, examples you like, anything useful…",
    required: false,
    multiline: true,
  },
];

export const FIELD_ERRORS: Record<string, string> = {
  name: "Please fill in your name.",
  email: "Please fill in a valid email address.",
  phone: "Please fill in your phone number.",
  website: "Add your site — or tick “I don’t have one yet.”",
  need: "Pick the closest one — “Not sure yet” is fine.",
};

export const NO_SITE_LABEL = "I don’t have one yet";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const HERO = {
  left: "LET'S",
  right: "TALK",
  mobile: "CONTACT",
  desc: ["GET YOUR FREE HOMEPAGE", "CONCEPT — IN 72 HOURS"],
  year: "NO CALL REQUIRED",
  kicker: "( Start a Conversation )",
  tags: "FREE | 72 HOURS | YOURS TO KEEP",
};

/** C-01 — restated offer above the form, where ads may land directly. */
export const FORM_INTRO = {
  heading: "Get your free homepage concept.",
  sub: "Sixty seconds to fill this out. Within 72 hours you’ll have a custom homepage design for your business — free, no call required, no obligation, yours to keep.",
  trust: "Free · 72-hour turnaround · No sales call · We reply within 1 business hour",
};

/** C-04 — removes the anxiety that stops the click. Lives beside the form. */
export const WHAT_HAPPENS = {
  heading: "What happens after you hit send.",
  steps: [
    {
      k: "Within 1 business hour",
      v: "a real human replies. Sometimes with a question, always with a name.",
    },
    {
      k: "Within 72 hours",
      v: "your custom homepage concept lands in your inbox. No payment, no call, no catch.",
    },
    {
      k: "Your call",
      v: "want the rest? We start, and you’re live in 14 days. Don’t? Keep the concept, no hard feelings.",
    },
  ],
  emailLine: "Or just email us — info@americanwebguild.com",
} as const;

export const SUBMIT_LABEL = "Send My Free Concept";
export const UNDER_BUTTON =
  "No spam, ever. No sales call unless you ask for one. We reply within 1 business hour.";

export const MARQUEE_WORD = "LET'S TALK";
export const MARQUEE_REPEAT = 8;

export const SENDING_LABEL = "Sending";

/* ------------------------------------------------------------------ */
/*  Validation — one rule set, used by the form AND by /api/contact.   */
/* ------------------------------------------------------------------ */

/**
 * Per-field caps. The form itself has no length limits — these exist because
 * a submit is just an HTTP request, and nothing stops someone posting a
 * megabyte of "notes" straight at the endpoint.
 */
export const MAX_LENGTHS: Record<string, number> = {
  name: 120,
  email: 200,
  phone: 40,
  website: 300,
  // need/budget are capped, not allowlisted — see fieldValid().
  need: 60,
  budget: 60,
  notes: 4000,
};

/**
 * What the *form* refuses to submit — derived from the `required` flags so
 * the two can never drift apart. Includes `website`.
 */
export const REQUIRED_CLIENT: readonly string[] = FORM_FIELDS.filter(
  (f) => f.required
).map((f) => f.name);

/**
 * What the *API* refuses to accept — deliberately looser than the client.
 *
 * `website` is missing on purpose. The form counts it as satisfied by the
 * "I don't have one yet" tick, and that tick is React state that never
 * crosses the wire as a field value. Enforcing `website` server-side would
 * mean re-deriving the rule from a boolean the client might one day fail to
 * send, and the failure mode is a 400 on a lead that arrived from a paid
 * click. An underspecified lead costs a follow-up question; a rejected one
 * costs the click.
 */
export const REQUIRED_SERVER: readonly string[] = [
  "name",
  "email",
  "phone",
  "need",
];

/**
 * One field, one verdict. Pure — no component state, no request context. The
 * only variable is which names count as required, so the form can be strict
 * and the API lenient without two copies of the rule going out of sync.
 *
 * `need` and `budget` are length-capped free strings rather than checked
 * against their `options`. A visitor on a bundle cached from before a copy
 * change would otherwise be rejected for picking a chip we showed them. The
 * values are escaped where they are rendered, so an unexpected string is a
 * cosmetic problem, never a security one.
 */
export function fieldValid(
  name: string,
  value: string,
  required: readonly string[] = REQUIRED_CLIENT
): boolean {
  const v = value.trim();
  if (v.length > (MAX_LENGTHS[name] ?? 200)) return false;
  // An optional email still has to look like an email if one was typed.
  if (name === "email") {
    return required.includes("email") || v !== "" ? EMAIL_RE.test(v) : true;
  }
  return required.includes(name) ? v.length > 0 : true;
}

/**
 * Shown when the send genuinely failed. `sub` is the fallback — the server's
 * own message is preferred when it wrote one for a human (a validation
 * complaint, the rate limit), since it is more specific. The mailto is the
 * point of the dialog: someone the form can't serve should still be able to
 * reach us.
 */
export const FAILURE = {
  title: "NOT SENT",
  sub: "Something broke on our end — your details are still in the form.",
  timeout: "That took too long. Check your connection and hit send again.",
  fallback: "Or email us directly at",
  email: "info@americanwebguild.com",
  close: "Try again",
} as const;
