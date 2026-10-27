import Image from "next/image";
import Link from "next/link";
import { primaryNavigation } from "@/navigation";
export function Footer({ demo }: { demo: boolean }) {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" aria-label="Volver al inicio">
          <Image src="/assets/logo.svg" alt="eulán" width={133} height={41} />
        </Link>
        <div>
          {primaryNavigation.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <nav className="footer-help" aria-label="Información y ayuda">
        {[
          ["contacto", "Contacto"],
          ["preguntas-frecuentes", "Preguntas frecuentes"],
          ["envios", "Envíos"],
          ["cambios-y-devoluciones", "Cambios y devoluciones"],
          ["cuidados", "Cuidados"],
          ["privacidad", "Privacidad"],
          ["terminos", "Términos"],
        ].map(([slug, title]) => (
          <Link key={slug} href={`/${slug}`}>
            {title}
          </Link>
        ))}
      </nav>
      <div className="footer-bottom">
        <span>Joyería contemporánea, Chile.</span>
        <span>
          {demo
            ? "Catálogo, precios e imágenes conceptuales. Demostración sin cobros."
            : "EULÁN · Hecho para acompañarte."}
        </span>
      </div>
    </footer>
  );
}
