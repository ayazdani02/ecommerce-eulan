"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Cart, CartAction, CheckoutResult } from "@/commerce/models";
import { Modal } from "./Modal";
import { CartContents } from "./CartContents";
type CartContextValue = {
  cart: Cart | null;
  busy: boolean;
  error: string;
  openCart: (opener?: HTMLElement) => void;
  mutate: (action: CartAction) => Promise<boolean>;
  checkout: () => Promise<void>;
};
const Context = createContext<CartContextValue | null>(null);
export function useCart() {
  const context = useContext(Context);
  if (!context) throw new Error("Falta CartProvider");
  return context;
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [opener, setOpener] = useState<HTMLElement | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setCart((await res.json()) as Cart);
      setError("");
    } catch {
      setError("No pudimos cargar tu carrito. Vuelve a intentarlo.");
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("focus", focus);
    };
  }, [load]);
  async function mutate(action: CartAction) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "No pudimos actualizar el carrito.");
      setCart(data as Cart);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al actualizar el carrito.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as CheckoutResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No pudimos iniciar el pago.");
      if (data.type === "unavailable") setError(data.message);
      else if (data.type === "redirect") window.location.assign(data.url);
      else throw new Error("Este flujo de pago aún no está habilitado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar el pago.");
    } finally {
      setBusy(false);
    }
  }
  const close = () => setOpen(false);
  return (
    <Context.Provider
      value={{
        cart,
        busy,
        error,
        openCart: (element) => {
          setOpener(element ?? (document.activeElement as HTMLElement));
          setOpen(true);
          void load();
        },
        mutate,
        checkout,
      }}
    >
      {children}
      <Modal
        open={open}
        onClose={close}
        returnFocus={opener}
        title="Tu carrito"
      >
        <CartContents onNavigate={close} />
      </Modal>
    </Context.Provider>
  );
}
