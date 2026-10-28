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
    let gesture: { x: number; y: number; index: number; startedAt: number } | null = null;
    let dragging = false;
    let settleTimer = 0;
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
      if (
        paused ||
        hovered ||
        focused ||
        reduced.matches ||
        document.hidden ||
        hero?.classList.contains("is-swiping") ||
        hero?.classList.contains("is-swipe-settling")
      )
        progress?.pause();
      else progress?.play();
      drawClock();
    };
    const show = (index: number) => {
      window.clearTimeout(settleTimer);
      progress?.cancel();
      cancelAnimationFrame(clockFrame);
      active = index;
      hero?.classList.remove("is-swiping", "is-swipe-settling");
      slides.forEach((slide, i) => {
        slide.classList.remove("is-swipe-neighbor");
        slide.style.removeProperty("transform");
        slide.style.removeProperty("transition");
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
    const startSwipe = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        cancelSwipe();
        return;
      }
      if (
        event.target instanceof Element &&
        event.target.closest("a, button")
      ) {
        gesture = null;
        return;
      }
      const touch = event.touches[0];
      gesture = {
        x: touch.clientX,
        y: touch.clientY,
        index: active,
        startedAt: performance.now(),
      };
    };
    const moveSwipe = (event: TouchEvent) => {
      const start = gesture;
      const touch = event.touches[0];
      if (!start || !touch || slides.length < 2) return;
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (
        !dragging &&
        Math.abs(deltaY) > 10 &&
        Math.abs(deltaY) > Math.abs(deltaX)
      ) {
        gesture = null;
        return;
      }
      if (
        !dragging &&
        Math.abs(deltaX) >= 8 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.15
      ) {
        dragging = true;
        progress?.pause();
        hero?.classList.add("is-swiping");
      }
      if (!dragging) return;

      const width = hero?.clientWidth ?? 320;
      const percent = (deltaX / width) * 100;
      const neighborIndex =
        (start.index + (deltaX < 0 ? 1 : -1) + slides.length) % slides.length;
      const current = slides[start.index];
      const neighbor = slides[neighborIndex];
      slides.forEach((slide, index) => {
        if (index === start.index || index === neighborIndex) return;
        slide.classList.remove("is-swipe-neighbor");
        slide.style.removeProperty("transform");
      });
      neighbor.classList.add("is-swipe-neighbor");
      current.style.transform = `translate3d(${percent}%, 0, 0)`;
      neighbor.style.transform = `translate3d(${(deltaX < 0 ? 100 : -100) + percent}%, 0, 0)`;
    };
    const endSwipe = (event: TouchEvent) => {
      const start = gesture;
      gesture = null;
      const touch = event.changedTouches[0];
      if (!start || !touch || slides.length < 2 || !dragging) return;

      const deltaX = touch.clientX - start.x;
      const elapsed = Math.max(1, performance.now() - start.startedAt);
      const distance = hero?.clientWidth ?? 320;
      const commit =
        Math.abs(deltaX) > distance * 0.2 ||
        (Math.abs(deltaX) > 36 && Math.abs(deltaX / elapsed) > 0.48);
      const nextIndex =
        (start.index + (deltaX < 0 ? 1 : -1) + slides.length) % slides.length;
      const neighbor = slides[nextIndex];
      const current = slides[start.index];
      hero?.classList.remove("is-swiping");
      hero?.classList.add("is-swipe-settling");

      if (commit) {
        current.style.transform = `translate3d(${deltaX < 0 ? -100 : 100}%, 0, 0)`;
        neighbor.style.transform = "translate3d(0, 0, 0)";
        const finish = (event: TransitionEvent) => {
          if (event.target !== neighbor || event.propertyName !== "transform") return;
          neighbor.removeEventListener("transitionend", finish);
          show(nextIndex);
        };
        neighbor.addEventListener("transitionend", finish);
      } else {
        current.style.transform = "translate3d(0, 0, 0)";
        neighbor.style.transform = `translate3d(${deltaX < 0 ? 100 : -100}%, 0, 0)`;
        settleTimer = window.setTimeout(() => {
          hero?.classList.remove("is-swipe-settling");
          slides.forEach((slide) => {
            slide.classList.remove("is-swipe-neighbor");
            slide.style.removeProperty("transform");
            slide.style.removeProperty("transition");
          });
          dragging = false;
          syncPlayback();
        }, 360);
      }
      if (commit) settleTimer = window.setTimeout(() => show(nextIndex), 360);
      dragging = false;
    };
    const cancelSwipe = () => {
      gesture = null;
      if (dragging) {
        const current = slides[active];
        hero?.classList.remove("is-swiping");
        hero?.classList.add("is-swipe-settling");
        current.style.transform = "translate3d(0, 0, 0)";
        slides.forEach((slide, index) => {
          if (!slide.classList.contains("is-swipe-neighbor")) return;
          const isNext = (active + 1) % slides.length === index;
          slide.style.transform = `translate3d(${isNext ? 100 : -100}%, 0, 0)`;
        });
        settleTimer = window.setTimeout(() => {
          hero?.classList.remove("is-swipe-settling");
          slides.forEach((slide) => {
            slide.classList.remove("is-swipe-neighbor");
            slide.style.removeProperty("transform");
          });
          dragging = false;
          syncPlayback();
        }, 360);
      }
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
    hero?.addEventListener("touchstart", startSwipe, { passive: true });
    hero?.addEventListener("touchmove", moveSwipe, { passive: true });
    hero?.addEventListener("touchend", endSwipe, { passive: true });
    hero?.addEventListener("touchcancel", cancelSwipe, { passive: true });
    document.addEventListener("visibilitychange", syncPlayback);
    reduced.addEventListener("change", syncPlayback);
    show(0);
    return () => {
      progress?.cancel();
      window.clearTimeout(settleTimer);
      cancelAnimationFrame(clockFrame);
      clickButtons.forEach((fn) => fn());
      pauseButton.remove();
      document.body.classList.remove("is-product-hero");
      hero?.removeEventListener("pointerenter", stop);
      hero?.removeEventListener("pointerleave", resume);
      hero?.removeEventListener("focusin", focusIn);
      hero?.removeEventListener("focusout", focusOut);
      hero?.removeEventListener("touchstart", startSwipe);
      hero?.removeEventListener("touchmove", moveSwipe);
      hero?.removeEventListener("touchend", endSwipe);
      hero?.removeEventListener("touchcancel", cancelSwipe);
      document.removeEventListener("visibilitychange", syncPlayback);
      reduced.removeEventListener("change", syncPlayback);
    };
  }, []);
  return <div ref={root}>{children}</div>;
}
