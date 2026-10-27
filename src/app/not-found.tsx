import Link from "next/link";
export default function NotFound() {
  return (
    <section className="editorial-page">
      <p className="eyebrow">404 / EULÁN</p>
      <h1>Esta pieza del camino no está aquí.</h1>
      <p className="lead">La página que buscas no existe o cambió de lugar.</p>
      <Link className="underlined" href="/catalogo">
        Volver a la colección
      </Link>
    </section>
  );
}
