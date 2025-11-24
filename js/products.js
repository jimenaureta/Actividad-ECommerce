// js/products.js
import { 
  getJSONData, 
  PRODUCTS_BASE_URL, 
  EXT_TYPE 
} from "./common.js";

/* =================== Config / URLs =================== */
const CAT_ID = localStorage.getItem("catID") || "101";

// BACKEND
const PRODUCTS_URL = `${PRODUCTS_BASE_URL}${CAT_ID}${EXT_TYPE}`;

/* =================== Backups de imágenes =================== */
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

// Fallback genérico por categoría
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
  const p = String(path || "").replace(/^\/+/, "");
  return /^https?:\/\//i.test(p)
    ? p
    : `https://japceibal.github.io/emercado-api/${p}`;
}
function joinFromJson(path) {
  return /^https?:\/\//i.test(path)
    ? path
    : new URL(String(path || ""), PRODUCTS_URL).href;
}

function pickImageURL(product) {
  if (backupImagesByName[product.name]) return backupImagesByName[product.name];
  if (product.image) return joinFromJson(product.image);
  return categoryFallback;
}

/* ============== Auto-descripciones por categoría ============== */
function inferCategoriaDesdeNombre(catName) {
  const s = String(catName || "").toLowerCase();
  if (s.includes("auto")) return "autos";
  if (s.includes("juguet")) return "juguetes";
  if (s.includes("mueble")) return "muebles";
  if (s.includes("comput")) return "computadoras";
  return "otros";
}

function autoDescribe({ name, category, cost, currency = "USD", soldCount }) {
  const cat = String(category || "").toLowerCase();
  const precio = `${currency} ${cost}`;
  const vendidos = Number.isFinite(soldCount) ? `, con ${soldCount} vendidos` : "";

  if (cat.includes("auto")) {
    return `${name} es un automóvil práctico y confiable, ideal para uso diario. Ofrece buena relación precio-prestaciones (${precio})${vendidos}, bajo mantenimiento y confort para ciudad o ruta.`;
  }
  if (cat.includes("juguet")) {
    return `${name} es un juguete diseñado para entretenimiento creativo y seguro. Su construcción resistente y fácil uso lo vuelven una gran opción (${precio})${vendidos}.`;
  }
  if (cat.includes("mueble")) {
    return `${name} es un mueble funcional con terminaciones cuidadas. Aporta estilo y practicidad al hogar u oficina, con materiales pensados para durar (${precio})${vendidos}.`;
  }
  if (cat.includes("comput")) {
    return `${name} es un equipo orientado a estudio y productividad. Buen desempeño general, conectividad moderna y excelente relación costo-beneficio (${precio})${vendidos}.`;
  }
  return `${name} ofrece una propuesta equilibrada entre calidad y precio (${precio})${vendidos}.`;
}

/* =================== Estado =================== */
let all = [];
const state = {
  min: null,
  max: null,
  q: "",
  sort: localStorage.getItem("f_sort") || "rel", // 'asc' | 'desc' | 'rel'
};

/* ============ Selectores compatibles ============ */
const UI = {
  cont: () => $("#productos-container") || $("#products-list"),
  title: () => $("#titulo") || $("#catTitle"),
  btnAsc: () => $("#btnAsc") || $("#sortAsc"),
  btnDesc: () => $("#btnDesc") || $("#sortDesc"),
  btnRel: () => $("#btnRel") || $("#sortByRel"),
  minPrice: () => $("#minPrice") || $("#rangeFilterCountMin"),
  maxPrice: () => $("#maxPrice") || $("#rangeFilterCountMax"),
  btnFilter: () => $("#btnFilter") || $("#rangeFilterCount"),
  btnClear: () => $("#btnClear") || $("#clearRangeFilter"),
  searchBox: () => $("#searchBox"),
  emptyState: () => $("#emptyState"),
};

/* =================== Render (semántico) =================== */
function render(list) {
  const cont = UI.cont();
  if (!cont) return;

  cont.setAttribute("role", "list");
  cont.innerHTML = list
    .map((p) => {
      const initial = pickImageURL(p);
      const dataPath = (p.image || "").replace(/"/g, "&quot;");
      const dataName = p.name.replace(/"/g, "&quot;");
      const soldText = Number.isFinite(p.soldCount) ? `${p.soldCount} vendidos` : "—";
      const currency = p.currency || "USD";

      return `
      <article
        class="fila col-12 col-sm-6 col-lg-4"
        data-id="${p.id}"
        role="listitem"
        tabindex="0"
        aria-label="${dataName}, ${currency} ${p.cost}"
        data-price="${p.cost}"
        data-sold="${p.soldCount ?? 0}"
        style="cursor:pointer"
      >
        <div class="card h-100 shadow-sm">
          <header class="card-header d-flex justify-content-between align-items-start gap-2">
            <h3 class="h6 lh-sm m-0">${p.name}</h3>
            <span class="badge text-bg-light" title="Unidades vendidas" aria-label="Vendidos: ${p.soldCount ?? 0}">
              ${soldText}
            </span>
          </header>

          <figure class="m-0">
            <img
              src="${initial}"
              alt="Imagen de ${dataName}"
              class="card-img-top"
              loading="lazy"
              referrerpolicy="no-referrer"
              data-name="${dataName}"
              data-path="${dataPath}"
            >
            <figcaption class="small text-muted px-3 pt-1">Producto</figcaption>
          </figure>

          <section class="card-body">
            <p class="card-text text-body-secondary mb-3">${p.description}</p>
            <div class="d-flex justify-content-between align-items-center">
              <p class="fw-bold m-0">
                <data value="${p.cost}">${currency} ${p.cost}</data>
              </p>
              <a href="product-info.html" class="btn btn-primary btn-sm" aria-label="Ver detalle de ${dataName}">
                Ver detalle
              </a>
            </div>
          </section>
        </div>
      </article>`;
    })
    .join("");

  // fallbacks de imagen
  cont.querySelectorAll("img[data-name]").forEach((img) => {
    let triedRepoBackup = false;
    let triedNameBackup = false;
    let triedCategory = false;

    img.addEventListener("error", () => {
      const name = img.getAttribute("data-name") || "Producto";
      const path = img.getAttribute("data-path") || "";

      if (!triedRepoBackup && path) { triedRepoBackup = true; img.src = joinRepo(path); return; }
      if (!triedNameBackup && backupImagesByName[name]) { triedNameBackup = true; img.src = backupImagesByName[name]; return; }
      if (!triedCategory && categoryFallback) { triedCategory = true; img.src = categoryFallback; return; }
      img.src = `https://placehold.co/800x480?text=${encodeURIComponent(name)}`;
    });
  });
}

/* =================== Filtros + orden + búsqueda =================== */
function recompute() {
  let list = all.slice();

  const lo = Number.isFinite(state.min) ? state.min : -Infinity;
  const hi = Number.isFinite(state.max) ? state.max : Infinity;
  list = list.filter((p) => p.cost >= lo && p.cost <= hi);

  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (state.sort === "asc")   list.sort((a, b) => a.cost - b.cost);
  if (state.sort === "desc")  list.sort((a, b) => b.cost - a.cost);
  if (state.sort === "rel")   list.sort((a, b) => b.soldCount - a.soldCount);

  render(list);

  const empty = UI.emptyState && UI.emptyState();
  if (empty) empty.style.display = list.length ? "none" : "block";
}

/* =================== Eventos UI =================== */
function wireUI() {
  UI.btnAsc()?.addEventListener("click", () => { state.sort = "asc";  localStorage.setItem("f_sort", "asc");  recompute(); });
  UI.btnDesc()?.addEventListener("click", () => { state.sort = "desc"; localStorage.setItem("f_sort", "desc"); recompute(); });
  UI.btnRel()?.addEventListener("click", () => { state.sort = "rel";  localStorage.setItem("f_sort", "rel");  recompute(); });

  UI.btnFilter()?.addEventListener("click", () => {
    const min = parseInt(UI.minPrice()?.value ?? "", 10);
    const max = parseInt(UI.maxPrice()?.value ?? "", 10);
    state.min = Number.isFinite(min) ? min : null;
    state.max = Number.isFinite(max) ? max : null;
    localStorage.setItem("f_min", state.min ?? "");
    localStorage.setItem("f_max", state.max ?? "");
    recompute();
  });

  UI.btnClear()?.addEventListener("click", (e) => {
    e.preventDefault?.();
    state.min = null; state.max = null;
    if (UI.minPrice()) UI.minPrice().value = "";
    if (UI.maxPrice()) UI.maxPrice().value = "";
    localStorage.removeItem("f_min"); localStorage.removeItem("f_max");
    recompute();
  });

  UI.searchBox()?.addEventListener("input", (e) => {
    state.q = (e.target.value || "").trim().toLowerCase();
    recompute();
  });

  UI.cont()?.addEventListener("click", (e) => {
    const art = e.target.closest(".fila");
    if (!art) return;
    localStorage.setItem("productID", art.dataset.id);
    location.href = "product-info.html";
  });

  UI.cont()?.addEventListener("keydown", (e) => {
    const art = e.target.closest('.fila[tabindex]');
    if (!art) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      localStorage.setItem("productID", art.dataset.id);
      location.href = "product-info.html";
    }
  });
}

/* =================== Init =================== */
document.addEventListener("DOMContentLoaded", async () => {
  const minLS = localStorage.getItem("f_min");
  const maxLS = localStorage.getItem("f_max");
  if (minLS && UI.minPrice()) UI.minPrice().value = minLS;
  if (maxLS && UI.maxPrice()) UI.maxPrice().value = maxLS;
  state.min = minLS ? parseInt(minLS, 10) : null;
  state.max = maxLS ? parseInt(maxLS, 10) : null;

  wireUI();

  try {
    const res = await getJSONData(PRODUCTS_URL);
    if (res.status !== "ok") throw new Error(res.data?.message || "Error HTTP");

    const data = res.data; // JSON real
    const list = Array.isArray(data) ? data : (data.products || []);
    const catNombre = (data && data.catName) || "";
    const catInferida = inferCategoriaDesdeNombre(catNombre);

    all = list.map((p) => {
      const currency = p.currency || data.currency || "USD";
      const desc = p.description && p.description.trim().length
        ? p.description
        : autoDescribe({ name: p.name, category: catInferida, cost: p.cost, currency, soldCount: p.soldCount });

      return { id: p.id, name: p.name, description: desc, cost: p.cost, soldCount: p.soldCount, image: p.image, currency };
    });

    const t = UI.title();
    if (data.catName && t) t.textContent = data.catName;

    recompute();
  } catch (e) {
    const cont = UI.cont();
    if (cont) cont.innerHTML = `<div class="alert alert-danger">Error cargando productos: ${e.message}</div>`;
    const empty = UI.emptyState && UI.emptyState();
    if (empty) { empty.textContent = "No se pudo cargar la lista de productos."; empty.style.display = "block"; }
    console.error(e);
  }
});
