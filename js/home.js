/* ===== Render de la landing ===== */
(() => {
  const D = window.SHADDAI;
  if (!D) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const none = "Por confirmar";

  /* ---- Menú de servicios ---- */
  const catalogo = document.getElementById("catalogo");
  if (catalogo) {
    catalogo.innerHTML = D.categorias.map((c) => `
      <article class="menu-card">
        <h3>${esc(c.nombre)}</h3>
        ${c.items.map((i) => `<div class="item">
          <div class="item-row">
            <span class="item-name">${esc(i.nombre)}</span>
            <span class="leader" aria-hidden="true"></span>
            <span class="price">${i.precio ? "$" + i.precio.toLocaleString("es-CO") : "Por confirmar"}</span>
          </div>
          <p>${esc(i.desc)}</p>
          <small>${i.min} min</small>
        </div>`).join("")}
      </article>`).join("");
  }

  /* ---- Galería de trabajos ---- */
  const galeria = document.getElementById("galeria");
  if (galeria) {
    galeria.innerHTML = (D.trabajos || []).map((t) => `
      <figure class="work" data-reveal>
        <img src="${esc(t.img)}" alt="${esc(t.alt || t.titulo)}" width="1200" height="1500" loading="lazy" decoding="async">
        <figcaption class="work-caption">
          <span>${esc(t.servicio)}</span>
          <h3>${esc(t.titulo)}</h3>
        </figcaption>
      </figure>`).join("");
  }

  /* ---- Contacto y mapa ---- */
  const info = document.getElementById("contacto-info");
  if (info) {
    const C = D.contacto;
    const hoy = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" };
    const horario = Object.entries(D.horario)
      .filter(([, h]) => h)
      .map(([d, h]) => `${hoy[d]} ${h[0]}–${h[1]}`)
      .join(" · ");
    info.innerHTML = `
      <div><b>Dirección</b>${esc(C.direccion || none)}</div>
      <div><b>Horario</b>${esc(horario)}</div>
      <div><b>Escríbenos</b><a href="https://wa.me/${esc(C.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>${C.correo ? ` · <a href="mailto:${esc(C.correo)}">${esc(C.correo)}</a>` : ""}</div>`;
  }

  const mapa = document.getElementById("mapa");
  if (mapa) {
    const C = D.contacto;
    mapa.innerHTML = C.mapa
      ? `<iframe title="Mapa de Shaddai Barber Spa" loading="lazy" src="https://www.google.com/maps?q=${encodeURIComponent(C.mapa)}&output=embed"></iframe>`
      : `<p>El mapa aparece cuando agregues la dirección en <code>js/data.js</code>.</p>`;
  }
})();
