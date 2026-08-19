import type { ReactNode } from "react";

/**
 * Renders the legal copy kept as markdown in `legal-content.ts`.
 *
 * Deliberately not a markdown library: these two documents use exactly six
 * constructs (h2, paragraph, bullet, bold, rule, and a plain address block),
 * and a dependency that parses arbitrary markdown — plus its HTML escape
 * hatch — is a bigger surface than the thing it renders. Nothing here ever
 * touches dangerouslySetInnerHTML, so no content in these files can inject
 * markup.
 */

/** `**bold**` → <strong>, everything else verbatim. */
function inline(text: string): ReactNode[] {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

export default function LegalDoc({ markdown }: { markdown: string }) {
  const blocks: ReactNode[] = [];
  const lines = markdown.trim().split("\n");
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul className="lg-list" key={`ul-${key++}`}>
        {bullets.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      continue;
    }
    flushBullets();

    if (!line.trim()) continue;

    if (line === "---") {
      blocks.push(<hr className="lg-rule" key={`hr-${key++}`} />);
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 className="lg-h2" key={`h2-${key++}`}>
          {line.slice(3)}
        </h2>
      );
    } else {
      blocks.push(
        <p className="lg-p" key={`p-${key++}`}>
          {inline(line)}
        </p>
      );
    }
  }
  flushBullets();

  return <>{blocks}</>;
}
