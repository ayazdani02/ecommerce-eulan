import Link from "next/link";
import { redirect } from "next/navigation";
import { commerce } from "@/commerce/provider";
import { RouteReady } from "@/components/RouteReady";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  const loginUrl = commerce().getAccountLoginUrl();
  if (loginUrl) redirect(loginUrl);

  return (
    <main className="account-unavailable page-intro">
      <p className="eyebrow">Mi cuenta / EULÁN</p>
      <h1>Tu cuenta.</h1>
      <p>El acceso a cuentas estará disponible al conectar la tienda con Shopify.</p>
      <Link className="button btn" href="/catalogo">
        Explorar la colección
      </Link>
      <RouteReady />
    </main>
  );
}
