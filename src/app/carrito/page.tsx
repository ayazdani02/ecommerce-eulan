import type { Metadata } from "next";
import { CartContents } from "@/components/CartContents";
import { RouteReady } from "@/components/RouteReady";
export const metadata: Metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className="cart-page">
      <p className="eyebrow">Tu selección / EULÁN</p>
      <h1>Tu carrito.</h1>
      <CartContents />
      <RouteReady />
    </section>
  );
}
