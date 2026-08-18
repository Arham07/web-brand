"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FORM_FIELDS,
  FIELD_ERRORS,
  EMAIL_RE,
  NO_SITE_LABEL,
  FORM_INTRO,
  WHAT_HAPPENS,
  SUBMIT_LABEL,
  UNDER_BUTTON,
  SENDING_LABEL,
} from "./contact-data";

type Values = Record<string, string>;

const EMPTY: Values = FORM_FIELDS.reduce<Values>((acc, f) => {
  acc[f.name] = "";
  return acc;
}, {});

const REQUIRED = FORM_FIELDS.filter((f) => f.required).map((f) => f.name);

/**
 * The contact form (copy doc C-02, adapted): seven fields, choice
 * chips instead of dropdowns, and a redirect to /thank-you on success —
 * the page the Meta Lead event will fire from once the pixel is installed.
 *
 * TODO(backend): submission is still simulated. When the PHP endpoint lands
 * (deferred by request), only the send step below changes — the validation,
 * the states and the redirect stay as they are.
 */
export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [noSite, setNoSite] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number>(0);

  // Suppress the blend-mode chrome while the sending overlay is up.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("ct-modal-open", sending);
    return () => html.classList.remove("ct-modal-open");
  }, [sending]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const fieldValid = (name: string, value: string): boolean => {
    const v = value.trim();
    if (name === "email") return EMAIL_RE.test(v);
    if (name === "website") return noSite || v.length > 0;
    if (REQUIRED.includes(name)) return v.length > 0;
    return true;
  };

  const showsError = (name: string) =>
    touched[name] && !fieldValid(name, values[name] ?? "");

  const setValue = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;

    // Honeypot: a filled hidden field means a bot — pretend success.
    const hp = (formRef.current?.elements.namedItem("_hp") as HTMLInputElement)
      ?.value;

    const invalid = REQUIRED.filter((n) => !fieldValid(n, values[n] ?? ""));
    if (invalid.length && !hp) {
      setTouched((t) => ({
        ...t,
        ...Object.fromEntries(REQUIRED.map((n) => [n, true])),
      }));
      const first = formRef.current?.querySelector<HTMLElement>(
        `[name="${invalid[0]}"], [data-field="${invalid[0]}"]`
      );
      first?.focus({ preventScroll: true });
      return;
    }

    setSending(true);
    // Simulated send (see TODO above). The redirect target is the real one:
    // /thank-you is the campaign's conversion destination (doc C-05).
    timerRef.current = window.setTimeout(() => {
      (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
        event: "lead_form_submitted",
      });
      router.push("/thank-you");
    }, 1200);
  };

  return (
    <div className="ct-form-area">
      <div className="ct-intro">
        <h2 className="ct-intro__heading">{FORM_INTRO.heading}</h2>
        <p className="ct-intro__sub">{FORM_INTRO.sub}</p>
        <p className="ct-intro__trust">{FORM_INTRO.trust}</p>
      </div>

      <div className="ct-form-layout">
        <form
          id="contactForm"
          className="ct-form"
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
        >
          {/* honeypot — off-screen, never focusable */}
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="ct-honeypot"
          />

          <div className="ct-fields">
            {FORM_FIELDS.map((f) => {
              const invalid = showsError(f.name);
              const valid =
                touched[f.name] &&
                !invalid &&
                ((values[f.name] ?? "").trim().length > 0 ||
                  (f.name === "website" && noSite));
              const errorId = `${f.name}-error`;

              return (
                <div
                  key={f.name}
                  className={`ct-field-group${invalid ? " is-invalid" : ""}${
                    valid ? " is-valid" : ""
                  }`}
                  data-cursor={f.type === "choice" ? "PICK" : "TYPE"}
                >
                  <label
                    className="ct-field-label"
                    htmlFor={f.type === "choice" ? undefined : `f_${f.name}`}
                  >
                    {f.label}
                    {f.required && (
                      <span className="ct-req" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    )}
                  </label>

                  {f.type === "choice" ? (
                    <div
                      className="ct-chips"
                      role="radiogroup"
                      aria-label={f.label}
                      data-field={f.name}
                      tabIndex={-1}
                    >
                      {f.options?.map((opt) => {
                        const active = values[f.name] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            className={`ct-chip${active ? " is-active" : ""}`}
                            onClick={() => {
                              setValue(f.name, active ? "" : opt);
                              setTouched((t) => ({ ...t, [f.name]: true }));
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : f.multiline ? (
                    <textarea
                      id={`f_${f.name}`}
                      name={f.name}
                      className="ct-input ct-textarea"
                      placeholder={f.placeholder}
                      value={values[f.name] ?? ""}
                      onChange={(e) => setValue(f.name, e.target.value)}
                    />
                  ) : (
                    <div className="ct-input-wrap">
                      <input
                        id={`f_${f.name}`}
                        name={f.name}
                        type={f.type}
                        className="ct-input"
                        placeholder={f.placeholder}
                        autoComplete={f.autoComplete}
                        required={f.required}
                        disabled={f.name === "website" && noSite}
                        aria-invalid={invalid || undefined}
                        aria-describedby={invalid ? errorId : undefined}
                        value={values[f.name] ?? ""}
                        onChange={(e) => setValue(f.name, e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, [f.name]: true }))
                        }
                      />
                      {f.name === "website" && (
                        <label className="ct-nosite">
                          <input
                            type="checkbox"
                            checked={noSite}
                            onChange={(e) => {
                              setNoSite(e.target.checked);
                              if (e.target.checked) setValue("website", "");
                              setTouched((t) => ({ ...t, website: true }));
                            }}
                          />
                          <span>{NO_SITE_LABEL}</span>
                        </label>
                      )}
                    </div>
                  )}

                  {f.required && (
                    <p
                      id={errorId}
                      className={`ct-field-error${invalid ? " is-visible" : ""}`}
                      role={invalid ? "alert" : undefined}
                    >
                      {FIELD_ERRORS[f.name]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ct-submit-wrap">
            <button
              type="submit"
              className="ct-submit"
              data-cursor="SEND"
              disabled={sending}
            >
              {sending ? "Sending…" : `${SUBMIT_LABEL} →`}
            </button>
            <p className="ct-under-button">{UNDER_BUTTON}</p>
          </div>
        </form>

        <aside className="ct-aside" aria-label="What happens next">
          <h3 className="ct-aside__heading">{WHAT_HAPPENS.heading}</h3>
          <ol className="ct-steps">
            {WHAT_HAPPENS.steps.map((s) => (
              <li key={s.k} className="ct-step">
                <span className="ct-step__k">{s.k}</span>
                <span className="ct-step__v">{s.v}</span>
              </li>
            ))}
          </ol>
          <p className="ct-aside__email">
            Or just email us —{" "}
            <a href="mailto:info@americanwebguild.com">
              info@americanwebguild.com
            </a>
          </p>
        </aside>
      </div>

      {sending && (
        <div className="ct-sending" role="status" aria-live="polite">
          <img
            className="ct-sending__glass"
            src="/images/lab/hourglass.svg"
            alt=""
            width={52}
            height={66}
          />
          <span className="ct-sending__label">{SENDING_LABEL}</span>
        </div>
      )}
    </div>
  );
}
