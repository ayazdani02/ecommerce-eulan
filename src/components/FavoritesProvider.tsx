"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type FavoritesContextValue = {
  slugs: string[];
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string, name: string) => void;
};

type FavoriteNotice = { id: number; name: string; action: "added" | "removed" };

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const storageKey = "eulan:favorites";
const emptySlugs: string[] = [];
let slugs: string[] = emptySlugs;
let initialized = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const value: unknown = JSON.parse(stored);
        if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
          slugs = value;
        }
      }
    } catch {}
  }
  return slugs;
}

function getServerSnapshot() {
  return emptySlugs;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const currentSlugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [notice, setNotice] = useState<FavoriteNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const toggle = useCallback((slug: string, name: string) => {
    const alreadyFavorite = slugs.includes(slug);
    slugs = alreadyFavorite
      ? slugs.filter((item) => item !== slug)
      : [...slugs, slug];
    setNotice({ id: Date.now(), name, action: alreadyFavorite ? "removed" : "added" });
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(slugs));
    } catch {
      // Favoritos siguen funcionando en memoria si el navegador bloquea el almacenamiento.
    }
    listeners.forEach((listener) => listener());
  }, []);
  const value = useMemo<FavoritesContextValue>(() => ({
    slugs: currentSlugs,
    isFavorite: (slug) => currentSlugs.includes(slug),
    toggle,
  }), [currentSlugs, toggle]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {notice && (
        <div className="favorite-notice" key={notice.id} role="status" aria-live="polite">
          <span className={`favorite-notice-icon${notice.action === "removed" ? " is-removed" : ""}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
            </svg>
          </span>
          <span className="favorite-notice-copy">
            <strong>{notice.action === "added" ? "Añadido a tus favoritos" : "Quitado de tus favoritos"}</strong>
            <span>{notice.name}</span>
          </span>
          <button
            className="favorite-notice-close"
            type="button"
            aria-label="Cerrar aviso de favoritos"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites debe usarse dentro de FavoritesProvider");
  return value;
}
