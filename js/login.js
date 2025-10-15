import { iniciarSesion, redirigirSiLogueado } from "./common.js";

document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay sesión, ir directo al inicio
  redirigirSiLogueado("index.html");

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("usuario").value.trim();
    const pass  = document.getElementById("password").value.trim();

    if (!email || !pass) {
      alert("Complete Email y Contraseña.");
      return;
    }

    // Inicia sesión con la función ya existente
    iniciarSesion(email);

    // Guardar el correo para que lo usen el navbar y los comentarios
    localStorage.setItem("email", email);

    // Redirigir al inicio
    location.href = "./index.html";
  });
});