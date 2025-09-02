import {
  getJSONData,
  PRODUCTS_101_URL,
  fullAsset,
  requerirSesion,
  cerrarSesion,
  getUsuario,
} from "./common.js";

// ================== BACKUP DE IMÁGENES ==================
const backupImages = {
  "Chevrolet Onix Joy":
    "https://www.chevrolet.com.uy/content/dam/chevrolet/south-america/uruguay/espanol/index/cars/2021-onix/colorizer/01-images/new-colorizer/ago-2022/colorizer-blanco.jpg?imwidth=1200",
  "Fiat Way":
    "https://http2.mlstatic.com/D_NQ_NP_687550-MLU50708884548_072022-O.webp",
  "Suzuki Celerio": "https://www.suzuki.com.uy/public/color5.png",
  "Peugeot 208":
    "https://www.pngplay.com/wp-content/uploads/13/Peugeot-208-2019-Download-Free-PNG.png",
  "Bugatti Chiron":
    "https://purepng.com/public/uploads/large/purepng.com-black-bugatti-chiron-carcarvehicletransportbugatti-961524653349rn5ct.png",
};

// ================== HELPERS & ESTADO UI ==================
const $ = (s) => document.querySelector(s);

let products = []; // lista original
let view = [];     // lista filtrada/ordenada que se muestra

// Persistencia de filtros/orden
const LS = { MIN: "f_min", MAX: "f_max", SORT: "f_sort" };
const getMin = () => parseInt($("#minPrice")?.value ?? "", 10);
const getMax = () => parseInt($("#maxPrice")?.value ?? "", 10);

function saveFilters() {
  const min = getMin();
  const max = getMax();
  Number.isFinite(min) ? localStorage.setItem(LS.MIN, String(min)) : localStorage.removeItem(LS.MIN);
  Number.isFinite(max) ? localStorage.setItem(LS.MAX, String(max)) : localStorage.removeItem(LS.MAX);
}
function restoreFilters() {
  const min = localStorage.getItem(LS.MIN);
  const max = localStorage.getItem(LS.MAX);
  if (min !== null && $("#minPrice")) $("#minPrice").value = min;
  if (max !== null && $("#maxPrice")) $("#maxPrice").value = max;
}
function saveSort(kind) { localStorage.setItem(LS.SORT, kind); }
function restoreSort() { return localStorage.getItem(LS.SORT); }

// ================== RENDER ==================
function render(list) {
  const cont = $("#productos-container");
  if (!cont) return;

  cont.innerHTML = list.map((p) => `
    <article class="fila" data-id="${p.id}">
      <figure class="thumb">
        <img
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
          referrerpolicy="no-referrer"
          data-name="${p.name.replace(/"/g, "&quot;")}"
        >
      </figure>
      <div class="info">
        <h2 class="nombre">${p.name}</h2>
        <div class="box">
          <span class="vendidos">${p.soldCount} unidades</span>
          <p class="desc">${p.description}</p>
          <span class="precio">USD ${p.cost}</span>
        </div>
      </div>
    </article>
  `).join("");

  // Fallback de imágenes (usa backupImages y luego placeholder)
  cont.querySelectorAll("img[data-name]").forEach((img) => {
    let triedBackup = false;
    img.addEventListener("error", () => {
      const name = img.getAttribute("data-name");
      if (!triedBackup && backupImages[name]) {
        triedBackup = true;
        img.src = backupImages[name];
        return;
      }
      img.src = `https://placehold.co/800x480?text=${encodeURIComponent(name || "Producto")}`;
    });
  });
}

// ================== FILTRO & ORDEN ==================
function applyFilters() {
  const min = getMin();
  const max = getMax();
  const lo = Number.isFinite(min) ? min : -Infinity;
  const hi = Number.isFinite(max) ? max : Infinity;
  view = products.filter((p) => p.cost >= lo && p.cost <= hi);
  render(view);
  saveFilters();
}

function sortBy(kind) {
  const list = (view.length ? view : products).slice();
  if (kind === "asc")  list.sort((a, b) => a.cost - b.cost);
  if (kind === "desc") list.sort((a, b) => b.cost - a.cost);
  if (kind === "rel")  list.sort((a, b) => b.soldCount - a.soldCount);
  render(list);
  saveSort(kind);
}

// ================== BUSCADOR (en tiempo real) ==================
function applySearch() {
  const q = ($("#searchBox")?.value || "").toLowerCase();
  const base = view.length ? view : products; // busca sobre lo filtrado/ordenado
  if (!q) {
    // si no hay texto, re-renderizar base actual
    render(base);
    return;
  }
  const filtered = base.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
  render(filtered);
}

// ================== CLICK -> PRODUCT INFO ==================
function handleOpenInfo(e) {
  const art = e.target.closest(".fila");
  if (!art) return;
  const id = art.dataset.id;
  if (!id) return;
  localStorage.setItem("prodID", id);
  location.href = "product-info.html";
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Guardia de sesión + barra superior
  requerirSesion();
  $("#usuarioActual") && ($("#usuarioActual").textContent = getUsuario());
  $("#btnSalir")?.addEventListener("click", cerrarSesion);

  // 2) Contenedor
  const cont = $("#productos-container");
  if (!cont) return;

  try {
    // 3) Fetch de la categoría 101
    const data = await getJSONData(PRODUCTS_101_URL);
    const list = Array.isArray(data) ? data : (data.products || []);

    products = list.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      cost: p.cost,
      soldCount: p.soldCount,
      image: fullAsset(p.image), // asegura URL absoluta
    }));
    view = products.slice();

    // 3.1 Título con nombre de categoría
    if (data.catName) {
      const t = $("#titulo");
      if (t) t.textContent = data.catName;
    }

    // 4) Restaurar UI y pintar
    restoreFilters();
    applyFilters();                // si no hay min/máx, muestra todos
    const last = restoreSort();
    last ? sortBy(last) : render(view);

    // 5) Eventos de UI (orden/filtro/limpiar)
    $("#btnAsc")   ?.addEventListener("click", () => { sortBy("asc");  applySearch(); });
    $("#btnDesc")  ?.addEventListener("click", () => { sortBy("desc"); applySearch(); });
    $("#btnRel")   ?.addEventListener("click", () => { sortBy("rel");  applySearch(); });
    $("#btnFilter")?.addEventListener("click", () => { applyFilters(); applySearch(); });
    $("#btnClear") ?.addEventListener("click", () => {
      const minI = $("#minPrice");
      const maxI = $("#maxPrice");
      if (minI) minI.value = "";
      if (maxI) maxI.value = "";
      localStorage.removeItem(LS.MIN);
      localStorage.removeItem(LS.MAX);
      view = products.slice();
      render(view);
      applySearch(); // respeta término de búsqueda si quedó texto
    });

    // 6) Buscador en tiempo real
    $("#searchBox")?.addEventListener("input", applySearch);

    // 7) Delegación de click para abrir detalle
    cont.addEventListener("click", handleOpenInfo);
  } catch (e) {
    cont.textContent = `Error cargando productos: ${e.message}`;
  }
});