export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel";
  placeholder: string;
  required: boolean;
  multiline?: boolean;
  autoComplete?: string;
}

/**
 * The five visible fields. The original's "services you need" button group,
 * its dependent budget rows, and the captcha are deliberately omitted.
 */
export const FORM_FIELDS: FormField[] = [
  {
    name: "name",
    label: "Name",
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
    name: "company",
    label: "Company (optional)",
    type: "text",
    placeholder: "Company name",
    required: false,
    autoComplete: "organization",
  },
  {
    name: "message",
    label: "Project Details",
    type: "text",
    placeholder: "Tell us about your project…",
    required: false,
    multiline: true,
  },
];

export const FIELD_ERRORS: Record<string, string> = {
  name: "Please fill in your name.",
  email: "Please fill in a valid email address.",
  phone: "Please fill in your phone number.",
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const HERO = {
  left: "LET'S",
  right: "TALK",
  mobile: "CONTACT",
  desc: ["ABOUT YOUR NEXT BIG", "DIGITAL TRANSFORMATION"],
  year: "START CONVERSATION",
  kicker: "( CONTACT US )",
  tags: "VISION | EXPERIENCE | EXECUTION",
};

export const MARQUEE_WORD = "LET'S TALK";
export const MARQUEE_REPEAT = 8;

export const SUCCESS = {
  title: "RECEIVED",
  sub: "Thank you. We will respond shortly.",
  close: "Close",
};

export const SENDING_LABEL = "Sending";
