"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useFavorites } from "./FavoritesProvider";

export function FavoriteToggle({ slug, name }: { slug: string; name: string }) {
  const { isFavorite, toggle } = useFavorites();
  const [pulsing, setPulsing] = useState(false);
  const pulseTimeout = useRef<number | null>(null);
  const active = isFavorite(slug);

  useEffect(() => () => {
    if (pulseTimeout.current !== null) window.clearTimeout(pulseTimeout.current);
  }, []);

  return (
    <button
      className={`favorite-toggle${active ? " is-active" : ""}${pulsing ? " is-pulsing" : ""}`}
      type="button"
      aria-label={active ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      aria-pressed={active}
      onClick={() => {
        if (!active) {
          setPulsing(false);
          window.requestAnimationFrame(() => setPulsing(true));
          if (pulseTimeout.current !== null) window.clearTimeout(pulseTimeout.current);
          pulseTimeout.current = window.setTimeout(() => setPulsing(false), 650);
        }
        toggle(slug, name);
      }}
    >
      <Icon name="heart" />
    </button>
  );
}
