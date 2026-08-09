export default function Home() {
  // Temporary P0 type specimen — replaced as sections land.
  return (
    <main style={{ padding: "10vh 4vw", display: "grid", gap: "2rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-family-display)",
          fontSize: "var(--text-display-lg)",
          lineHeight: "var(--leading-display)",
          letterSpacing: "var(--tracking-display)",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        Studio Digital
      </h1>
      <p
        style={{
          fontFamily: "var(--font-family-accent)",
          fontSize: "10vw",
          lineHeight: 1,
        }}
      >
        NUDOT
      </p>
      <p style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-meta)" }}>
        （ 守護美學核心，定義數位落點 ） — DM SANS BODY 400
      </p>
    </main>
  );
}
