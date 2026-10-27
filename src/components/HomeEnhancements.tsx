"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function HomeEnhancements({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const hero = node.querySelector<HTMLElement>("[data-hero-carousel]");
    const slides = [...node.querySelectorAll<HTMLElement>("[data-hero-slide]")];
    const buttons = [
      ...node.querySelectorAll<HTMLButtonElement>("[data-hero-scene]"),
    ];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let active = 0;
    let paused = false;
    let hovered = false;
    let focused = false;
    let progress: Animation | undefined;
    let clockFrame = 0;
    const drawClock = () => {
      cancelAnimationFrame(clockFrame);
      const duration = active === 0 ? 10000 : 7200;
      const elapsed = Math.min(duration, Number(progress?.currentTime ?? 0));
      const countdown = buttons[active]?.querySelector<HTMLElement>(".hero-scene-countdown");
      const remaining = `${Math.ceil((duration - elapsed) / 1000)} s`;
      if (countdown && countdown.textContent !== remaining) countdown.textContent = remaining;
      if (progress?.playState === "running") clockFrame = requestAnimationFrame(drawClock);
    };
    const pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.className = "hero-pause";
    const pauseIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pauseIcon.setAttribute("viewBox", "0 0 24 24");
    pauseIcon.setAttribute("width", "18");
    pauseIcon.setAttribute("height", "18");
    pauseIcon.setAttribute("fill", "none");
    pauseIcon.setAttribute("stroke", "currentColor");
    pauseIcon.setAttribute("stroke-width", "1.8");
    pauseIcon.setAttribute("stroke-linecap", "round");
    pauseIcon.setAttribute("aria-hidden", "true");
    pauseButton.appendChild(pauseIcon);
    const setPauseIcon = (isPaused: boolean) => {
      pauseIcon.replaceChildren();
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", isPaused ? "m8 5 12 7-12 7V5Z" : "M9 5v14 M15 5v14");
      pauseIcon.appendChild(path);
    };
    setPauseIcon(false);
    pauseButton.title = "Pausar cambio automático";
    pauseButton.setAttribute(
      "aria-label",
      "Pausar cambio automático de escenas",
    );
    // La misma animación dibuja el avance y determina el cambio de escena.
    // Al pausar se conserva currentTime, sin reiniciar la cuenta al reanudar.
    const syncPlayback = () => {
      if (paused || hovered || focused || reduced.matches || document.hidden)
        progress?.pause();
      else progress?.play();
      drawClock();
    };
    const show = (index: number) => {
      progress?.cancel();
      cancelAnimationFrame(clockFrame);
      active = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
        slide.inert = i !== index;
      });
      buttons.forEach((button, i) => {
        button.setAttribute("aria-pressed", String(i === index));
        
      });
      hero?.classList.toggle("is-product-scene", index === 1);
      document.body.classList.toggle("is-product-hero", index === 1);
      const ring = buttons[index]?.querySelector<SVGRectElement>(".hero-clock-fill");
      // Medir el contorno en píxeles reales evita normalizaciones SVG y escalados
      // que hacían cerrar visualmente el marco antes de terminar el temporizador.
      const length = ring?.getTotalLength() ?? 0;
      ring?.style.setProperty("stroke-dasharray", `${length} ${length}`);
      progress = ring?.animate(
        [{ strokeDashoffset: String(length) }, { strokeDashoffset: "0" }],
        { duration: index === 0 ? 10000 : 7200, easing: "linear", fill: "forwards" },
      );
      if (progress) progress.onfinish = () => show((active + 1) % slides.length);
      syncPlayback();
    };
    const clickButtons = buttons.map((button, index) => {
      const fn = () => show(index);
      button.addEventListener("click", fn);
      return () => button.removeEventListener("click", fn);
    });
    const pause = () => {
      paused = !paused;
      setPauseIcon(paused);
      pauseButton.title = paused ? "Reanudar cambio automático" : "Pausar cambio automático";
      pauseButton.setAttribute(
        "aria-label",
        paused
          ? "Reanudar cambio automático de escenas"
          : "Pausar cambio automático de escenas",
      );
      syncPlayback();
    };
    pauseButton.addEventListener("click", pause);
    hero?.appendChild(pauseButton);
    const stop = () => { hovered = true; syncPlayback(); };
    const resume = () => { hovered = false; syncPlayback(); };
    const focusIn = () => { focused = true; syncPlayback(); };
    const focusOut = (event: FocusEvent) => {
      focused = !!hero?.contains(event.relatedTarget as Node);
      syncPlayback();
    };
    hero?.addEventListener("pointerenter", stop);
    hero?.addEventListener("pointerleave", resume);
    hero?.addEventListener("focusin", focusIn);
    hero?.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", syncPlayback);
    reduced.addEventListener("change", syncPlayback);
    show(0);
    return () => {
      progress?.cancel();
      cancelAnimationFrame(clockFrame);
      clickButtons.forEach((fn) => fn());
      pauseButton.remove();
      document.body.classList.remove("is-product-hero");
      hero?.removeEventListener("pointerenter", stop);
      hero?.removeEventListener("pointerleave", resume);
      hero?.removeEventListener("focusin", focusIn);
      hero?.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", syncPlayback);
      reduced.removeEventListener("change", syncPlayback);
    };
  }, []);
  return <div ref={root}>{children}</div>;
}
