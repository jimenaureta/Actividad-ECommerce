// === Constantes de endpoints del curso ===
const PRODUCT_INFO_URL = (id) => `https://japceibal.github.io/emercado-api/products/${id}.json`;
const PRODUCT_COMMENTS_URL = (id) => `https://japceibal.github.io/emercado-api/products_comments/${id}.json`;

// === Helpers ===
const $ = (sel) => document.querySelector(sel);
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => node.appendChild(c));
  return node;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status} cargando ${url}`);
  return res.json();
}

// === Render de estrellas con medias ===
function starIcons(score) {
  // score puede ser decimal (ej: 4.5)
  const full = Math.floor(score);
  const frac = score - full;
  const hasHalf = frac >= 0.25 && frac < 0.75;
  const plusFull = frac >= 0.75 ? 1 : 0;
  const totalFull = full + plusFull;
  const total = 5;
  let html = '';
  for (let i = 0; i < total; i++) {
    if (i < totalFull) html += '<i class="fa fa-star" aria-hidden="true"></i>';
    else if (i === totalFull && hasHalf) html += '<i class="fa fa-star-half-o" aria-hidden="true"></i>';
    else html += '<i class="fa fa-star-o" aria-hidden="true"></i>';
  }
  return html;
}

function starsFixed(n){
  // n entero 1..5
  return '<span class="text-warning">' + '★'.repeat(n) + '</span><span class="text-muted">' + '☆'.repeat(5-n) + '</span>';
}

// === Descripción automática si falta en API ===
function autoDescribe({ name, category, cost, currency = 'USD', soldCount }) {
  const cat = String(category || '').toLowerCase();
  const precio = `${currency} ${cost}`;
  const vendidos = Number.isFinite(soldCount) ? `, con ${soldCount} vendidos` : '';
  if (cat.includes('auto')) {
    return `${name} es un automóvil práctico y confiable, ideal para uso diario. Ofrece buena relación precio-prestaciones (${precio})${vendidos}.`;
  }
  if (cat.includes('juguet')) {
    return `${name} es un juguete pensado para entretenimiento creativo y seguro. Excelente opción (${precio})${vendidos}.`;
  }
  if (cat.includes('mueble')) {
    return `${name} es un mueble funcional con terminaciones cuidadas. Aporta estilo y practicidad (${precio})${vendidos}.`;
  }
  if (cat.includes('comput')) {
    return `${name} es un equipo orientado a estudio y productividad. Gran relación costo-beneficio (${precio})${vendidos}.`;
  }
  return `${name} ofrece una propuesta equilibrada entre calidad y precio (${precio})${vendidos}.`;
}

// === Estado de comentarios (API + locales simulados) ===
let commentData = [];

function renderInfo(p) {
  $('#productName').textContent = p.name;
  $('#productCategory').textContent = p.category || '';
  $('#productSoldCount').textContent = `${p.soldCount ?? 0} vendidos`;
  $('#productCost').textContent = `${p.currency} ${p.cost}`;
  $('#productCostBig').textContent = `${p.currency} ${p.cost}`;
  $('#productCurrency').textContent = p.currency || '';

  const desc = (p.description && p.description.trim().length)
    ? p.description
    : autoDescribe(p);
  $('#productDescription').textContent = desc;

  // Galería
  const main = $('#imageMain');
  const thumbs = $('#thumbs');
  thumbs.innerHTML = '';
  if (Array.isArray(p.images) && p.images.length) {
    main.src = p.images[0];
    p.images.forEach((src) => {
      const t = el('img', { class: 'img-thumbnail', style: 'width:90px;cursor:pointer', src, alt: 'thumb' });
      t.addEventListener('click', () => (main.src = src));
      thumbs.appendChild(t);
    });
  } else {
    main.removeAttribute('src');
  }

  // Relacionados
  const cont = $('#relatedProducts');
  cont.innerHTML = '';
  (p.relatedProducts || []).forEach((r) => {
    const col = el('div', { class: 'col-6 col-md-4 col-lg-3' });
    const card = el('div', { class: 'card h-100 shadow-sm' });
    const img = el('img', { class: 'card-img-top', src: r.image, alt: r.name });
    const body = el('div', { class: 'card-body' });
    const h = el('h5', { class: 'card-title', html: r.name });
    body.append(h);
    card.append(img, body);
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      localStorage.setItem('productID', r.id);
      location.href = 'product-info.html';
    });
    col.append(card);
    cont.append(col);
  });
}

function renderComments(list) {
  const cont = $('#comments-container');
  cont.innerHTML = '';
  list.forEach((c) => {
    const item = el('div', { class: 'list-group-item' });
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <strong>${c.user}</strong>
        <small class="text-muted">${new Date(c.dateTime).toLocaleString()}</small>
      </div>
      <div class="text-warning fs-6 mb-1">${starsFixed(c.score)}</div>
      <p class="mb-0">${c.description}</p>
    `;
    cont.append(item);
  });
}

function updateSummary(list) {
  const n = list.length;
  const avg = n ? (list.reduce((a, c) => a + Number(c.score || 0), 0) / n) : 0;
  $('#avgScore').textContent = avg.toFixed(1);
  $('#avgStars').innerHTML = `<span class="text-warning">${starIcons(avg)}</span>`;
  $('#ratingsCount').textContent = `(${n} calificación${n === 1 ? '' : 'es'})`;

  // Distribución 5..1
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  list.forEach((c) => counts[c.score] = (counts[c.score] || 0) + 1);
  const bars = $('#ratingBars');
  bars.innerHTML = '';
  for (let s = 5; s >= 1; s--) {
    const count = counts[s] || 0;
    const pct = n ? Math.round((count / n) * 100) : 0;

    const row = el('div', { class: 'd-flex align-items-center gap-2' });
    const label = el('div', { class: 'text-nowrap', html: `<span class="me-1">${'★'.repeat(s)}</span><small class="text-muted">(${count})</small>` });

    const prog = el('div', { class: 'progress flex-grow-1', style: 'height: 10px;' });
    const bar = el('div', { class: 'progress-bar', role: 'progressbar', style: `width:${pct}%` });
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    prog.append(bar);

    const percent = el('small', { class: 'text-muted ms-2', html: `${pct}%` });

    row.append(label, prog, percent);
    bars.append(row);
  }
}

function loadLocalReviews(productID) {
  try {
    const raw = localStorage.getItem(`reviews_${productID}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalReviews(productID, arr) {
  localStorage.setItem(`reviews_${productID}`, JSON.stringify(arr));
}

function mergeReviews(apiList, localList) {
  // Orden: más recientes primero
  const all = [...apiList, ...localList];
  return all.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
}

async function main() {
  // Email visible en navbar lo maneja init.js/common.js (ya en tu proyecto)
  const productID = localStorage.getItem('productID') || 50924; // fallback por si falta

  // Carga de producto y comentarios del API
  const [product, apiComments] = await Promise.all([
    getJSON(PRODUCT_INFO_URL(productID)),
    getJSON(PRODUCT_COMMENTS_URL(productID))
  ]);

  renderInfo(product);

  const local = loadLocalReviews(productID);
  commentData = mergeReviews(apiComments, local);
  renderComments(commentData);
  updateSummary(commentData);

  // Manejo de formulario (simulado sin servidor)
  const form = $('#add-comment');
  const txt = $('#comment-text');
  const scoreSel = $('#comment-score');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!txt.value.trim()) {
      txt.classList.add('is-invalid');
      return;
    }
    txt.classList.remove('is-invalid');

    const user = (typeof getUsuario === 'function' ? getUsuario() : null) || localStorage.getItem('email') || 'Usuario';
    const now = new Date();
    const review = {
      product: Number(productID),
      score: Number(scoreSel.value),
      description: txt.value.trim(),
      user,
      dateTime: now.toISOString().slice(0, 19).replace('T', ' ')
    };

    // Persistir simulación por producto y refrescar vistas
    const currentLocal = loadLocalReviews(productID);
    currentLocal.push(review);
    saveLocalReviews(productID, currentLocal);

    commentData = mergeReviews(commentData, [review]);
    renderComments(commentData);
    updateSummary(commentData);

    form.reset();
  });
}

// Inicializar
main().catch((err) => {
  console.error(err);
});