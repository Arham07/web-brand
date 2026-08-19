"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FORM_FIELDS,
  FIELD_ERRORS,
  REQUIRED_CLIENT,
  fieldValid,
  FAILURE,
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

/**
 * The contact form (copy doc C-02, adapted): seven fields, choice
 * chips instead of dropdowns, and a redirect to /thank-you on success —
 * the page the Meta Lead event will fire from once the pixel is installed.
 *
 * Submits to /api/contact, which mails the lead to info@ and sends the
 * visitor a receipt. Success is the redirect; failure raises a dialog that
 * keeps every value typed so far, because asking someone to retype seven
 * fields after a network blip is how a paid click gets thrown away.
 */

/** Give up rather than leave the button stuck on "Sending…" forever. */
const REQUEST_TIMEOUT_MS = 15_000;
/** If the client-side route change stalls, get there the blunt way. */
const NAV_FAILSAFE_MS = 2_500;
export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [noSite, setNoSite] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number>(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  // `sending` is state because it drives the overlay; this is the re-entry
  // guard. Enter inside a text input can fire submit before React has
  // committed the disabled attribute, and a duplicate submit is a duplicate
  // email in someone's inbox.
  const sendingRef = useRef(false);

  // Suppress the blend-mode chrome while either overlay is up.
  const modalOpen = sending || error !== null;
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("ct-modal-open", modalOpen);
    return () => html.classList.remove("ct-modal-open");
  }, [modalOpen]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (error === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setError(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [error]);

  // The one rule the server can't share: the "I don't have one yet" tick is
  // React state, so it never crosses the wire as a field value. It stays here,
  // layered on top of the shared rule, rather than being reconstructed
  // server-side from a boolean the client might fail to send.
  const validate = (name: string, value: string): boolean =>
    name === "website" && noSite
      ? true
      : fieldValid(name, value, REQUIRED_CLIENT);

  const showsError = (name: string) =>
    touched[name] && !validate(name, values[name] ?? "");

  const setValue = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sendingRef.current) return;

    const hp =
      (formRef.current?.elements.namedItem("_hp") as HTMLInputElement)?.value ??
      "";

    // Honeypot-filled submissions skip validation on purpose and are posted
    // anyway: the server answers 200 without sending, and arguing with a bot
    // about its phone number only tells it which field to fix next time.
    if (!hp) {
      const invalid = REQUIRED_CLIENT.filter(
        (n) => !validate(n, values[n] ?? "")
      );
      if (invalid.length) {
        setTouched((t) => ({
          ...t,
          ...Object.fromEntries(REQUIRED_CLIENT.map((n) => [n, true])),
        }));
        formRef.current
          ?.querySelector<HTMLElement>(
            `[name="${invalid[0]}"], [data-field="${invalid[0]}"]`
          )
          ?.focus({ preventScroll: true });
        return;
      }
    }

    sendingRef.current = true;
    setSending(true);
    setError(null);

    const abort = new AbortController();
    const timeout = window.setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);

    try {
      // No trailing slash: the app redirects /path → /path/ with a 308, and
      // paying for that round trip on every submit is pure waste.
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `hasNoSite` travels so the email can say "starting from scratch".
        // The API does not validate `website` against it — see contact-data.
        body: JSON.stringify({ ...values, hasNoSite: noSite, _hp: hp }),
        signal: abort.signal,
        cache: "no-store",
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        // Prefer the server's message when it wrote one for a human (a
        // validation complaint, the rate limit); fall back otherwise.
        setError(data?.error || FAILURE.sub);
        sendingRef.current = false;
        setSending(false);
        return;
      }

      // HTTP 200 and nothing else. Firing this before the send — as the
      // simulated version did — reports conversions that never reached the
      // inbox, and the ad platform then optimises toward whatever we told it.
      // Suppressed for honeypot hits: the server answered 200 without
      // sending, so counting it would train the campaign on bots.
      if (!hp) {
        (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
          event: "lead_form_submitted",
        });
      }

      // `sending` stays true across the navigation so the overlay covers the
      // gap instead of flashing the form back. The component unmounts on
      // arrival and its cleanup drops `ct-modal-open`.
      router.push("/thank-you");
      timerRef.current = window.setTimeout(() => {
        if (window.location.pathname !== "/thank-you") {
          window.location.assign("/thank-you");
        }
      }, NAV_FAILSAFE_MS);
    } catch (err) {
      // A network failure here doesn't prove the lead was lost — the server
      // may have logged and mailed it already. We can't know, so we show the
      // failure; the server's own log is what makes a false alarm recoverable.
      setError(
        (err as Error)?.name === "AbortError" ? FAILURE.timeout : FAILURE.sub
      );
      sendingRef.current = false;
      setSending(false);
    } finally {
      window.clearTimeout(timeout);
      // Deliberately no setSending(false) here — on the success path that
      // would tear the overlay down mid-navigation.
    }
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

      {/* Failure. Values are never cleared — the whole point is that someone
          who just filled seven fields doesn't have to do it twice. The mailto
          is the escape hatch for the case where the endpoint is the problem;
          TransitionProvider exempts mailto:, so it won't fire a page
          transition on the way out. */}
      {error !== null && (
        <div
          className="ct-lightbox is-error"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="ct-lb-error-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setError(null);
          }}
        >
          <div className="ct-lightbox__box">
            <h2 className="ct-lightbox__title" id="ct-lb-error-title">
              {FAILURE.title}
            </h2>
            <p className="ct-lightbox__sub">{error}</p>
            <p className="ct-lightbox__fallback">
              {FAILURE.fallback}{" "}
              <a href={`mailto:${FAILURE.email}`}>{FAILURE.email}</a>
            </p>
            <button
              type="button"
              className="ct-submit ct-lightbox__close"
              ref={closeRef}
              data-cursor="CLOSE"
              onClick={() => setError(null)}
            >
              {FAILURE.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
