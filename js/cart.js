// js/cart.js (no module) - Render del carrito y subtotales en vivo.
(function () {
  const $ = (s) => document.querySelector(s);
  const list = $("#cartList");
  const empty = $("#emptyCart");
  const totalsBox = $("#cartTotals");
  const grandTotalEl = $("#grandTotal");

  function formatMoney(currency, cost) {
    return `${currency} ${Number(cost)}`;
  }

  function renderItem(it, idx) {
    const li = document.createElement("div");
    li.className = "card shadow-sm";
    li.innerHTML = `
      <div class="card-body d-flex flex-column flex-sm-row gap-3 align-items-start align-items-sm-center">
        <img src="${it.image || ""}" alt="${it.name}" class="rounded" style="width:96px;height:96px;object-fit:cover">
        <div class="flex-grow-1 w-100">
          <h3 class="h6 mb-1">${it.name}</h3>
          <div class="text-muted small">Precio unitario: <strong>${formatMoney(it.currency, it.cost)}</strong></div>
          <div class="d-flex align-items-center gap-2 mt-2">
            <label for="qty-${idx}" class="form-label m-0">Cantidad</label>
            <input id="qty-${idx}" type="number" class="form-control form-control-sm" value="${it.quantity}" min="1" style="width:6.5rem">
            <button type="button" class="btn btn-outline-danger btn-sm" id="rm-${idx}" title="Quitar">Quitar</button>
            <div class="ms-auto">
              <span class="text-muted">Subtotal</span><br>
              <strong id="sub-${idx}">${formatMoney(it.currency, it.cost * it.quantity)}</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    const qtyInput = li.querySelector(`#qty-${idx}`);
    const rmBtn = li.querySelector(`#rm-${idx}`);
    const subEl = li.querySelector(`#sub-${idx}`);

    qtyInput.addEventListener("input", () => {
      const val = Math.max(1, parseInt(qtyInput.value || "1", 10));
      qtyInput.value = val;
      it.quantity = val;
      subEl.textContent = formatMoney(it.currency, it.cost * val);
      persistAndRender();
    });

    rmBtn.addEventListener("click", () => {
      const items = window.cartUtils.readCart();
      items.splice(idx, 1);
      window.cartUtils.writeCart(items);
      draw();
    });

    return li;
  }

  function draw() {
    if (!list || !empty || !totalsBox || !grandTotalEl || !window.cartUtils) return;
    const items = window.cartUtils.readCart();
    list.innerHTML = "";
    if (!items.length) {
      empty.classList.remove("d-none");
      totalsBox.classList.add("d-none");
      grandTotalEl.textContent = "—";
      return;
    }
    empty.classList.add("d-none");

    items.forEach((it, idx) => {
      list.appendChild(renderItem(it, idx));
    });

    const perCurrency = items.reduce((acc, it) => {
      const cur = it.currency || "USD";
      const sub = Number(it.cost) * Number(it.quantity);
      acc[cur] = (acc[cur] || 0) + sub;
      return acc;
    }, {});
    const summary = Object.entries(perCurrency)
      .map(([cur, sum]) => `${cur} ${sum}`)
      .join(" · ");
    grandTotalEl.textContent = summary;
    totalsBox.classList.remove("d-none");
  }

  function persistAndRender() {
    const cards = [...document.querySelectorAll("#cartList .card")];
    const items = window.cartUtils.readCart();
    cards.forEach((card, idx) => {
      const qtyInput = card.querySelector(`input[id^="qty-"]`);
      const qty = Math.max(1, parseInt((qtyInput && qtyInput.value) || "1", 10));
      if (items[idx]) items[idx].quantity = qty;
    });
    window.cartUtils.writeCart(items);
    draw();
  }

  document.addEventListener("DOMContentLoaded", draw);
  window.addEventListener("cart:updated", () => {
    // Si otro tab o página cambió el carrito
    draw();
  });
})();

/* Ajusta la tasa según prefieras: 1 USD = 40 UYU  =>  USD_PER_UYU = 1/40 */
const USD_PER_UYU = 0.025; // 1 USD = 40 UYU

(function () {
  const listSel = "#cartList";
  const totalsBoxSel = "#cartTotals";
  const grandTotalSel = "#grandTotal";

  function parseMoney(txt) {
    // acepta "USD 13500" o "UYU 4.000,50"
    const m = String(txt).trim().match(/(USD|UYU)\s*([\d.,]+)/i);
    if (!m) return null;
    const cur = m[1].toUpperCase();
    const amt = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(amt)) return null;
    return { currency: cur, amount: amt };
  }

  function readSubtotalsFromDOM() {
    // usa los <strong id="sub-#"> renderizados por cart.js
    const nodes = document.querySelectorAll(`${listSel} strong[id^="sub-"]`);
    const out = [];
    nodes.forEach(n => {
      const p = parseMoney(n.textContent);
      if (p) out.push(p);
    });
    return out;
  }

  function computeTotalUSD(parts) {
    return parts.reduce((acc, p) => {
      return acc + (p.currency === "USD" ? p.amount : p.amount * USD_PER_UYU);
    }, 0);
  }

  function ensureUsdRow() {
    // crea una línea debajo del total si no existe
    const box = document.querySelector(totalsBoxSel);
    if (!box) return null;
    let row = document.getElementById("grandTotalUSD");
    if (!row) {
      const cardBody = box.querySelector(".card-body") || box;
      row = document.createElement("div");
      row.id = "grandTotalUSD";
      row.className = "text-end mt-2 fw-bold";
      // colores amables para dark/light
      row.style.color = "var(--grandTotalUsdColor, #ffb74d)";
      cardBody.appendChild(row);
    }
    return row;
  }

  function renderUSD() {
    const items = readSubtotalsFromDOM();
    const totalUSD = computeTotalUSD(items);
    const slot = ensureUsdRow();
    if (!slot) return;

    // Si no hay ítems, vacía el slot
    const totalsBox = document.querySelector(totalsBoxSel);
    if (!items.length || !totalsBox || totalsBox.classList.contains("d-none")) {
      slot.textContent = "";
      return;
    }

    slot.textContent = "Total en USD: " + totalUSD.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Recalcular en los momentos clave
  document.addEventListener("DOMContentLoaded", renderUSD);
  document.addEventListener("input", (e) => {
    if (e.target && (e.target.matches("input") || e.target.matches("select"))) {
      setTimeout(renderUSD, 30);
    }
  });
  document.addEventListener("click", (e) => {
    // tras quitar productos u otras acciones
    if (e.target && /quitar/i.test(e.target.textContent || "")) {
      setTimeout(renderUSD, 30);
    }
  });
  window.addEventListener("cart:updated", () => setTimeout(renderUSD, 30));

  // Además, observa cambios en el listado para capturar re-render de cart.js
  const list = document.querySelector(listSel);
  if (list && window.MutationObserver) {
    const mo = new MutationObserver(() => setTimeout(renderUSD, 0));
    mo.observe(list, { childList: true, subtree: true, characterData: true });
  }
})();