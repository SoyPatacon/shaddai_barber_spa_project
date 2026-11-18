/* ===== Render de la landing ===== */

// IIFE que dibuja el contenido dinámico de la página de inicio.
(() => {
  // Toma la configuración global del sitio.
  const D = window.SHADDAI;
  // Si no existe la configuración, termina para evitar errores.
  if (!D) return;
  // Escapa caracteres especiales de HTML para insertar texto de forma segura.
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Texto que se muestra cuando un servicio no tiene precio definido.
  const none = "Por confirmar";

  /* ---- Menú de servicios ---- */
  // Busca el contenedor del catálogo de servicios.
  const catalogo = document.getElementById("catalogo");
  // Solo dibuja si el contenedor existe en esta página.
  if (catalogo) {
    /*
      Construye el HTML del catálogo. Línea por línea:
      - <article class="menu-card">: tarjeta que agrupa una categoría.
      - <h3>: nombre de la categoría.
      - c.items.map(...): recorre cada servicio de la categoría.
      - <div class="item">: bloque de un servicio.
      - <div class="item-row">: fila con nombre, línea punteada y precio.
      - <span class="item-name">: nombre del servicio.
      - <span class="leader">: línea decorativa que une nombre y precio (oculta a lectores de pantalla).
      - <span class="price">: precio formateado en pesos o "Por confirmar" si no hay precio.
      - <p>: descripción del servicio.
      - <small>: duración en minutos.
      - .join(""): une todas las piezas en un solo texto HTML.
    */
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
  // Cierra el bloque del catálogo.
  }

  /* ---- Galería de trabajos ---- */
  // Busca el contenedor de la galería de fotos.
  const galeria = document.getElementById("galeria");
  // Solo dibuja si el contenedor existe.
  if (galeria) {
    /*
      Construye las tarjetas de la galería. Línea por línea:
      - <figure class="work" data-reveal>: tarjeta animable al hacer scroll.
      - <img>: foto del trabajo con su ruta, texto alternativo, tamaño y carga diferida.
      - width/height: reservan el espacio para evitar saltos de diseño.
      - loading="lazy": la imagen se carga solo cuando se acerca a la pantalla.
      - decoding="async": el navegador puede decodificar la imagen sin bloquear.
      - <figcaption>: pie de foto con el servicio y el título.
    */
    galeria.innerHTML = (D.trabajos || []).map((t) => `
      <figure class="work" data-reveal>
        <img src="${esc(t.img)}" alt="${esc(t.alt || t.titulo)}" width="1200" height="1500" loading="lazy" decoding="async">
        <figcaption class="work-caption">
          <span>${esc(t.servicio)}</span>
          <h3>${esc(t.titulo)}</h3>
        </figcaption>
      </figure>`).join("");
  // Cierra el bloque de la galería.
  }

  /* ---- Contacto y mapa ---- */
  // Busca el contenedor de la información de contacto.
  const info = document.getElementById("contacto-info");
  // Solo dibuja si el contenedor existe.
  if (info) {
    // Toma el objeto de contacto de la configuración.
    const C = D.contacto;
    // Mapa que traduce el número de día (0-6) a su abreviatura en español.
    const hoy = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" };
    // Convierte el objeto de horario en un texto legible.
    const horario = Object.entries(D.horario)
      // Descarta los días cerrados (valor null).
      .filter(([, h]) => h)
      // Convierte cada día en "Lun 07:00–20:00" usando la abreviatura y las horas.
      .map(([d, h]) => `${hoy[d]} ${h[0]}–${h[1]}`)
      // Une todos los días con un separador visual.
      .join(" · ");
    /*
      Inserta la información de contacto. Línea por línea:
      - Primera línea: dirección (o "Por confirmar" si está vacía).
      - Segunda línea: horario semanal ya formateado.
      - Tercera línea: enlace a WhatsApp y, si hay correo, enlace mailto con el correo.
    */
    info.innerHTML = `
      <div><b>Dirección</b>${esc(C.direccion || none)}</div>
      <div><b>Horario</b>${esc(horario)}</div>
      <div><b>Escríbenos</b><a href="https://wa.me/${esc(C.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>${C.correo ? ` · <a href="mailto:${esc(C.correo)}">${esc(C.correo)}</a>` : ""}</div>`;
  // Cierra el bloque de contacto.
  }

  // Busca el contenedor del mapa.
  const mapa = document.getElementById("mapa");
  // Solo dibuja si el contenedor existe.
  if (mapa) {
    // Toma el objeto de contacto de la configuración.
    const C = D.contacto;
    // Prioriza la ficha exacta del lugar; si no existe, cae a una búsqueda por dirección.
    // Elige la URL del mapa: primero la ficha exacta; si no, una búsqueda por texto; si no, cadena vacía.
    const src = C.mapaEmbed || (C.mapa ? `https://www.google.com/maps?q=${encodeURIComponent(C.mapa)}&output=embed` : "");
    // Si hay URL, inserta el iframe; si no, muestra un aviso para configurar la dirección.
    mapa.innerHTML = src
      // Iframe del mapa con título accesible, carga diferida, pantalla completa y política de referencia segura.
      ? `<iframe title="Ubicación de Shaddai Barber Spa en Google Maps" src="${esc(src)}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      // Mensaje que indica dónde agregar la dirección cuando no hay mapa configurado.
      : `<p>El mapa aparece cuando agregues la dirección en <code>js/data.js</code>.</p>`;
  // Cierra el bloque del mapa.
  }
// Cierra la IIFE.
})();
