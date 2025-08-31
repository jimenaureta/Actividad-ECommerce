// js/init.js
// ====== BLOQUE NUEVO (redirige a login si no hay sesión) ======
(() => {
  const isLogin = /(^|\/)login\.html$/i.test(location.pathname);
  const tieneSesion = sessionStorage.getItem("sesionIniciada") === "true";
  if (!isLogin && !tieneSesion) {
    location.href = "login.html";
  }
})();
// ====== FIN BLOQUE NUEVO ======

// (lo demás queda igual)
const CATEGORIES_URL = "https://japceibal.github.io/emercado-api/cats/cat.json";
const PUBLISH_PRODUCT_URL = "https://japceibal.github.io/emercado-api/sell/publish.json";
const PRODUCTS_URL = "https://japceibal.github.io/emercado-api/cats_products/";
const PRODUCT_INFO_URL = "https://japceibal.github.io/emercado-api/products/";
const PRODUCT_INFO_COMMENTS_URL = "https://japceibal.github.io/emercado-api/products_comments/";
const CART_INFO_URL = "https://japceibal.github.io/emercado-api/user_cart/";
const CART_BUY_URL = "https://japceibal.github.io/emercado-api/cart/buy.json";
const EXT_TYPE = ".json";

let showSpinner = function(){
  document.getElementById("spinner-wrapper").style.display = "block";
}

let hideSpinner = function(){
  document.getElementById("spinner-wrapper").style.display = "none";
}

let getJSONData = function(url){
  let result = {};
  showSpinner();
  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    })
    .then(function(response) {
      result.status = 'ok';
      result.data = response;
      hideSpinner();
      return result;
    })
    .catch(function(error) {
      result.status = 'error';
      result.data = error;
      hideSpinner();
      return result;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("usuarioActual");
  if (badge) {
    const u = sessionStorage.getItem("usuario") || "";
    badge.textContent = u;
  }
});
