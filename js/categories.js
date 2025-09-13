// js/categories.js (ES module)
import { getJSONData, CATEGORIES_URL } from "./common.js";

const ORDER_ASC_BY_NAME = "AZ";
const ORDER_DESC_BY_NAME = "ZA";
const ORDER_BY_PROD_COUNT = "Cant.";

let currentCategoriesArray = [];
let currentSortCriteria = ORDER_ASC_BY_NAME;
let minCount = undefined;
let maxCount = undefined;

function sortCategories(criteria, array) {
  const arr = array.slice(); // no mutar original
  if (criteria === ORDER_ASC_BY_NAME) {
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  } else if (criteria === ORDER_DESC_BY_NAME) {
    return arr.sort((a, b) => b.name.localeCompare(a.name));
  } else if (criteria === ORDER_BY_PROD_COUNT) {
    return arr.sort((a, b) => (parseInt(b.productCount) || 0) - (parseInt(a.productCount) || 0));
  }
  return arr;
}

// Guarda catID y navega
function setCatID(id) {
  localStorage.setItem("catID", String(id));
  window.location.href = "products.html";
}
window.setCatID = setCatID; // si sigues usando onclick inline

function showCategoriesList() {
  const cont = document.getElementById("cat-list-container");
  if (!cont) return;

  let html = "";
  for (const category of currentCategoriesArray) {
    const count = parseInt(category.productCount) || 0;

    const pasaMin = (minCount === undefined) || (count >= minCount);
    const pasaMax = (maxCount === undefined) || (count <= maxCount);
    if (!(pasaMin && pasaMax)) continue;

    html += `
      <div onclick="setCatID(${category.id})" class="list-group-item list-group-item-action cursor-active">
        <div class="row">
          <div class="col-3">
            <img src="${category.imgSrc}" alt="${category.description}" class="img-thumbnail">
          </div>
          <div class="col">
            <div class="d-flex w-100 justify-content-between">
              <h4 class="mb-1">${category.name}</h4>
              <small class="text-muted">${count} artículos</small>
            </div>
            <p class="mb-1">${category.description}</p>
          </div>
        </div>
      </div>
    `;
  }
  cont.innerHTML = html;
}

function sortAndShowCategories(sortCriteria, categoriesArray) {
  currentSortCriteria = sortCriteria ?? currentSortCriteria;
  if (Array.isArray(categoriesArray)) currentCategoriesArray = categoriesArray;

  currentCategoriesArray = sortCategories(currentSortCriteria, currentCategoriesArray);
  showCategoriesList();
}

document.addEventListener("DOMContentLoaded", async () => {
  // Cargar datos
  const res = await getJSONData(CATEGORIES_URL);
  if (res.status === "ok") {
    currentCategoriesArray = res.data || [];
    sortAndShowCategories(ORDER_ASC_BY_NAME);
  } else {
    console.error("Error cargando categorías:", res.data);
  }

  // Wire de controles
  document.getElementById("sortAsc")?.addEventListener("click", () => sortAndShowCategories(ORDER_ASC_BY_NAME));
  document.getElementById("sortDesc")?.addEventListener("click", () => sortAndShowCategories(ORDER_DESC_BY_NAME));
  document.getElementById("sortByCount")?.addEventListener("click", () => sortAndShowCategories(ORDER_BY_PROD_COUNT));

  document.getElementById("clearRangeFilter")?.addEventListener("click", () => {
    const minI = document.getElementById("rangeFilterCountMin");
    const maxI = document.getElementById("rangeFilterCountMax");
    if (minI) minI.value = "";
    if (maxI) maxI.value = "";
    minCount = undefined;
    maxCount = undefined;
    showCategoriesList();
  });

  document.getElementById("rangeFilterCount")?.addEventListener("click", () => {
    const minI = document.getElementById("rangeFilterCountMin");
    const maxI = document.getElementById("rangeFilterCountMax");

    const minVal = parseInt(minI?.value ?? "", 10);
    const maxVal = parseInt(maxI?.value ?? "", 10);

    minCount = Number.isFinite(minVal) && minVal >= 0 ? minVal : undefined;
    maxCount = Number.isFinite(maxVal) && maxVal >= 0 ? maxVal : undefined;

    showCategoriesList();
  });
});