"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DeliveryEstimate } from "@/integrations/envia/delivery-estimate";
import {
  CHILE_COMMUNES,
  deliveryMessage,
  nearestChileCommune,
} from "@/integrations/envia/delivery-estimate";
import { CourierLogo } from "./CourierLogo";
import { Icon } from "./Icon";

const FALLBACK_MESSAGE = "Escribe tu comuna para estimar cuándo llega tu pedido";
const DEFAULT_COMMUNE_ID = "CL13101";
const DEFAULT_COMMUNE_PROMPT = "Ingresa tu comuna para ver el plazo de entrega";
const POPULAR_COMMUNE_NAMES = ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Viña del Mar", "Valparaíso"];
type PickerPosition = { top: number; left: number; width: number; maxHeight: number };
const UNAVAILABLE_MESSAGES: Record<string, string> = {
  configuration:
    "Falta configurar el token, la dirección de origen y los horarios de preparación en el servidor.",
  provider:
    "Envia no devolvió un plazo para esta comuna. Consulta el plazo al finalizar tu compra.",
  no_service:
    "Por ahora no tenemos una fecha estimada para esta comuna. Consulta el plazo de entrega al finalizar tu compra.",
  request_origin:
    "El servidor rechazó la solicitud por el origen del navegador. Abre la ficha desde el dominio configurado.",
  invalid_request: "No se pudo validar la solicitud de estimación.",
  invalid_commune: "No pudimos ubicar esta comuna en Envia. Prueba otra sugerencia.",
};

function isDeliveryEstimate(value: unknown): value is DeliveryEstimate {
  if (!value || typeof value !== "object") return false;
  const estimate = value as Partial<DeliveryEstimate>;
  return (
    typeof estimate.courierName === "string" &&
    typeof estimate.arrivalDate === "string" &&
    typeof estimate.cacheExpiresAt === "number"
  );
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function DeliveryEstimator() {
  const [query, setQuery] = useState("Santiago");
  const [communeId, setCommuneId] = useState("CL13101");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [mobileInitialCommuneId, setMobileInitialCommuneId] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState<PickerPosition | null>(null);
  const [refresh, setRefresh] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobilePickerDialogRef = useRef<HTMLDialogElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSelectionCommittedRef = useRef(false);
  const autoRetryCommuneRef = useRef<string | null>(null);

  const suggestions = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle.length) {
      return CHILE_COMMUNES.filter((commune) => POPULAR_COMMUNE_NAMES.includes(commune.name))
        .sort((a, b) => POPULAR_COMMUNE_NAMES.indexOf(a.name) - POPULAR_COMMUNE_NAMES.indexOf(b.name));
    }
    if (needle.length < 2) return [];
    return CHILE_COMMUNES.filter((commune) => normalizeSearch(commune.name).includes(needle))
      .sort((a, b) => {
        const aName = normalizeSearch(a.name);
        const bName = normalizeSearch(b.name);
        return Number(!aName.startsWith(needle)) - Number(!bName.startsWith(needle)) || aName.localeCompare(bName, "es");
      })
      .slice(0, 5);
  }, [query]);

  const mobileSuggestions = suggestions;

  const suggestionsOpen = pickerOpen && suggestions.length > 0;
  const helpMessage = locationMessage || (query.trim().length < 2
    ? suggestions.length
      ? ""
      : "Escribe al menos dos letras para ver sugerencias"
    : suggestions.length
      ? ""
      : "No encontramos coincidencias. Revisa el nombre e inténtalo de nuevo.");
  const mobileHelpMessage = locationMessage || (query.trim().length >= 2 && !suggestions.length
    ? "No encontramos coincidencias. Revisa el nombre e inténtalo de nuevo."
    : "");

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (mobilePickerOpen) return;
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) {
        setPickerOpen(false);
        setPickerPosition(null);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [mobilePickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;

    let frame = 0;
    const updatePlacement = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const field = searchInputRef.current;
        const panel = pickerPanelRef.current;
        if (!field || !panel) return;
        const fieldRect = field.getBoundingClientRect();
        const edge = 12;
        const gap = 8;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const width = Math.min(Math.max(fieldRect.width, 280), viewportWidth - edge * 2);
        const left = Math.max(edge, Math.min(fieldRect.left, viewportWidth - width - edge));
        const availableAbove = Math.max(0, fieldRect.top - edge - gap);
        const availableBelow = Math.max(0, viewportHeight - fieldRect.bottom - edge - gap);
        const naturalHeight = Math.min(panel.scrollHeight, viewportHeight - edge * 2);
        const openAbove = availableBelow < naturalHeight && availableAbove > availableBelow;
        const availableHeight = openAbove ? availableAbove : availableBelow;
        const maxHeight = Math.max(80, Math.min(naturalHeight, availableHeight));
        const preferredTop = openAbove
          ? fieldRect.top - gap - maxHeight
          : fieldRect.bottom + gap;
        const top = Math.max(edge, Math.min(preferredTop, viewportHeight - maxHeight - edge));
        setPickerPosition({ top, left, width, maxHeight });
      });
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [pickerOpen, query, suggestions.length, helpMessage]);

  useEffect(() => {
    if (!mobilePickerOpen) return;
    const dialog = mobilePickerDialogRef.current;
    const viewport = window.visualViewport;
    if (!dialog) return;

    const updateVisibleViewport = () => {
      dialog.style.setProperty(
        "--delivery-picker-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      dialog.style.setProperty(
        "--delivery-picker-viewport-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
    };

    updateVisibleViewport();
    viewport?.addEventListener("resize", updateVisibleViewport);
    viewport?.addEventListener("scroll", updateVisibleViewport);
    window.addEventListener("resize", updateVisibleViewport);
    return () => {
      viewport?.removeEventListener("resize", updateVisibleViewport);
      viewport?.removeEventListener("scroll", updateVisibleViewport);
      window.removeEventListener("resize", updateVisibleViewport);
    };
  }, [mobilePickerOpen]);

  useEffect(() => {
    if (!communeId) return;
    const controller = new AbortController();
    let retryTimer: number | undefined;
    let retryScheduled = false;
    const timeout = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      setEstimate(null);
      setUnavailableReason("provider");
      setLoading(false);
    }, 30_000);
    void fetch("/api/shipping-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communeId }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!body || typeof body !== "object" || !("estimate" in body)) {
          return { estimate: null, reason: "unknown" };
        }
        const result = body as {
          estimate?: unknown;
          reason?: unknown;
        };
        const value = result.estimate;
        return {
          estimate: isDeliveryEstimate(value) ? value : null,
          reason:
            typeof result.reason === "string"
              ? result.reason
              : response.ok
                ? value === null ? "no_service" : null
                : "provider",
        };
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result?.estimate) autoRetryCommuneRef.current = null;
        if (
          !result?.estimate &&
          result?.reason === "no_service" &&
          autoRetryCommuneRef.current !== communeId
        ) {
          autoRetryCommuneRef.current = communeId;
          retryScheduled = true;
          retryTimer = window.setTimeout(() => {
            if (controller.signal.aborted) return;
            setUnavailableReason(null);
            setLoading(true);
            setRefresh((value) => value + 1);
          }, 700);
          return;
        }
        setEstimate(result?.estimate ?? null);
        setUnavailableReason(result?.reason ?? "provider");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setEstimate(null);
          setUnavailableReason("provider");
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!controller.signal.aborted && !retryScheduled) setLoading(false);
      });
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [communeId, refresh]);

  useEffect(() => {
    if (!estimate || !communeId) return;
    const delay = Math.max(0, estimate.cacheExpiresAt - Date.now());
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setRefresh((value) => value + 1);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [estimate, communeId]);

  const selectedCommune = CHILE_COMMUNES.find((commune) => commune.id === communeId);
  const showDefaultCommunePrompt =
    communeId === DEFAULT_COMMUNE_ID && !loading && !estimate;
  const communeWidthText = pickerOpen && query
    ? query
    : showDefaultCommunePrompt
      ? DEFAULT_COMMUNE_PROMPT
      : selectedCommune?.name ?? query;
  const message = estimate
    ? deliveryMessage(estimate)
    : showDefaultCommunePrompt
      ? ""
      : unavailableReason && communeId
        ? UNAVAILABLE_MESSAGES[unavailableReason] ??
          "No pudimos completar la consulta. Revisa la configuración del estimador."
        : FALLBACK_MESSAGE;

  function updateQuery(value: string) {
    setQuery(value);
    setLocationMessage("");
    setActiveIndex(-1);
  }

  function openDesktopPicker() {
    setQuery("");
    setActiveIndex(-1);
    setLocationMessage("");
    setPickerOpen(true);
  }

  function openMobilePicker() {
    setMobileInitialCommuneId(communeId || null);
    mobileSelectionCommittedRef.current = false;
    setQuery("");
    setActiveIndex(-1);
    setLocationMessage("");
    setMobilePickerOpen(true);
    const dialog = mobilePickerDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    mobileSearchInputRef.current?.focus();
  }

  function handleMobilePickerClose() {
    setMobilePickerOpen(false);
    if (!mobileSelectionCommittedRef.current) {
      const previousCommune = CHILE_COMMUNES.find(
        (commune) => commune.id === mobileInitialCommuneId,
      );
      setQuery(previousCommune?.name ?? "");
    }
    mobileSelectionCommittedRef.current = false;
    setMobileInitialCommuneId(null);
  }

  function closeMobilePicker() {
    const dialog = mobilePickerDialogRef.current;
    if (dialog?.open) dialog.close();
    else handleMobilePickerClose();
  }

  function chooseCommune(id: string) {
    const commune = CHILE_COMMUNES.find((item) => item.id === id);
    if (!commune) return;
    setQuery(commune.name);
    setCommuneId(commune.id);
    setActiveIndex(-1);
    setEstimate(null);
    setUnavailableReason(null);
    autoRetryCommuneRef.current = null;
    setLocationMessage("");
    setLoading(true);
    setRefresh((value) => value + 1);
    setPickerOpen(false);
    setPickerPosition(null);
    if (mobilePickerDialogRef.current?.open) {
      mobileSelectionCommittedRef.current = true;
      mobilePickerDialogRef.current.close();
    }
  }

  function useLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Este navegador no ofrece ubicación. Puedes elegir tu comuna manualmente.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const commune = nearestChileCommune(coords.latitude, coords.longitude);
        setLocating(false);
        if (!commune) {
          setLocationMessage("No pudimos reconocer la comuna cercana. Elígela manualmente.");
          return;
        }
        chooseCommune(commune.id);
        setLocationMessage(`Comuna más cercana seleccionada: ${commune.name}.`);
      },
      (error) => {
        setLocating(false);
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "No hay permiso de ubicación. Puedes elegir tu comuna manualmente."
            : "No pudimos obtener tu ubicación. Puedes elegir tu comuna manualmente.",
        );
      },
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 },
    );
  }

  return (
    <section
      className="delivery-estimator"
      aria-label="Estimación de entrega"
    >
      <div className={`delivery-estimator-line${showDefaultCommunePrompt ? " is-commune-prompt" : ""}`}>
        {!showDefaultCommunePrompt && (
          <p
            id="delivery-estimator-result"
            className={[
              "delivery-estimator-result",
              loading && "is-loading",
              !loading && !estimate && "is-unavailable",
              !loading && !estimate && unavailableReason === "no_service" && "is-no-service",
            ]
              .filter(Boolean)
              .join(" ")}
            role="status"
            aria-live="polite"
            aria-busy={loading}
          >
            <Icon name="truck" />
            <span className="delivery-estimator-message">
              {loading ? "Consultando plazo…" : message}{estimate ? " a" : ""}
            </span>
          </p>
        )}
        <div className={`delivery-estimator-destination${showDefaultCommunePrompt ? " is-commune-prompt" : ""}`} ref={pickerRef}>
        <label className="delivery-estimator-label sr-only" htmlFor="delivery-estimator-commune">Comuna de entrega</label>
        <div className={`delivery-estimator-field delivery-estimator-field--desktop${showDefaultCommunePrompt ? " is-prompt" : ""}`}>
          <input
            ref={searchInputRef}
            id="delivery-estimator-commune"
            type="text"
            size={Math.max(8, Math.min(showDefaultCommunePrompt ? 42 : 22, communeWidthText.length))}
            role="combobox"
            value={pickerOpen ? query : showDefaultCommunePrompt ? DEFAULT_COMMUNE_PROMPT : selectedCommune?.name ?? query}
            placeholder="Elige una comuna"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={pickerOpen}
            aria-controls={pickerOpen ? "delivery-estimator-picker-panel" : undefined}
            aria-activedescendant={activeIndex >= 0 ? `delivery-commune-option-${suggestions[activeIndex]?.id}` : undefined}
            aria-describedby={helpMessage ? "delivery-estimator-help" : undefined}
            onFocus={() => {
              if (!pickerOpen) openDesktopPicker();
            }}
            onClick={() => {
              if (!pickerOpen) openDesktopPicker();
            }}
            onChange={(event) => updateQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && suggestions.length) {
                event.preventDefault();
                setActiveIndex((index) => (index + 1) % suggestions.length);
              } else if (event.key === "ArrowUp" && suggestions.length) {
                event.preventDefault();
                setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
              } else if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
                event.preventDefault();
                chooseCommune(suggestions[activeIndex].id);
              } else if (event.key === "Escape") {
                setPickerOpen(false);
                setPickerPosition(null);
                setActiveIndex(-1);
                searchInputRef.current?.blur();
              }
            }}
          />
          <button
            className="delivery-estimator-chevron-button"
            type="button"
            aria-label={pickerOpen ? "Cerrar sugerencias de comunas" : "Abrir sugerencias de comunas"}
            aria-expanded={pickerOpen}
            aria-controls="delivery-estimator-picker-panel"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (pickerOpen) {
                setPickerOpen(false);
                setPickerPosition(null);
                setActiveIndex(-1);
              } else {
                openDesktopPicker();
              }
            }}
          >
            <span className={`delivery-estimator-chevron${pickerOpen ? " is-open" : ""}`} aria-hidden="true" />
          </button>
        </div>
        <button
          className={`delivery-estimator-field delivery-estimator-mobile-trigger${showDefaultCommunePrompt ? " is-prompt" : ""}`}
          type="button"
          aria-label={showDefaultCommunePrompt
            ? DEFAULT_COMMUNE_PROMPT
            : `Cambiar comuna de entrega${selectedCommune ? `, actualmente ${selectedCommune.name}` : ""}`}
          aria-haspopup="dialog"
          aria-expanded={mobilePickerOpen}
          onClick={openMobilePicker}
        >
          <span>{showDefaultCommunePrompt ? DEFAULT_COMMUNE_PROMPT : selectedCommune?.name ?? "Elige una comuna"}</span>
          <span className="delivery-estimator-chevron" aria-hidden="true" />
        </button>
        {pickerOpen && (
          <div
            ref={pickerPanelRef}
            className="delivery-estimator-picker-panel"
            id="delivery-estimator-picker-panel"
            style={{
              top: pickerPosition?.top,
              left: pickerPosition?.left,
              width: pickerPosition?.width,
              maxHeight: pickerPosition?.maxHeight,
              visibility: pickerPosition ? "visible" : "hidden",
            }}
          >
            <button
              className="delivery-estimator-locate"
              type="button"
              onClick={useLocation}
              disabled={locating}
            >
              <Icon name="location" />
              {locating ? "Buscando ubicación…" : "Usar mi ubicación"}
            </button>
            {helpMessage && (
              <p className="delivery-estimator-help" id="delivery-estimator-help" aria-live="polite">
                {helpMessage}
              </p>
            )}
            {suggestionsOpen && (
              <ul className="delivery-estimator-suggestions" id="delivery-estimator-suggestions" role="listbox">
                {suggestions.map((commune, index) => (
                  <li
                    id={`delivery-commune-option-${commune.id}`}
                    key={commune.id}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseCommune(commune.id)}
                  >
                    <span>{commune.name}</span>
                    <span>{commune.region}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {locationMessage && !pickerOpen && (
          <p className="delivery-estimator-location-feedback" role="status">{locationMessage}</p>
        )}
        <dialog
          ref={mobilePickerDialogRef}
          className="delivery-estimator-mobile-dialog"
          aria-labelledby="delivery-estimator-mobile-title"
          onClose={handleMobilePickerClose}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMobilePicker();
          }}
        >
          <div className="delivery-estimator-mobile-dialog__header">
            <div>
              <p>COMUNA DE ENTREGA</p>
              <h2 id="delivery-estimator-mobile-title">¿A dónde lo enviamos?</h2>
            </div>
            <button
              className="delivery-estimator-mobile-dialog__close"
              type="button"
              aria-label="Cerrar selector de comuna"
              onClick={closeMobilePicker}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="delivery-estimator-mobile-dialog__search">
            <Icon name="search" />
            <input
              ref={mobileSearchInputRef}
              id="delivery-estimator-mobile-search"
              type="search"
              value={query}
              placeholder="Escribe tu comuna"
              autoComplete="off"
              aria-label="Buscar comuna"
              aria-controls="delivery-estimator-mobile-options"
              onChange={(event) => updateQuery(event.currentTarget.value)}
            />
          </div>
          <button
            className="delivery-estimator-locate delivery-estimator-mobile-dialog__locate"
            type="button"
            onClick={useLocation}
            disabled={locating}
          >
            <Icon name="location" />
            {locating ? "Buscando ubicación…" : "Usar mi ubicación"}
          </button>
          <p className="delivery-estimator-mobile-dialog__status" aria-live="polite">
            {mobileHelpMessage || (query.trim().length < 2
              ? query.trim().length === 1
                ? "Escribe una letra más para ver opciones"
                : "Comunas frecuentes"
              : "Resultados")}
          </p>
          {mobileSuggestions.length > 0 ? (
            <ul className="delivery-estimator-mobile-options" id="delivery-estimator-mobile-options">
              {mobileSuggestions.map((commune) => (
                <li key={commune.id}>
                  <button
                    className="delivery-estimator-mobile-option"
                    type="button"
                    aria-pressed={commune.id === (mobilePickerOpen ? mobileInitialCommuneId : communeId)}
                    onClick={() => chooseCommune(commune.id)}
                  >
                    <span>{commune.name}</span>
                    <span>{commune.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 && !mobileHelpMessage ? (
            <p className="delivery-estimator-mobile-dialog__empty">No encontramos comunas con ese nombre.</p>
          ) : null}
        </dialog>
        </div>
        {estimate && (
          <span className="delivery-estimator-courier">
            <span>por</span>
            <CourierLogo courier={estimate.courier} name={estimate.courierName} />
          </span>
        )}
      </div>
    </section>
  );
}
