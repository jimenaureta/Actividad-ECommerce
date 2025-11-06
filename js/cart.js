(function () {
  // ==== Storage helpers (compatibles con cart-badge.js) ====
  const CART_KEY = window.CART_KEY || "cartItems";
  const cartUtils = window.cartUtils || {
    readCart,
    writeCart,
    renderCartBadge() {}
  };

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items || []));
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }

  // ==== Estado =====
  let items = [];
  let shippingPercent = null; // 0.15 | 0.07 | 0.05 | null

  // ==== Utilidades ====
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function money(num, currency) {
    const n = Number(num) || 0;
    const cur = currency || guessCurrency();
    return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function guessCurrency() {
    // Intenta inferir desde el primer item
    const it = items[0];
    return it?.currency || "USD";
  }
  function lineSubtotal(it) {
    const q = Math.max(0, parseInt(it.quantity, 10) || 0);
    const c = Number(it.cost) || 0;
    return q * c;
  }
  function cartSubtotal() {
    return items.reduce((acc, it) => acc + lineSubtotal(it), 0);
  }
  function shippingCost() {
    const sub = cartSubtotal();
    return shippingPercent ? sub * shippingPercent : 0;
  }
  function grandTotal() {
    return cartSubtotal() + shippingCost();
  }

  // ==== Render de lista de productos ====
  function renderList() {
    const list = $("#cartList");
    const empty = $("#emptyCart");
    list.innerHTML = "";

    if (!items.length) {
      empty.classList.remove("d-none");
      updateTotals();
      return;
    }
    empty.classList.add("d-none");

    items.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "card shadow-sm";
      row.innerHTML = `
        <div class="card-body d-flex gap-3 align-items-center flex-wrap">
          <img src="${it.image || it.img || ""}" alt="${escapeHtml(it.name || "Producto")}" class="rounded" style="width:86px;height:86px;object-fit:cover">
          <div class="flex-grow-1">
            <div class="fw-bold">${escapeHtml(it.name || "Producto")}</div>
            <small class="text-muted">${it.currency || "USD"} ${Number(it.cost || 0)}</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <label class="form-label m-0" for="qty_${idx}">Cant.</label>
            <input id="qty_${idx}" type="number" class="form-control form-control-sm qty-input" min="0" step="1" value="${Math.max(0, parseInt(it.quantity, 10) || 1)}" data-index="${idx}" style="width:6rem">
          </div>
          <div class="text-end">
            <div class="small text-muted">Subtotal</div>
            <div class="fw-bold" id="lineTotal_${idx}">${money(lineSubtotal(it), it.currency)}</div>
          </div>
          <button class="btn btn-outline-danger btn-sm ms-auto remove-btn" data-index="${idx}" title="Quitar">
            <i class="fa fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      `;
      list.appendChild(row);
    });

    // Wire events
    $$(".qty-input").forEach((inp) => {
      inp.addEventListener("input", onQtyChange);
      inp.addEventListener("change", onQtyChange);
    });
    $$(".remove-btn").forEach((btn) => btn.addEventListener("click", onRemoveItem));

    updateTotals();
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  }

  // ==== Totales ====
  function updateTotals() {
    $("#subtotalText").textContent = money(cartSubtotal());
    $("#shippingText").textContent = shippingPercent == null ? "—" : money(shippingCost());
    $("#totalText").textContent = money(grandTotal());
  }

  // ==== Eventos de cantidad y eliminar ====
  function onQtyChange(e) {
    const idx = parseInt(e.target.dataset.index, 10);
    if (!Number.isFinite(idx) || !items[idx]) return;

    const val = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
    items[idx].quantity = val;

    // Si queda en 0, quitamos del carrito
    if (val === 0) {
      items.splice(idx, 1);
      writeCart(items);
      cartUtils.renderCartBadge?.();
      renderList();
      return;
    }

    // Actualiza línea + guarda
    const line = $("#lineTotal_" + idx);
    if (line) line.textContent = money(lineSubtotal(items[idx]), items[idx].currency);
    writeCart(items);
    cartUtils.renderCartBadge?.();
    updateTotals();
  }

  function onRemoveItem(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (!Number.isFinite(idx) || !items[idx]) return;
    items.splice(idx, 1);
    writeCart(items);
    cartUtils.renderCartBadge?.();
    renderList();
  }

  // ==== Envío ====
  function wireShipping() {
    $$(".shipping-option").forEach((r) => {
      r.addEventListener("change", () => {
        const p = parseFloat(r.dataset.percent);
        shippingPercent = Number.isFinite(p) ? p : null;
        updateTotals();
      });
    });
  }

  // ==== Pago (mostrar/ocultar formularios) ====
  function wirePayment() {
    const card = $("#cardForm");
    const bank = $("#bankForm");
    $$(".pay-option").forEach((r) => {
      r.addEventListener("change", () => {
        if (r.value === "card") {
          card.classList.remove("d-none");
          bank.classList.add("d-none");
          clearBank();
        } else if (r.value === "bank") {
          bank.classList.remove("d-none");
          card.classList.add("d-none");
          clearCard();
        }
      });
    });
  }

  function clearCard() {
    ["cardNumber", "cardName", "cardExpiry", "cardCVV"].forEach((id) => {
      const el = $("#" + id);
      if (el) { el.value = ""; el.classList.remove("is-invalid"); }
    });
  }
  function clearBank() {
    ["bankName", "bankAccount", "bankOwner"].forEach((id) => {
      const el = $("#" + id);
      if (el) { el.value = ""; el.classList.remove("is-invalid"); }
    });
  }

  // ==== Validaciones ====
  function validateAddress() {
    const form = $("#addressForm");
    if (!form) return false;
    let ok = true;
    ["addrDepto", "addrLocalidad", "addrCalle", "addrNumero", "addrEsquina"].forEach((id) => {
      const el = $("#" + id);
      if (!el || !String(el.value).trim()) {
        el.classList.add("is-invalid");
        ok = false;
      } else {
        el.classList.remove("is-invalid");
      }
    });
    return ok;
  }

  function validateShipping() {
    return $$(".shipping-option").some((r) => r.checked);
  }

  function selectedPayment() {
    const r = $$(".pay-option").find((x) => x.checked);
    return r ? r.value : null;
  }

  function validatePayment() {
    const sel = selectedPayment();
    if (!sel) return false;

    if (sel === "card") {
      const must = ["cardNumber", "cardName", "cardExpiry", "cardCVV"];
      return must.every((id) => {
        const el = $("#" + id);
        const ok = Boolean(String(el.value).trim());
        el.classList.toggle("is-invalid", !ok);
        return ok;
      });
    }
    if (sel === "bank") {
      const must = ["bankName", "bankAccount", "bankOwner"];
      return must.every((id) => {
        const el = $("#" + id);
        const ok = Boolean(String(el.value).trim());
        el.classList.toggle("is-invalid", !ok);
        return ok;
      });
    }
    return false;
  }

  function validateQuantities() {
    return items.length > 0 && items.every((it) => (parseInt(it.quantity, 10) || 0) > 0);
  }

  // ==== Finalizar compra (ficticio) ====
  function onCheckout() {
    const fb = $("#feedback");
    fb.className = "alert d-none mt-3";
    fb.textContent = "";

    const vAddr = validateAddress();
    const vShip = validateShipping();
    const vQtys = validateQuantities();
    const vPay = validatePayment();

    if (!vAddr || !vShip || !vQtys || !vPay) {
      fb.className = "alert alert-danger mt-3";
      fb.textContent = "Revisa los datos: dirección, envío, cantidades y forma de pago son obligatorios.";
      return;
    }

    // Éxito ficticio
    fb.className = "alert alert-success mt-3";
    fb.innerHTML = `<strong>¡Compra exitosa!</strong> Tus datos fueron enviados (simulado).`;

    // Limpieza mínima del carrito tras confirmar
    items = [];
    writeCart(items);
    cartUtils.renderCartBadge?.();
    renderList();
  }

  // ==== Init ====
  document.addEventListener("DOMContentLoaded", () => {
    items = normalize(readCart());
    renderList();
    wireShipping();
    wirePayment();
    $("#checkoutBtn")?.addEventListener("click", onCheckout);

    // Recalcular totales si otro script actualiza el carrito
    window.addEventListener("cart:updated", () => {
      items = normalize(readCart());
      renderList();
    });
  });

  // Estandariza estructura de items para mayor compatibilidad
  function normalize(arr) {
    return (arr || []).map((it) => ({
      id: it.id ?? it.productId ?? cryptoRandom(),
      name: it.name ?? it.title ?? "Producto",
      currency: it.currency || "USD",
      cost: Number(it.cost ?? it.price ?? 0),
      quantity: Math.max(0, parseInt(it.quantity ?? it.qty ?? 1, 10) || 1),
      image: it.image || it.img || ""
    }));
  }

  function cryptoRandom() {
    try {
      const b = new Uint32Array(1);
      crypto.getRandomValues(b);
      return String(b[0]);
    } catch { return String(Math.random()).slice(2); }
  }
})();

(function () {
  // Helper para crear y mostrar un toast Bootstrap
  function showToast(message, type = "info", delay = 3000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const bg =
      type === "success" ? "bg-success" :
      type === "danger"  ? "bg-danger"  :
      type === "warning" ? "bg-warning text-dark" : "bg-info";

    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white ${bg} border-0 shadow`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    `;
    container.appendChild(toast);

    try {
      // Si está Bootstrap, usamos su API
      const bsToast = new bootstrap.Toast(toast, { delay, autohide: true });
      toast.addEventListener("hidden.bs.toast", () => toast.remove());
      bsToast.show();
    } catch {
      // Fallback simple si no está Bootstrap JS
      toast.style.opacity = "0.95";
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.transition = "opacity .3s";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, delay);
    }
  }

  // Observa el #feedback existente sin modificar su lógica original.
  document.addEventListener("DOMContentLoaded", function () {
    const fb = document.getElementById("feedback");
    if (!fb) return;

    const pickType = () => {
      const txt = (fb.textContent || "").trim();
      const cls = fb.className || "";
      if (cls.includes("alert-danger")) return "danger";
      if (cls.includes("alert-success")) return "success";
      if (/revisa/i.test(txt)) return "danger";
      if (/éxito|exitos/i.test(txt)) return "success";
      return "info";
    };

    const handleChange = () => {
      const msg = (fb.textContent || "").trim();
      if (!msg) return;
      // Muestra toast emergente y oculta el feedback estático
      showToast(msg, pickType(), 3000);
      // No tocamos la línea original que lo setea; solo lo ocultamos luego.
      setTimeout(() => {
        fb.classList.add("d-none");
        fb.textContent = "";
      }, 0);
    };

    const obs = new MutationObserver(handleChange);
    obs.observe(fb, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });

    // Si ya vino con contenido desde el render inicial
    handleChange();
  });
})();