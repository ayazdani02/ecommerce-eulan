import { products } from "./products.js";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const validIds = new Set(products.map(({ id }) => id));
const savedCart = read("eulan-cart", null);
const oldSelection = read("eulan-selection", []);
let cartItems = (Array.isArray(savedCart)
  ? savedCart
  : oldSelection.map((id) => ({ id, qty: 1 })))
  .filter((item) => item && validIds.has(item.id))
  .map(({ id, qty }) => ({ id, qty: Math.max(1, Number(qty) || 1) }));
const savedFavorites = read("eulan-favorites", []);
let favorites = (Array.isArray(savedFavorites) ? savedFavorites : []).filter((id) => validIds.has(id));

const persist = () => {
  try {
    localStorage.setItem("eulan-cart", JSON.stringify(cartItems));
    localStorage.setItem("eulan-favorites", JSON.stringify(favorites));
  } catch {
    // The prototype remains usable if browser storage is unavailable.
  }
};

export const store = {
  getCart() {
    return cartItems.map((item) => ({ ...item }));
  },
  getCount() {
    return cartItems.reduce((sum, item) => sum + item.qty, 0);
  },
  quantity(id) {
    return cartItems.find((item) => item.id === id)?.qty ?? 0;
  },
  add(id) {
    const item = cartItems.find((entry) => entry.id === id);
    if (item) item.qty += 1;
    else if (validIds.has(id)) cartItems.push({ id, qty: 1 });
    persist();
  },
  changeQuantity(id, amount) {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) return;
    item.qty += amount;
    if (item.qty < 1) cartItems = cartItems.filter((entry) => entry !== item);
    persist();
  },
  remove(id) {
    cartItems = cartItems.filter((item) => item.id !== id);
    persist();
  },
  isFavorite(id) {
    return favorites.includes(id);
  },
  toggleFavorite(id) {
    favorites = favorites.includes(id)
      ? favorites.filter((favorite) => favorite !== id)
      : [...favorites, id];
    persist();
    return favorites.includes(id);
  },
};
