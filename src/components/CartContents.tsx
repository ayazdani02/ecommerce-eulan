"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/commerce/catalog";
export function CartContents({ onNavigate }: { onNavigate?: () => void }) {
  const { cart, busy, error, mutate, checkout } = useCart();
  if (!cart)
    return (
      <div className="empty-state" role="status">
        {error || "Cargando tu carrito…"}
      </div>
    );
  return (
    <div aria-busy={busy}>
      {error && (
        <p role="alert" className="feedback">
          {error}
        </p>
      )}
      {!cart.lines.length ? (
        <div className="empty-state">
          <h3>Tu carrito está vacío.</h3>
          <p>Encuentra una pieza que te acompañe.</p>
          <Link href="/catalogo" className="underlined" onClick={onNavigate}>
            Explorar la colección
          </Link>
        </div>
      ) : (
        <>
          {cart.lines.map((line) => (
            <article className="bag-line" key={line.id}>
              <Link
                href={`/productos/${line.product.slug}`}
                onClick={onNavigate}
              >
                <Image
                  src={line.product.images[0]?.url ?? "/assets/product.webp"}
                  alt={line.product.name}
                  width={100}
                  height={120}
                />
              </Link>
              <div className="bag-line-info">
                <h3>
                  <Link
                    href={`/productos/${line.product.slug}`}
                    onClick={onNavigate}
                  >
                    {line.product.name}
                  </Link>
                </h3>
                <p>
                  {line.variant.name} · {formatMoney(line.variant.price)}
                </p>
                <div className="quantity">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void mutate({
                        type: "update",
                        lineId: line.id,
                        quantity: line.quantity - 1,
                      })
                    }
                    aria-label={`Quitar una unidad de ${line.product.name}`}
                  >
                    −
                  </button>
                  <span aria-label={`Cantidad: ${line.quantity}`}>
                    {line.quantity}
                  </span>
                  <button
                    disabled={
                      busy ||
                      line.quantity >= Math.min(line.variant.stock ?? 99, 99)
                    }
                    onClick={() =>
                      void mutate({
                        type: "update",
                        lineId: line.id,
                        quantity: line.quantity + 1,
                      })
                    }
                    aria-label={`Agregar una unidad de ${line.product.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="bag-remove"
                disabled={busy}
                onClick={() => void mutate({ type: "remove", lineId: line.id })}
                aria-label={`Eliminar ${line.product.name}`}
              >
                ×
              </button>
            </article>
          ))}
          <div className="cart-total">
            <span>Subtotal</span>
            <strong>{formatMoney(cart.subtotal)}</strong>
          </div>
          <p className="drawer-note">
            {cart.demo
              ? "Precios de referencia. Carrito de demostración, sin pedidos ni cobros."
              : "Envío y total final se calculan en el checkout seguro."}
          </p>
          <button
            className="button btn full"
            disabled={busy}
            onClick={() => void checkout()}
          >
            {busy
              ? "Actualizando…"
              : cart.demo
                ? "Consultar checkout de demostración"
                : "Ir al pago seguro"}
          </button>
          <Link
            className="underlined cart-page-link"
            href="/carrito"
            onClick={onNavigate}
          >
            Ver carrito completo
          </Link>
        </>
      )}
    </div>
  );
}
