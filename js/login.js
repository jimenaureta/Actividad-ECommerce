// js/login.js
import { iniciarSesion, sesionActiva } from "./common.js";

document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay sesión activa, ir directo al inicio
  if (sesionActiva()) {
    location.href = "./index.html";
    return;
  }

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("usuario").value.trim();
    const pass  = document.getElementById("password").value.trim();
    if (!email || !pass) { alert("Complete Email y Contraseña."); return; }
    iniciarSesion(email);
    location.href = "./index.html";
  });
});