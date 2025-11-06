(function () {
  const THEME_KEY = "theme";
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const saved = localStorage.getItem(THEME_KEY);
  const initial = saved || (prefersDark ? "dark" : "light");

  function apply(mode) {
    const next = mode === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.innerText = next === "dark" ? "☀️ Claro" : "🌙 Oscuro";

    /* Cambiar imagen del hero según tema */
    const hero = document.querySelector(".jumbotron");
    if (hero) {
      hero.style.backgroundImage =
        next === "dark"
          ? "url('../img/cover_back_black.png')"
          : "url('../img/cover_back.png')";
      hero.style.backgroundPosition = "center";
      hero.style.backgroundSize = "cover";
      hero.style.backgroundRepeat = "no-repeat";
    }
  }

  apply(initial);

  window.getTheme = () => document.documentElement.getAttribute("data-theme") || "light";
  window.setTheme = (mode) => apply(mode);

  function wireToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = window.getTheme() === "dark" ? "light" : "dark";
      window.setTheme(next);
    });
    btn.innerText = window.getTheme() === "dark" ? "☀️ Claro" : "🌙 Oscuro";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireToggle);
  } else {
    wireToggle();
  }
})();

const body = document.body;
function updateBodyTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  body.classList.toggle("dark-mode", isDark);
}
updateBodyTheme();
window.addEventListener("storage", updateBodyTheme);
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "themeToggle") setTimeout(updateBodyTheme, 50);
});