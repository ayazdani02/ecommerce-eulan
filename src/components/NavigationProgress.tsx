"use client";

import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const [active, setActive] = useState(false);
  const [complete, setComplete] = useState(false);
  const targetPath = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failSafeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (failSafeTimer.current) clearTimeout(failSafeTimer.current);
      hideTimer.current = null;
      failSafeTimer.current = null;
    };

    const start = (path: string, alreadyNavigated = false) => {
      if (!path || (!alreadyNavigated && path === window.location.pathname)) return;
      clearTimers();
      targetPath.current = path;
      setComplete(false);
      setActive(true);
      failSafeTimer.current = setTimeout(() => {
        targetPath.current = null;
        setComplete(true);
        hideTimer.current = setTimeout(() => {
          setActive(false);
          setComplete(false);
        }, 260);
      }, 15_000);
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      start(url.pathname);
    };

    const onPopState = () => start(window.location.pathname, true);
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (
        event.defaultPrevented ||
        !(form instanceof HTMLFormElement) ||
        form.method.toLowerCase() !== "get" ||
        (form.target && form.target !== "_self")
      ) return;

      const url = new URL(form.action, window.location.href);
      if (url.origin === window.location.origin) start(url.pathname);
    };
    const onRouteReady = (event: Event) => {
      const readyPath = (event as CustomEvent<string>).detail;
      if (!readyPath || readyPath !== targetPath.current) return;

      targetPath.current = null;
      if (failSafeTimer.current) clearTimeout(failSafeTimer.current);
      failSafeTimer.current = null;
      setComplete(true);
      hideTimer.current = setTimeout(() => {
        hideTimer.current = null;
        setActive(false);
        setComplete(false);
      }, 260);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("eulan:route-ready", onRouteReady);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("eulan:route-ready", onRouteReady);
      clearTimers();
    };
  }, []);

  if (!active) return null;

  return (
    <div
      className={`site-navigation-progress${complete ? " is-complete" : ""}`}
      role="status"
      aria-label={complete ? "Sección cargada" : "Cargando sección"}
    >
      <span aria-hidden="true" />
    </div>
  );
}
