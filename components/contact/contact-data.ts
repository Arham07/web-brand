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
