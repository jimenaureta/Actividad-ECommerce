import {
  getJSONData,
  PRODUCTS_101_URL,
  fullAsset,
  requerirSesion,
  cerrarSesion,
  getUsuario,
} from "./common.js";

// Respaldo cuando la imagen del JSON no carga
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

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Guardia de sesión
  requerirSesion();

  // 2) Usuario + salir
  document.getElementById("usuarioActual").textContent = getUsuario();
  document.getElementById("btnSalir")?.addEventListener("click", cerrarSesion);

  // 3) Contenedor
  const cont = document.getElementById("productos-container");
  if (!cont) return;

  try {
    // 4) Fetch
    const { products = [] } = await getJSONData(PRODUCTS_101_URL);
    cont.innerHTML = "";

    // 5) Render
    products.forEach((p) => {
      const art = document.createElement("article");
      art.className = "fila";

      // --- imagen ---
      const fig = document.createElement("figure");
      fig.className = "thumb";
      const img = document.createElement("img");
      img.alt = p.name;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";

      const jsonURL = fullAsset(p.image);
      img.src = jsonURL;

      let triedBackup = false;
      img.onerror = () => {
        if (!triedBackup && backupImages[p.name]) {
          triedBackup = true;
          img.src = backupImages[p.name];
          return;
        }
        img.src = `https://placehold.co/800x480?text=${encodeURIComponent(p.name)}`;
      };

      fig.appendChild(img);

      const content = document.createElement("div");
      const nombre = `<h2 class="nombre">${p.name}</h2>`;
      const box = `
        <div class="box">
          <span class="vendidos">${p.soldCount} unidades</span>
          <p class="desc">${p.description}</p>
          <span class="precio">USD ${p.cost}</span>
        </div>`;

      content.innerHTML = nombre + box;

      art.append(fig, content);
      cont.appendChild(art);
    });
  } catch (e) {
    cont.textContent = `Error cargando productos: ${e.message}`;
  }
});

