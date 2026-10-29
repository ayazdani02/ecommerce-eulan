"use client";
import Link from "next/link";
import { RouteReady } from "@/components/RouteReady";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="editorial-page">
      <p className="eyebrow">EULÁN</p>
      <h1>No pudimos cargar esta página.</h1>
      <p className="lead">Intenta nuevamente en unos momentos.</p>
      <div className="info-links">
        <button className="button btn" onClick={reset}>
          Volver a intentar
        </button>
        <Link className="underlined" href="/">
          Volver al inicio
        </Link>
      </div>
      <RouteReady />
    </section>
  );
}
