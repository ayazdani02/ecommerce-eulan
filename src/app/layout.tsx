import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/CartProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { Header, PageFrame } from "@/components/Header";
import { NavigationProgress } from "@/components/NavigationProgress";
import { Footer } from "@/components/Footer";
import "./original.css";
import "./storefront.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "eulán | Waterproof. Todo el día.",
    template: "%s | eulán",
  },
  description:
    "Joyería contemporánea, Chile. Descubre el universo de aros y collares de EULÁN.",
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "eulán",
    images: [
      { url: "/assets/hero-desktop-blur.webp", width: 1536, height: 1024 },
    ],
  },
  robots:
    process.env.COMMERCE_PROVIDER === "shopify"
      ? { index: true, follow: true }
      : { index: false, follow: true },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5f0",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" data-theme="eulan">
      <body>
        <CartProvider>
          <FavoritesProvider>
            <PageFrame>
              <NavigationProgress />
              <a className="skip" href="#contenido">
                Ir al contenido
              </a>
              <Header />
              <main id="contenido" tabIndex={-1}>
                {children}
              </main>
              <Footer demo={process.env.COMMERCE_PROVIDER !== "shopify"} />
            </PageFrame>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
