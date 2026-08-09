/**
 * The white circle that rides the pointer inside a work-preview card and
 * inverts whatever is under it (`mix-blend-mode: difference`).
 *
 * Creation is marker-guarded so React StrictMode's double-invoked effects
 * can't leave two dots behind.
 */
export function attachBlendDot(card: HTMLElement): () => void {
  let dot = card.querySelector<HTMLElement>(".ab-blend-dot");
  if (!dot) {
    dot = document.createElement("span");
    dot.className = "ab-blend-dot";
    dot.setAttribute("aria-hidden", "true");
    card.appendChild(dot);
  }
  const el = dot;

  const move = (e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    el.style.left = `${e.clientX - r.left}px`;
    el.style.top = `${e.clientY - r.top}px`;
  };
  const enter = (e: PointerEvent) => {
    move(e);
    el.classList.add("is-on");
  };
  const leave = () => el.classList.remove("is-on");

  card.addEventListener("pointerenter", enter);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerleave", leave);

  return () => {
    card.removeEventListener("pointerenter", enter);
    card.removeEventListener("pointermove", move);
    card.removeEventListener("pointerleave", leave);
    el.remove();
  };
}
