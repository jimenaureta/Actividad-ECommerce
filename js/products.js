// js/products.js
import {
  getJSONData,
  requerirSesion,
  cerrarSesion,
  getUsuario,
} from "./common.js";

/* =================== Config / URLs =================== */
const CAT_ID = localStorage.getItem("catID") || "101";
const PRODUCTS_URL = `https://japceibal.github.io/emercado-api/cats_products/${CAT_ID}.json`;

/* =================== Backups de imágenes =================== */
// Backups confiables (Wikimedia/Unsplash) por NOMBRE EXACTO como viene en el JSON
const backupImagesByName = {
  // --- JUGUETES (cat 102) ---
  "Oso de peluche":
    "https://office2000.com.uy/image/cache/catalog/office%202000/productos/1/94857-1200x1200.jpg",
  "Pelota de básquetbol":
    "https://upload.wikimedia.org/wikipedia/commons/7/7a/Basketball.png",
  "Bicicleta":
    "https://f.fcdn.app/imgs/c30f2e/nicolini.uy/nicouy/e808/original/catalogo/984429_984429_1/1920-1200/bicicleta-s-pro-bmx-20-vert-de-freestyle-cuadro-rigido-transmision-fija-y-ruedas-de-48-rayos-bicicleta-s-pro-bmx-20-vert-de-freestyle-cuadro-rigido-transmision-fija-y-ruedas-de-48-rayos.jpg",
  "PlayStation 5":
    "https://pro-gamer.uy/wp-content/uploads/2023/04/PS5-Slim-Bluray-web.png",

  // --- AUTOS (cat 101) ---
  "Chevrolet Onix Joy":
    "https://www.chevrolet.com.uy/content/dam/chevrolet/south-america/uruguay/espanol/index/cars/2021-onix/colorizer/01-images/new-colorizer/ago-2022/colorizer-blanco.jpg?imwidth=1200",
  "Fiat Way":
    "https://http2.mlstatic.com/D_NQ_NP_687550-MLU50708884548_072022-O.webp",
  "Suzuki Celerio":
    "https://www.suzuki.com.uy/public/color5.png",
  "Peugeot 208":
    "https://www.pngplay.com/wp-content/uploads/13/Peugeot-208-2019-Download-Free-PNG.png",
  "Bugatti Chiron":
    "https://purepng.com/public/uploads/large/purepng.com-black-bugatti-chiron-carcarvehicletransportbugatti-961524653349rn5ct.png",
};

// Fallback genérico por categoría (si no hay por nombre)
const categoryFallback = (() => {
  if (CAT_ID === "102") {
    return "https://images.unsplash.com/photo-1589739906089-6ce109f31f0b?auto=format&fit=crop&w=900&q=70"; // juguetes
  }
  if (CAT_ID === "101") {
    return "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=70"; // autos
  }
  return "https://images.unsplash.com/photo-1515165562835-c3b8c8e31f10?auto=format&fit=crop&w=900&q=70"; // genérico
})();

/* =================== Helpers =================== */
const $ = (s) => document.querySelector(s);

function joinRepo(path) {
  // Une con la raíz del repo público si el path es relativo
  const p = String(path || "").replace(/^\/+/, "");
  return /^https?:\/\//i.test(p)
    ? p
    : `https://japceibal.github.io/emercado-api/${p}`;
}
function joinFromJson(path) {
  // Une relativo al JSON (p.ej. .../cats_products/img/archivo.jpg)
  return /^https?:\/\//i.test(path)
    ? path
    : new URL(String(path || ""), PRODUCTS_URL).href;
}

// Escoge la mejor URL inicial para la imagen
function pickImageURL(product) {
  // Si tengo backup por NOMBRE (en Juguetes p.ej.), lo uso directo
  if (backupImagesByName[product.name]) return backupImagesByName[product.name];

  // Si no, pruebo relativo al JSON; si el JSON dice "img/...", esto suele ser suficiente
  if (product.image) return joinFromJson(product.image);

  // Último recurso inicial
  return categoryFallback;
}

/* =================== Estado (única fuente de verdad) =================== */
let all = []; // lista original
const state = {
  min: null,
  max: null,
  q: "",                 // búsqueda
  sort: localStorage.getItem("f_sort") || "rel", // 'asc' | 'desc' | 'rel'
};

/* =================== Render =================== */
function render(list) {
  const cont = $("#productos-container");
  cont.innerHTML = list
    .map((p) => {
      const initial = pickImageURL(p);
      // guardo data-* para el fallback escalonado
      const dataPath = (p.image || "").replace(/"/g, "&quot;");
      const dataName = p.name.replace(/"/g, "&quot;");

      return `
      <article class="fila" data-id="${p.id}">
        <figure class="thumb">
          <img
            src="${initial}"
            alt="${dataName}"
            loading="lazy"
            referrerpolicy="no-referrer"
            data-name="${dataName}"
            data-path="${dataPath}"
          >
        </figure>
        <div class="info">
          <h2 class="nombre">${p.name} - UYU ${p.cost}</h2>
          <div class="box">
            <p class="desc">${p.description}</p>
            <small class="vendidos">${p.soldCount} vendidos</small>
          </div>
        </div>
      </article>`;
    })
    .join("");

  // Fallbacks en cascada si igualmente falla
  cont.querySelectorAll("img[data-name]").forEach((img) => {
    let triedRepoBackup = false;
    let triedNameBackup = false;
    let triedCategory = false;

    img.addEventListener("error", () => {
      const name = img.getAttribute("data-name") || "Producto";
      const path = img.getAttribute("data-path") || "";

      // 1) raíz del repo (por si el JSON tenía path relativo)
      if (!triedRepoBackup && path) {
        triedRepoBackup = true;
        img.src = joinRepo(path);
        return;
      }
      // 2) backup por nombre
      if (!triedNameBackup && backupImagesByName[name]) {
        triedNameBackup = true;
        img.src = backupImagesByName[name];
        return;
      }
      // 3) fallback de categoría
      if (!triedCategory && categoryFallback) {
        triedCategory = true;
        img.src = categoryFallback;
        return;
      }
      // 4) placeholder
      img.src = `https://placehold.co/800x480?text=${encodeURIComponent(name)}`;
    });
  });
}

/* =================== Lógica de filtros + orden + búsqueda =================== */
function recompute() {
  let list = all.slice();

  // precio
  const lo = Number.isFinite(state.min) ? state.min : -Infinity;
  const hi = Number.isFinite(state.max) ? state.max : Infinity;
  list = list.filter((p) => p.cost >= lo && p.cost <= hi);

  // búsqueda en nombre + descripción
  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  // orden
  if (state.sort === "asc")   list.sort((a, b) => a.cost - b.cost);
  if (state.sort === "desc")  list.sort((a, b) => b.cost - a.cost);
  if (state.sort === "rel")   list.sort((a, b) => b.soldCount - a.soldCount);

  render(list);
}

/* =================== Eventos UI =================== */
function wireUI() {
  // Orden
  $("#btnAsc")?.addEventListener("click", () => { state.sort = "asc";  localStorage.setItem("f_sort", "asc");  recompute(); });
  $("#btnDesc")?.addEventListener("click", () => { state.sort = "desc"; localStorage.setItem("f_sort", "desc"); recompute(); });
  $("#btnRel")?.addEventListener("click", () => { state.sort = "rel";  localStorage.setItem("f_sort", "rel");  recompute(); });

  // Filtro por precio
  $("#btnFilter")?.addEventListener("click", () => {
    const min = parseInt($("#minPrice")?.value ?? "", 10);
    const max = parseInt($("#maxPrice")?.value ?? "", 10);
    state.min = Number.isFinite(min) ? min : null;
    state.max = Number.isFinite(max) ? max : null;
    localStorage.setItem("f_min", state.min ?? "");
    localStorage.setItem("f_max", state.max ?? "");
    recompute();
  });

  $("#btnClear")?.addEventListener("click", () => {
    state.min = null;
    state.max = null;
    if ($("#minPrice")) $("#minPrice").value = "";
    if ($("#maxPrice")) $("#maxPrice").value = "";
    localStorage.removeItem("f_min");
    localStorage.removeItem("f_max");
    recompute();
  });

  // Búsqueda en tiempo real
  $("#searchBox")?.addEventListener("input", (e) => {
    state.q = (e.target.value || "").trim().toLowerCase();
    recompute();
  });

  // Click -> detalle
  $("#productos-container")?.addEventListener("click", (e) => {
    const art = e.target.closest(".fila");
    if (!art) return;
    localStorage.setItem("prodID", art.dataset.id);
    location.href = "product-info.html";
  });
}

/* =================== Init =================== */
document.addEventListener("DOMContentLoaded", async () => {
  // Guardia de sesión + header
  requerirSesion();
  const badge = $("#usuarioActual");
  if (badge) badge.textContent = getUsuario() || "";
  $("#btnSalir")?.addEventListener("click", cerrarSesion);

  // Restaurar UI de filtros y orden
  const minLS = localStorage.getItem("f_min");
  const maxLS = localStorage.getItem("f_max");
  if (minLS && $("#minPrice")) $("#minPrice").value = minLS;
  if (maxLS && $("#maxPrice")) $("#maxPrice").value = maxLS;
  state.min = minLS ? parseInt(minLS, 10) : null;
  state.max = maxLS ? parseInt(maxLS, 10) : null;

  wireUI();

  try {
    // Soporta ambos formatos de getJSONData (data directa o {status,data})
    const res = await getJSONData(PRODUCTS_URL);
    const data = (res && typeof res === "object" && "data" in res) ? res.data : res;
    if (!data) throw new Error("Respuesta vacía");

    const list = Array.isArray(data) ? data : (data.products || []);
    all = list.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      cost: p.cost,
      soldCount: p.soldCount,
      image: p.image, // lo resolvemos en render/pickImageURL
    }));

    if (data.catName && $("#titulo")) $("#titulo").textContent = data.catName;

    recompute(); // pinta aplicando (precio + búsqueda + orden) que haya en estado
  } catch (e) {
    $("#productos-container").innerHTML =
      `<div class="alert alert-danger">Error cargando productos: ${e.message}</div>`;
  }
});