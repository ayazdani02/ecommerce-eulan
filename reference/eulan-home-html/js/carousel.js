export function initializeCarousel() {
  const track = document.querySelector("#featured-track");
  if (!track) return;

  const previous = document.querySelector('[data-slide="-1"]');
  const next = document.querySelector('[data-slide="1"]');
  const slides = [...track.children];
  const step = () => slides[0].getBoundingClientRect().width + 24;

  const syncControls = () => {
    const index = Math.round(track.scrollLeft / step());
    previous.disabled = track.scrollLeft < 3;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
    const position = next.disabled ? slides.length : Math.min(index + 1, slides.length);
    document.querySelector("#featured-position").textContent = `${String(position).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  };

  const move = (direction) => track.scrollBy({
    left: direction * step(),
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });

  track.addEventListener("scroll", syncControls, { passive: true });
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  track.addEventListener("keydown", (event) => {
    if (event.target !== track) return;
    if (["ArrowRight", "ArrowLeft"].includes(event.key)) {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
    if (["Home", "End"].includes(event.key)) {
      event.preventDefault();
      track.scrollTo({ left: event.key === "Home" ? 0 : track.scrollWidth, behavior: "instant" });
    }
  });
  syncControls();
}
