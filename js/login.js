// login.js
import { iniciarSesion, redirigirSiLogueado } from "./common.js";

const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {

  // Si ya hay sesión iniciada → redirigir al index
  redirigirSiLogueado("index.html");

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", login);
});

// ---------------------- LOGIN COMPLETO ----------------------
async function login(event) {
  event.preventDefault();

  // ⚠ Usa tus IDs reales del HTML
  const email = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Complete Email y Contraseña.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Credenciales inválidas");
      return;
    }

    // Guardar token para el backend
    localStorage.setItem("token", data.token);

    // Guardar sesión del e-commerce (navbar, comentarios, etc.)
    iniciarSesion(email);

    // Guardar email para otros usos
    localStorage.setItem("email", email);

    // Redirigir
    location.href = "index.html";

  } catch (error) {
    console.error(error);
    alert("No se pudo conectar con el servidor");
  }
}