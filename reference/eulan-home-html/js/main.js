import { products, findProduct } from "./products.js";
import { store } from "./store.js";
import { productCard } from "./components.js";
import { homePage, collectionPage, productPage, universePage } from "./pages.js";
import { initializeCarousel } from "./carousel.js";

const main = document.querySelector("main");
const cartDialog = document.querySelector("#cart");
const menuDialog = document.querySelector("#mobile-menu");
const menuOpenButton = document.querySelector("#menu-open");
let observer;
let toastTimer;
let heroTimer;

function render() {
  const route = location.hash.slice(1) || "inicio";
  document.body.classList.toggle("is-home", route === "inicio");

  if (route === "inicio") main.innerHTML = homePage(products, store);
  else if (route === "coleccion" || route.startsWith("coleccion/")) {
    main.innerHTML = collectionPage(products, store, route.split("/")[1] || "todos");
  } else if (route.startsWith("pieza/")) {
    main.innerHTML = productPage(findProduct(route.split("/")[1]), products, store);
  } else if (route === "universo") main.innerHTML = universePage();
  else main.innerHTML = `<section class="page-intro"><h1>Esta página no está disponible.</h1><p>Vuelve a la colección para seguir explorando eulán.</p><a href="#coleccion" class="underlined">Ver colección</a></section>`;

  document.querySelectorAll(".desktop-nav a").forEach((link) => {
    if (link.hash === location.hash) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  window.scrollTo({ top: 0, behavior: "instant" });
  revealContent();
  initializeCarousel();
  initializeHeroCarousel();
  updateCartControls();
  document.title = `${pageTitle(route)} | eulán`;
}

function initializeHeroCarousel() {
  clearInterval(heroTimer);
  heroTimer = null;
  const carousel = document.querySelector("[data-hero-carousel]");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll("[data-hero-slide]")];
  const sceneButtons = [...carousel.querySelectorAll("[data-hero-scene]")];
  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sceneDurations = slides.map((_, index) => index === 0 ? 10_000 : 7200);
  let progressAnimation = null;
  let remainingDuration = sceneDurations[activeIndex];

  const animateSceneProgress = () => {
    progressAnimation?.cancel();
    progressAnimation = null;
    if (reduceMotion) return;
    const progress = sceneButtons[activeIndex]?.querySelector(".hero-scene-progress");
    if (!progress) return;
    progressAnimation = progress.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: sceneDurations[activeIndex], easing: "linear", fill: "forwards" },
    );
    if (!heroTimer) progressAnimation.pause();
  };

  const showSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    sceneButtons.forEach((button, index) => {
      button.setAttribute("aria-pressed", String(index === activeIndex));
    });
    remainingDuration = sceneDurations[activeIndex];
    animateSceneProgress();
    carousel.classList.toggle("is-product-scene", activeIndex === 1);
    document.body.classList.toggle("is-product-hero", activeIndex === 1);
  };

  const stopTimer = () => {
    if (heroTimer !== null) {
      clearTimeout(heroTimer);
      const elapsed = Number(progressAnimation?.currentTime) || 0;
      remainingDuration = Math.max(0, sceneDurations[activeIndex] - elapsed);
    }
    heroTimer = null;
    progressAnimation?.pause();
  };
  const startTimer = () => {
    stopTimer();
    if (!reduceMotion && !document.hidden) {
      heroTimer = setTimeout(() => {
        heroTimer = null;
        showSlide(activeIndex + 1);
        startTimer();
      }, remainingDuration);
      progressAnimation?.play();
    }
  };

  sceneButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showSlide(index);
      startTimer();
    });
  });
  carousel.addEventListener("pointerenter", stopTimer);
  carousel.addEventListener("pointerleave", startTimer);
  carousel.addEventListener("focusin", stopTimer);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) startTimer();
  });
  showSlide(activeIndex);
  startTimer();
}

function pageTitle(route) {
  if (route.startsWith("pieza/")) return findProduct(route.split("/")[1])?.name ?? "Pieza";
  if (route.startsWith("coleccion")) return "Colección";
  if (route === "universo") return "Universo";
  return "Waterproof. Todo el día.";
}

function revealContent() {
  observer?.disconnect();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("js-motion");
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.07 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function updateCartControls() {
  const count = store.getCount();
  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#cart-open").setAttribute("aria-label", `Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`);
  document.querySelectorAll("[data-add]").forEach((button) => {
    button.textContent = store.quantity(button.dataset.add) ? "Ver en mi carrito" : "Añadir al carrito";
  });
}

function cartMarkup() {
  const items = store.getCart();
  if (!items.length) {
    return `<div class="empty-state"><h3>Tu carrito está vacío.</h3><p>Explora aros y collares para empezar.</p><a class="underlined" href="#coleccion">Ver colección</a></div>`;
  }
  return items.map(({ id, qty }) => {
    const product = findProduct(id);
    return `
      <div class="bag-line">
        <img src="${product.image}" alt="${product.name}" />
        <div class="bag-line-info"><h3>${product.name}</h3><p>${product.kind}</p>
          <div class="quantity"><button data-qty="-1" data-id="${id}" aria-label="Quitar una unidad de ${product.name}">−</button><span aria-label="Cantidad ${qty}">${qty}</span><button data-qty="1" data-id="${id}" aria-label="Agregar una unidad de ${product.name}">+</button></div>
        </div>
        <button class="bag-remove" data-remove="${id}" aria-label="Quitar ${product.name} del carrito">×</button>
      </div>`;
  }).join("");
}

function openCart() {
  document.querySelector("#cart-items").innerHTML = cartMarkup();
  if (!cartDialog.open) cartDialog.showModal();
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog.open) dialog.showModal();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function replaceFavoriteState(id, active) {
  document.querySelectorAll(`[data-favorite="${id}"]`).forEach((button) => {
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", `${active ? "Quitar de" : "Añadir a"} favoritos: ${findProduct(id).name}`);
    button.innerHTML = `<img src="assets/${active ? "heart-filled" : "heart"}.svg" width="20" height="20" alt="" />`;
  });
}

document.addEventListener("click", (event) => {
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor) document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());

  const close = event.target.closest("[data-close]");
  if (close) document.getElementById(close.dataset.close).close();

  const add = event.target.closest("[data-add]");
  if (add) {
    store.add(add.dataset.add);
    updateCartControls();
    showToast("Añadido al carrito");
  }

  const remove = event.target.closest("[data-remove]");
  if (remove) {
    store.remove(remove.dataset.remove);
    updateCartControls();
    openCart();
  }

  const quantity = event.target.closest("[data-qty]");
  if (quantity) {
    store.changeQuantity(quantity.dataset.id, Number(quantity.dataset.qty));
    updateCartControls();
    openCart();
  }

  const favorite = event.target.closest("[data-favorite]");
  if (favorite) {
    const active = store.toggleFavorite(favorite.dataset.favorite);
    replaceFavoriteState(favorite.dataset.favorite, active);
    showToast(active ? "Guardado en favoritos" : "Quitado de favoritos");
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) {
    document.querySelectorAll(".filter").forEach((button) => {
      const active = button === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const visibleProducts = products.filter((product) => filter.dataset.filter === "todos" || product.type === filter.dataset.filter);
    document.querySelector("#catalog-grid").innerHTML = visibleProducts.map((product) => productCard(product, store)).join("");
    document.querySelector("#filter-count").textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "pieza" : "piezas"}`;
    revealContent();
  }
});

document.querySelector("#cart-open").addEventListener("click", openCart);
document.querySelector("#guide-open").addEventListener("click", () => openDialog("guide"));
menuOpenButton.addEventListener("click", () => {
  openDialog("mobile-menu");
  menuOpenButton.setAttribute("aria-expanded", "true");
});
menuDialog.addEventListener("close", () => menuOpenButton.setAttribute("aria-expanded", "false"));
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
});
document.addEventListener("error", (event) => {
  if (event.target.tagName !== "IMG") return;
  event.target.classList.add("error-image");
  event.target.alt = "Imagen no disponible. Intenta recargar la página.";
}, true);
window.addEventListener("hashchange", render);
render();
