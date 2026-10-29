export function Icon({
  name,
}: {
  name: "menu" | "cart" | "arrow" | "arrow-left" | "arrow-right" | "search" | "heart" | "user" | "pause" | "play" | "zoom-in" | "zoom-out" | "close" | "truck" | "location" | "material" | "steel" | "gold" | "coating" | "waterproof" | "hypoallergenic";
}) {
  const paths = {
    menu: "M3 7h18M3 17h18",
    cart: "M4 8h16l-1.4 13H5.4L4 8Z M8 8V6a4 4 0 0 1 8 0v2",
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
    close: "M6 6l12 12M18 6 6 18",
    truck: "M3 6h11v12H3z M14 10h4l3 3v5h-7z M7.5 18a1.5 1.5 0 1 0 0 .01 M17.5 18a1.5 1.5 0 1 0 0 .01",
    location: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z M12 10a2.5 2.5 0 1 0 0 .01",
    material: "M12 3.5 14.2 9.8 20.5 12 14.2 14.2 12 20.5 9.8 14.2 3.5 12 9.8 9.8Z",
    steel: "M8 3.5h8l4.5 8.5-4.5 8.5H8L3.5 12 8 3.5Z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    gold: "M4 8.5 7 5h10l3 3.5-2 10H6l-2-10Z M4 8.5h16 M8 5l2 3.5 M16 5l-2 3.5",
    coating: "M12 3C9.8 6.4 7.8 8.8 7.8 11.2a4.2 4.2 0 0 0 8.4 0C16.2 8.8 14.2 6.4 12 3Z M4 18h16 M6 21h12",
    waterproof: "M12 3C9.8 6.4 7.8 8.8 7.8 11.2a4.2 4.2 0 0 0 8.4 0C16.2 8.8 14.2 6.4 12 3Z M3.5 18c1.4-1 2.7-1 4.1 0s2.7 1 4.1 0 2.7-1 4.1 0 2.7 1 4.1 0",
    hypoallergenic: "M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z M9 12l2 2 4-4",
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
