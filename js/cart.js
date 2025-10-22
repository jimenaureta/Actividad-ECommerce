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