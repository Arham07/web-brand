interface Props {
  title: string;
  caption: string;
}

/** Minimal dark placeholder used by the not-yet-designed routes. */
export default function PlaceholderPage({ title, caption }: Props) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        textAlign: "center",
        padding: "20vh 6vw",
      }}
    >
      <p
        style={{
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-caps)",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
        }}
      >
        ( {caption} )
      </p>
      <h1
        style={{
          fontFamily: "var(--font-family-display)",
          fontSize: "var(--text-display-md)",
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "var(--tracking-brand)",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "var(--text-sm)" }}>
        This page is a placeholder — content coming soon.
      </p>
      <a
        className="hairline-link"
        href="/"
        data-transition-label="Home"
        style={{
          marginTop: "2rem",
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-meta)",
          textTransform: "uppercase",
        }}
      >
        ← Back to home
      </a>
    </main>
  );
}
