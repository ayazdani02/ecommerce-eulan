export function Icon({
  name,
}: {
  name: "menu" | "cart" | "arrow" | "arrow-left" | "arrow-right" | "search" | "heart" | "user" | "pause" | "play" | "zoom-in" | "zoom-out";
}) {
  const paths = {
    menu: "M3 7h18M3 17h18",
    cart: "M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.5L21 8H6 M9 20h1 M18 20h1",
    arrow: "M7 17 17 7M7 7h10v10",
    "arrow-left": "M20 12H4m7-7-7 7 7 7",
    "arrow-right": "M4 12h16m-7-7 7 7-7 7",
    search: "m16 16 5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z",
    user: "M20 21a8 8 0 0 0-16 0 M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    pause: "M9 5v14 M15 5v14",
    play: "m8 5 12 7-12 7V5Z",
    "zoom-in": "m16 16 5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M10 6v8 M6 10h8",
    "zoom-out": "m16 16 5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M6 10h8",
  };
  return (
    <svg
      className={name === "cart" ? "cart-icon" : "ui-icon"}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
