"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  FORM_FIELDS,
  FIELD_ERRORS,
  EMAIL_RE,
  SUCCESS,
  SENDING_LABEL,
} from "./contact-data";

type Values = Record<string, string>;

const EMPTY: Values = FORM_FIELDS.reduce<Values>((acc, f) => {
  acc[f.name] = "";
  return acc;
}, {});

/** A field is valid when it isn't required-empty and, for email, matches. */
function fieldValid(name: string, value: string): boolean {
  const v = value.trim();
  if (name === "email") return EMAIL_RE.test(v);
  if (name === "name" || name === "phone") return v.length > 0;
  return true;
}

const REQUIRED = FORM_FIELDS.filter((f) => f.required).map((f) => f.name);

/**
 * UI-only contact form: full validation, sending overlay and success
 * lightbox, but nothing is transmitted. Wire the submit handler to a real
 * endpoint when one exists.
 */
export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number>(0);

  const modalOpen = sending || done;

  // Suppress the blend-mode chrome while a blurred panel is on screen —
  // screen-blended grain over backdrop-filter is a compositing artifact.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("ct-modal-open", modalOpen);
    return () => html.classList.remove("ct-modal-open");
  }, [modalOpen]);

  useEffect(() => {
    if (!done) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDone(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [done]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const showsError = (name: string) =>
    touched[name] && !fieldValid(name, values[name] ?? "");

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
        `[name="${invalid[0]}"]`
      );
      first?.focus({ preventScroll: true });
      return;
    }

    setSending(true);
    timerRef.current = window.setTimeout(() => {
      setSending(false);
      setValues(EMPTY);
      setTouched({});
      setDone(true);
    }, 1400);
  };

  return (
    <div className="ct-form-area">
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
              (values[f.name] ?? "").trim().length > 0;
            const errorId = `${f.name}-error`;

            return (
              <div
                key={f.name}
                className={`ct-field-group${invalid ? " is-invalid" : ""}${
                  valid ? " is-valid" : ""
                }`}
                data-cursor="TYPE"
              >
                <label className="ct-field-label" htmlFor={`f_${f.name}`}>
                  {f.label}
                  {f.required && (
                    <span className="ct-req" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  )}
                </label>

                {f.multiline ? (
                  <textarea
                    id={`f_${f.name}`}
                    name={f.name}
                    className="ct-input ct-textarea"
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.name]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    id={`f_${f.name}`}
                    name={f.name}
                    type={f.type}
                    className="ct-input"
                    placeholder={f.placeholder}
                    autoComplete={f.autoComplete}
                    required={f.required}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? errorId : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.name]: e.target.value }))
                    }
                    onBlur={() =>
                      setTouched((t) => ({ ...t, [f.name]: true }))
                    }
                  />
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
            {sending ? "Sending…" : "Submit"}
          </button>
        </div>
      </form>

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

      {done && (
        <div
          className="ct-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ct-lb-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDone(false);
          }}
        >
          <div className="ct-lightbox__box">
            <img
              className="ct-lightbox__mark"
              src="/images/contact.svg"
              alt=""
              width={50}
              height={36}
            />
            <h2 className="ct-lightbox__title" id="ct-lb-title">
              {SUCCESS.title}
            </h2>
            <p className="ct-lightbox__sub">{SUCCESS.sub}</p>
            <button
              type="button"
              className="ct-submit ct-lightbox__close"
              ref={closeRef}
              data-cursor="CLOSE"
              onClick={() => setDone(false)}
            >
              {SUCCESS.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
