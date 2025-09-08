/* js/products-info.js */

const PRODUCT_INFO_URL = (id) =>
  `https://japceibal.github.io/emercado-api/products/${id}.json`;
const PRODUCT_COMMENTS_URL = (id) =>
  `https://japceibal.github.io/emercado-api/products_comments/${id}.json`;

function $(sel){ return document.querySelector(sel); }
function el(tag, attrs={}, ...children){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(c));
  return node;
}

async function getJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Error ${res.status} cargando ${url}`);
  return res.json();
}

/* ============== Auto-descripción para detalle ============== */
function autoDescribe({ name, category, cost, currency = "USD", soldCount }) {
  const cat = String(category || "").toLowerCase();
  const precio = `${currency} ${cost}`;
  const vendidos = Number.isFinite(soldCount) ? `, con ${soldCount} vendidos` : "";

  if (cat.includes("auto")) {
    return `${name} es un automóvil práctico y confiable, ideal para uso diario. Ofrece buena relación precio-prestaciones (${precio})${vendidos}, bajo mantenimiento y confort para ciudad o ruta.`;
  }
  if (cat.includes("juguet")) {
    return `${name} es un juguete pensado para entretenimiento creativo y seguro. Su diseño resistente y fácil de usar lo vuelve una excelente opción (${precio})${vendidos}.`;
  }
  if (cat.includes("mueble")) {
    return `${name} es un mueble funcional con terminaciones cuidadas. Aporta estilo y practicidad al hogar u oficina, con materiales pensados para durar (${precio})${vendidos}.`;
  }
  if (cat.includes("comput")) {
    return `${name} es un equipo orientado a estudio y productividad. Buen desempeño general, conectividad moderna y gran relación costo-beneficio (${precio})${vendidos}.`;
  }
  return `${name} ofrece una propuesta equilibrada entre calidad y precio (${precio})${vendidos}.`;
}

function renderInfo(p){
  $("#productName").textContent = p.name;
  $("#productCategory").textContent = p.category || "";
  $("#productSoldCount").textContent = `${p.soldCount} vendidos`;
  $("#productCost").textContent = `${p.currency} ${p.cost}`;
  $("#productCostBig").textContent = `${p.currency} ${p.cost}`;
  $("#productCurrency").textContent = p.currency || "";

  // Descripción (usa auto-descripción si no viene del API)
  const desc = (p.description && p.description.trim().length)
    ? p.description
    : autoDescribe({
        name: p.name,
        category: p.category,
        cost: p.cost,
        currency: p.currency,
        soldCount: p.soldCount
      });
  $("#productDescription").textContent = desc;

  // Galería
  const main = $("#imageMain");
  const thumbs = $("#thumbs");
  thumbs.innerHTML = "";
  if (p.images && p.images.length){
    main.src = p.images[0];
    p.images.forEach(src => {
      const t = el("img", {class:"img-thumbnail", style:"width:90px;cursor:pointer", src, alt:"thumb"});
      t.addEventListener("click", () => main.src = src);
      thumbs.appendChild(t);
    });
  } else {
    main.removeAttribute("src");
  }

  // Relacionados
  const cont = $("#relatedProducts");
  cont.innerHTML = "";
  (p.relatedProducts || []).forEach(r => {
    const col = el("div", {class:"col-6 col-md-4 col-lg-3"});
    const card = el("div", {class:"card h-100 shadow-sm"});
    const img = el("img", {class:"card-img-top", src: r.image, alt: r.name});
    const body = el("div", {class:"card-body"});
    const h = el("h5", {class:"card-title", html: r.name});
    body.append(h);
    card.append(img, body);
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      localStorage.setItem("productID", r.id);
      location.href = "product-info.html";
    });
    col.append(card);
    cont.append(col);
  });
}

function stars(n){
  const full = "★".repeat(n);
  const empty = "☆".repeat(5-n);
  return `<span class="text-warning">${full}</span><span class="text-muted">${empty}</span>`;
}

function renderComments(list){
  const cont = $("#comments-container");
  cont.innerHTML = "";
  list.forEach(c => {
    const item = el("div", {class:"list-group-item"});
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <strong>${c.user}</strong>
        <small class="text-muted">${new Date(c.dateTime).toLocaleString()}</small>
      </div>
      <div>${stars(c.score)}</div>
      <p class="mb-0">${c.description}</p>
    `;
    cont.append(item);
  });
}

function bindCommentForm(productId){
  $("#add-comment")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = $("#comment-text").value.trim();
    const score = Number($("#comment-score").value);
    if(!txt) return;

    const nuevo = {
      product: productId,
      score,
      description: txt,
      user: (typeof getUsuario === "function" && getUsuario()) ||
            localStorage.getItem("usuario") || "usuario",
      dateTime: new Date().toISOString()
    };

    const list = $("#comments-container");
    const item = document.createElement("div");
    item.className = "list-group-item";
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <strong>${nuevo.user}</strong>
        <small class="text-muted">${new Date(nuevo.dateTime).toLocaleString()}</small>
      </div>
      <div>${stars(nuevo.score)}</div>
      <p class="mb-0">${nuevo.description}</p>
    `;
    list.prepend(item);

    $("#comment-text").value = "";
    $("#comment-score").value = "5";
  });
}

(async function init(){
  try{
    const id = localStorage.getItem("productID");
    if(!id) { location.href = "products.html"; return; }

    const [info, comments] = await Promise.all([
      getJSON(PRODUCT_INFO_URL(id)),
      getJSON(PRODUCT_COMMENTS_URL(id))
    ]);

    renderInfo(info);
    renderComments(comments || []);
    bindCommentForm(id);
  }catch(err){
    console.error(err);
    alert("No se pudo cargar el producto.");
  }
})();