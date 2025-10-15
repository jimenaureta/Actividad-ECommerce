/* my-profile.js - perfil con persistencia + preview robusto */
(function () {
  const K_PROFILE = "perfil";
  const K_PROFILE_PHOTO = "perfil_foto"; // Base64 DataURL
  const $ = (s) => document.querySelector(s);

  // Utils
  const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  const loadProfile = () => parse(localStorage.getItem(K_PROFILE)) || null;
  const saveProfile = (d) => localStorage.setItem(K_PROFILE, JSON.stringify(d));
  const loadPhoto = () => localStorage.getItem(K_PROFILE_PHOTO) || "";
  const savePhoto = (b64) => { try { localStorage.setItem(K_PROFILE_PHOTO, b64); } catch { alert("La imagen es muy grande para guardar."); } };
  const clearPhoto = () => localStorage.removeItem(K_PROFILE_PHOTO);

  async function fileToBase64(file){
    // Opcional: limitar tamaño (p.ej. 2MB)
    const MAX = 2 * 1024 * 1024;
    if (file.size > MAX){
      if (!confirm("La imagen supera 2MB. ¿Guardar de todos modos?")) throw new Error("too_big");
    }
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result || ""));
      fr.onerror = () => rej(fr.error || new Error("read_error"));
      fr.readAsDataURL(file);
    });
  }

  function fillForm(d){
    $("#firstName")      && ($("#firstName").value      = d.firstName ?? "");
    $("#secondName")     && ($("#secondName").value     = d.secondName ?? "");
    $("#surname")        && ($("#surname").value        = d.surname ?? "");
    $("#secondSurname")  && ($("#secondSurname").value  = d.secondSurname ?? "");
    $("#email")          && ($("#email").value          = d.email ?? $("#email").value);
    $("#phone")          && ($("#phone").value          = d.phone ?? "");
    $("#street")         && ($("#street").value         = d.street ?? "");
    $("#number")         && ($("#number").value         = d.number ?? "");
    $("#corner")         && ($("#corner").value         = d.corner ?? "");
  }

  function readForm(){
    const v = (id) => (($("#"+id)?.value) || "").trim();
    return {
      firstName: v("firstName"),
      secondName: v("secondName"),
      surname: v("surname"),
      secondSurname: v("secondSurname"),
      email: v("email"),
      phone: v("phone"),
      street: v("street"),
      number: v("number"),
      corner: v("corner"),
    };
  }

  function validateRequired(){
    let ok = true;
    ["firstName","surname","email"].forEach((id)=>{
      const el = $("#"+id);
      const val = (el?.value || "").trim();
      if (!val){ ok=false; el?.classList.add("is-invalid"); }
      else { el?.classList.remove("is-invalid"); }
    });
    return ok;
  }

  function showPreview(src){
    const img = $("#avatarPreview");
    if (!img) return;
    if (src){
      img.src = src;
      img.classList.remove("d-none");
    } else {
      img.removeAttribute("src");
      img.classList.add("d-none");
    }
  }

  function preloadEmailIfFirstTime(){
    const current = loadProfile();
    if (current?.email) return;
    const emailLS = localStorage.getItem("email") || "";
    const emailEl = $("#email");
    if (emailEl && !emailEl.value && emailLS) {
      emailEl.value = emailLS;
    }
  }

  function init(){
    // Cargar datos del perfil
    const stored = loadProfile();
    if (stored) fillForm(stored); else preloadEmailIfFirstTime();

    // Cargar foto guardada (si hay)
    const storedPhoto = loadPhoto();
    if (storedPhoto) showPreview(storedPhoto); else showPreview("");

    // Manejar cambio de archivo
    const file = $("#avatar");
    if (file){
      file.addEventListener("change", async (e)=>{
        const f = e.target.files?.[0];
        if (!f) return;
        try{
          // Preview inmediato con URL temporal (snappy)
          const tmpURL = URL.createObjectURL(f);
          showPreview(tmpURL);

          // Convertir a base64 y persistir (luego reemplazamos el src por el base64)
          const b64 = await fileToBase64(f);
          savePhoto(b64);
          showPreview(b64);

          // liberar el objeto temporal
          URL.revokeObjectURL(tmpURL);
        }catch(err){
          console.error(err);
          alert("No se pudo cargar la imagen.");
          showPreview("");
        }
      });
    }

    // Quitar foto
    const btnClear = $("#btnClearPhoto");
    if (btnClear){
      btnClear.addEventListener("click", ()=>{
        clearPhoto();
        if (file) file.value = "";
        showPreview("");
      });
    }

    // Guardar perfil
    const form = $("#profileForm");
    const ok = $("#saveOk");
    if (form){
      form.addEventListener("submit",(e)=>{
        e.preventDefault();
        if (!validateRequired()) return;
        saveProfile(readForm());
        if (ok){ ok.classList.remove("d-none"); setTimeout(()=>ok.classList.add("d-none"), 1600); }
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();