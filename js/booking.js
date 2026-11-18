/* ===== Reserva en 4 pasos (Servicio → Profesional → Fecha y hora → Confirmación) =====
   Se monta en cualquier contenedor y trabaja con el usuario de la sesión. */

// Crea en `window` un objeto `Booking` mediante una IIFE; solo se expone la función mount.
window.Booking = (() => {
  // Toma la configuración del sitio (servicios, barberos, horario, contacto).
  const D = window.SHADDAI || {};
  // Aplana todas las categorías en una sola lista de servicios para buscarlos fácilmente por id.
  const items = (D.categorias || []).flatMap((c) => c.items || []);
  // Nombres de los cuatro pasos que se muestran en la barra de progreso.
  const STEPS = ["Servicio", "Profesional", "Fecha y hora", "Confirmación"];

  // Escapa caracteres especiales de HTML para insertar texto de forma segura.
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Asegura que un número tenga dos dígitos (por ejemplo, 7 → "07").
  const pad = (n) => String(n).padStart(2, "0");
  // Convierte una fecha JavaScript en texto ISO local "AAAA-MM-DD" (sin zona horaria).
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  // Convierte fecha y hora en un texto largo en español, por ejemplo "lunes, 3 de junio, 9:00".
  const when = (f, h) => new Date(`${f}T${h}:00`).toLocaleString("es-CO", {
    // Opciones de formato: día de la semana, día, mes, hora y minutos.
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit"
  // Cierra el objeto de opciones de formato.
  });
  // Devuelve el nombre del servicio a partir de su id; si no lo encuentra, devuelve el id.
  const nameOf = (id) => items.find((i) => i.id === id)?.nombre ?? id;
  // Valida un teléfono comprobando que tenga al menos 7 dígitos (ignora espacios, guiones, etc.).
  const phoneOk = (tel) => String(tel).replace(/\D/g, "").length >= 7;
  // Devuelve un estado inicial limpio para el asistente de reserva.
  const fresh = () => ({ step: 0, servicio: null, barbero: null, fecha: null, hora: null, done: null });

  // Monta el asistente de reserva dentro de un contenedor y, opcionalmente, una lista de citas.
  function mount({ root, list, user, onUpdate }) {
    // Si falta el contenedor o el usuario, no se puede montar nada.
    if (!root || !user) return;
    // Estado local de la reserva (paso actual y valores elegidos); `let` permite reemplazarlo.
    let s = fresh();

    // Genera los próximos 14 días como objetos Date a partir de hoy.
    const days = () => Array.from({ length: 14 }, (_, i) => {
      // Crea una fecha con la fecha y hora actuales.
      const d = new Date();
      // Pone la hora a medianoche para comparar solo por día.
      d.setHours(0, 0, 0, 0);
      // Suma `i` días a la fecha de hoy.
      d.setDate(d.getDate() + i);
      // Devuelve la fecha resultante.
      return d;
    // Cierra la función que genera cada día.
    });

    // Calcula las horas disponibles para una fecha concreta.
    const slots = (f) => {
      // Obtiene el día de la semana (0 domingo … 6 sábado) de la fecha indicada.
      const day = new Date(`${f}T00:00:00`).getDay();
      // Busca el horario de ese día; null significa cerrado.
      const h = D.horario ? D.horario[day] : null;
      // Si el día está cerrado, no hay horarios disponibles.
      if (!h) return [];
      // Convierte "HH:MM" en minutos totales desde medianoche.
      const toM = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
      // Arreglo donde se acumulan las horas disponibles.
      const out = [];
      // Recorre desde la apertura hasta que quede tiempo para un turno completo, avanzando por el intervalo.
      for (let m = toM(h[0]); m + D.intervalo <= toM(h[1]); m += D.intervalo) {
        // Convierte los minutos actuales a formato "HH:MM" con dos dígitos.
        const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        // Solo agrega la hora si es posterior al momento actual (no permite reservar en el pasado).
        if (new Date(`${f}T${t}:00`) > new Date()) out.push(t);
      // Cierra el bucle de horarios.
      }
      // Devuelve la lista de horas disponibles.
      return out;
    // Cierra la función slots.
    };

    // Devuelve las citas ocupadas de una fecha usando Store; si Store no existe, devuelve una lista vacía.
    const taken = (f) => (window.Store ? window.Store.takenSlots(f) : []);
    // Devuelve los barberos que no tienen una cita a esa fecha y hora.
    const freeBarbers = (f, t) => (D.barberos || []).filter((b) => !taken(f).some((a) => a.hora === t && a.barbero === b));
    // Indica si se puede reservar a esa fecha y hora: si se eligió "cualquiera", basta con que haya un barbero libre; si no, el elegido debe estar libre.
    const open = (f, t) => (s.barbero === "any" ? freeBarbers(f, t).length > 0 : freeBarbers(f, t).includes(s.barbero));

    // Construye el HTML de un botón de opción (servicio, barbero, fecha u hora).
    const opt = (k, v, label, sub = "", disabled = false) =>
      // Botón con la clave, el valor, el estado seleccionado (aria-pressed) y el atributo disabled si corresponde.
      `<button type="button" class="opt" data-k="${k}" data-v="${esc(v)}" aria-pressed="${s[k] === v}" ${disabled ? "disabled" : ""}>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</button>`;

    // Genera el contenido HTML del paso actual (o la pantalla final de confirmación).
    const body = () => {
      // Si la reserva ya terminó, muestra el resumen de la cita creada.
      if (s.done) {
        // Guarda la cita confirmada en una variable corta.
        const c = s.done;
        // Prepara el mensaje de WhatsApp con servicio, fecha, hora, barbero y nombre.
        const msg = `Hola, agendé en Shaddai Barber Spa: ${nameOf(c.servicio)}, ${when(c.fecha, c.hora)}, con ${c.barbero}. A nombre de ${c.nombre}.`;
        /*
          HTML de la pantalla final. Línea por línea:
          - <div class="bk-done">: contenedor del mensaje de éxito.
          - <h3>: saludo con el nombre del cliente.
          - <p>: resumen del servicio, fecha/hora y barbero.
          - <div class="actions">: fila de botones.
          - <a class="btn btn-red">: enlace a WhatsApp con el mensaje codificado.
          - <button data-act="again">: vuelve a empezar una reserva nueva.
        */
        return `<div class="bk-done">
          <h3>Tu cita quedó agendada, ${esc(c.nombre)}.</h3>
          <p>${esc(nameOf(c.servicio))} · ${esc(when(c.fecha, c.hora))} · ${esc(c.barbero)}</p>
          <div class="actions">
            <a class="btn btn-red" target="_blank" rel="noopener" href="https://wa.me/${esc(D.contacto.whatsapp)}?text=${encodeURIComponent(msg)}">Avisar por WhatsApp</a>
            <button type="button" class="btn btn-ghost" data-act="again">Agendar otra</button>
          </div>
        </div>`;
      // Cierra el caso de reserva terminada.
      }
      // Paso 0: elegir servicio.
      if (s.step === 0) {
        // Genera un botón por cada servicio, mostrando su nombre y duración; si no hay servicios, muestra un aviso.
        return `<div class="opts">${items.map((i) => opt("servicio", i.id, i.nombre, `${i.min} min`)).join("") || "<p>No hay servicios configurados.</p>"}</div>`;
      // Cierra el paso 0.
      }
      // Paso 1: elegir profesional.
      if (s.step === 1) {
        // Genera un botón por barbero y añade la opción "Cualquiera disponible".
        return `<div class="opts">${(D.barberos || []).map((b) => opt("barbero", b, b)).join("")}${opt("barbero", "any", "Cualquiera disponible", "El primero libre")}</div>`;
      // Cierra el paso 1.
      }
      // Paso 2: elegir fecha y hora.
      if (s.step === 2) {
        // Genera un botón por cada uno de los próximos 14 días.
        const dates = days().map((d) => {
          // Convierte la fecha en texto "AAAA-MM-DD".
          const f = iso(d);
          // Marca el día como cerrado si no tiene ningún horario disponible.
          const closed = !slots(f).length;
          // Botón del día con la abreviatura del día de la semana y el número del día; se desactiva si está cerrado.
          return `<button type="button" class="opt" data-k="fecha" data-v="${f}" aria-pressed="${s.fecha === f}" ${closed ? "disabled" : ""}>${esc(d.toLocaleDateString("es-CO", { weekday: "short" }))}<small>${d.getDate()}</small></button>`;
        // Une todos los botones de días en un solo texto.
        }).join("");
        // Genera los botones de horas solo si ya se eligió una fecha.
        const hrs = s.fecha
          // Por cada hora disponible, crea un botón desactivado si no hay barbero libre a esa hora.
          ? slots(s.fecha).map((t) => `<button type="button" class="opt" data-k="hora" data-v="${t}" aria-pressed="${s.hora === t}" ${open(s.fecha, t) ? "" : "disabled"}>${t}</button>`).join("")
          // Si no hay fecha elegida, no muestra horas.
          : "";
        // Devuelve el bloque de días seguido del bloque de horas.
        return `<div class="dates">${dates}</div><div class="slots">${hrs}</div>`;
      // Cierra el paso 2.
      }
      /*
        Paso 3 (por descarte): confirmación de datos. Línea por línea:
        - <p class="summary">: resumen de servicio, fecha/hora y barbero.
        - <div class="fields">: contenedor de los campos del formulario.
        - <input id="c-nombre">: nombre del cliente, precargado con el de su cuenta.
        - <input id="c-tel">: teléfono, precargado si existe en la cuenta.
        - <p class="err">: párrafo donde se muestran los errores de validación.
      */
      return `<p class="summary"><strong>${esc(nameOf(s.servicio))}</strong> · ${esc(when(s.fecha, s.hora))} · ${esc(s.barbero === "any" ? "Cualquiera disponible" : s.barbero)}</p>
        <div class="fields">
          <div class="field"><label for="c-nombre">Nombre</label><input id="c-nombre" autocomplete="name" value="${esc(user.nombre)}" required></div>
          <div class="field"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" autocomplete="tel" value="${esc(user.telefono || "")}" required></div>
        </div>
        <p class="err" role="alert" aria-live="polite"></p>`;
    // Cierra la función body.
    };

    // Indica si el paso actual ya tiene los datos necesarios para avanzar.
    const ready = () => [s.servicio, s.barbero, s.fecha && s.hora][s.step];

    // Dibuja el asistente completo (barra de pasos, contenido y botones de navegación).
    const render = () => {
      // Genera la barra de pasos; si la reserva terminó, no se muestra.
      const head = s.done ? "" : `<ol class="stepper">${STEPS.map((n, i) => `<li class="${i === s.step ? "is-on" : i < s.step ? "is-done" : ""}">${n}</li>`).join("")}</ol>`;
      /*
        Genera los botones de navegación. Línea por línea:
        - <div class="bk-nav">: contenedor de los botones.
        - Botón "Atrás": solo aparece si no estamos en el primer paso; si lo estamos, deja un hueco vacío.
        - Si no es el último paso: botón "Siguiente", desactivado si faltan datos.
        - Si es el último paso: botón "Confirmar cita".
      */
      const nav = s.done ? "" : `<div class="bk-nav">
        ${s.step ? `<button type="button" class="btn btn-ghost btn-sm" data-act="back">Atrás</button>` : "<span></span>"}
        ${s.step < 3
          ? `<button type="button" class="btn btn-red btn-sm" data-act="next" ${ready() ? "" : "disabled"}>Siguiente</button>`
          : `<button type="button" class="btn btn-red btn-sm" data-act="confirm">Confirmar cita</button>`}
      </div>`;
      // Inserta la barra de pasos, el contenido del paso y la navegación dentro del contenedor.
      root.innerHTML = head + body() + nav;
    // Cierra la función render.
    };

    // Dibuja la lista de citas del usuario separada en próximas e historial.
    const renderList = () => {
      // Si no se pasó un contenedor de lista, no hace nada.
      if (!list) return;
      // Guarda el momento actual para comparar con las citas.
      const now = new Date();
      // Obtiene las citas del usuario y las ordena por fecha y hora ascendente.
      const all = window.Store.appointmentsOf(user.id)
        // Compara las cadenas "fecha+hora" para ordenar cronológicamente.
        .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
      // Filtra las citas cuya fecha y hora son iguales o posteriores al momento actual.
      const upcoming = all.filter((c) => new Date(`${c.fecha}T${c.hora}:00`) >= now);
      // Las demás son pasadas; se invierten para mostrar primero la más reciente.
      const past = all.filter((c) => !upcoming.includes(c)).reverse();
      // Si no hay citas, muestra un mensaje vacío y termina.
      if (!all.length) {
        // Inserta el mensaje de lista vacía.
        list.innerHTML = `<p class="empty">Aún no tienes citas.<br>Elige un servicio para empezar.</p>`;
        // Sale de la función.
        return;
      // Cierra el caso sin citas.
      }
      /*
        Construye una fila de cita. Línea por línea:
        - <div class="cita">: fila de la cita (con clase "past" si ya pasó).
        - <strong>: nombre del servicio.
        - <span>: fecha/hora y barbero.
        - <button data-cancel>: botón para cancelar, solo si la cita es futura.
      */
      const row = (c, isPast) => `<div class="cita ${isPast ? "past" : ""}">
        <div><strong>${esc(nameOf(c.servicio))}</strong><span>${esc(when(c.fecha, c.hora))} · ${esc(c.barbero)}</span></div>
        ${isPast ? "" : `<button type="button" class="btn-cancel" data-cancel="${esc(c.id)}">Cancelar</button>`}
      </div>`;
      // Inserta el bloque de próximas citas y, si hay, el historial.
      list.innerHTML = `${upcoming.length ? `<h3>Próximas</h3>${upcoming.map((c) => row(c, false)).join("")}` : "<p class=\"empty\">No tienes citas próximas.</p>"}
        ${past.length ? `<h3>Historial</h3>${past.map((c) => row(c, true)).join("")}` : ""}`;
    // Cierra la función renderList.
    };

    // Escucha los clics dentro del asistente para elegir opciones o navegar entre pasos.
    root.addEventListener("click", (e) => {
      // Busca el botón de opción más cercano al elemento clicado.
      const o = e.target.closest("[data-k]");
      // Busca el botón de acción (siguiente, atrás, confirmar, etc.) más cercano.
      const a = e.target.closest("[data-act]");
      // Si se hizo clic en una opción...
      if (o) {
        // Guarda el valor elegido en el estado usando la clave del botón (servicio, barbero, fecha u hora).
        s[o.dataset.k] = o.dataset.v;
        // Si se cambió la fecha, borra la hora anterior para obligar a elegir una nueva.
        if (o.dataset.k === "fecha") s.hora = null;
        // Vuelve a dibujar el asistente con la selección actualizada.
        render();
        // Sale del listener.
        return;
      // Cierra el manejo de opciones.
      }
      // Si no se hizo clic en una acción, no hace nada.
      if (!a) return;
      // Si es "Siguiente" y el paso está completo, avanza un paso y redibuja.
      if (a.dataset.act === "next" && ready()) { s.step++; render(); }
      // Si es "Atrás", retrocede un paso y redibuja.
      if (a.dataset.act === "back") { s.step--; render(); }
      // Si es "Agendar otra", reinicia el estado y redibuja.
      if (a.dataset.act === "again") { s = fresh(); render(); }
      // Si es "Confirmar", valida los datos y crea la cita.
      if (a.dataset.act === "confirm") {
        // Lee el nombre escrito y quita espacios de los extremos.
        const nombre = root.querySelector("#c-nombre").value.trim();
        // Lee el teléfono escrito y quita espacios de los extremos.
        const tel = root.querySelector("#c-tel").value.trim();
        // Busca el párrafo donde se muestran los errores.
        const err = root.querySelector(".err");
        // Si falta el nombre o el teléfono no es válido, muestra un error y no continúa.
        if (!nombre || !phoneOk(tel)) { err.textContent = "Escribe tu nombre y un teléfono válido."; return; }
        // Si el usuario eligió "cualquiera", toma el primer barbero libre; si no, usa el elegido.
        const barbero = s.barbero === "any" ? freeBarbers(s.fecha, s.hora)[0] : s.barbero;
        // Si ya no hay barbero disponible, avisa que el horario se ocupó.
        if (!barbero) { err.textContent = "Ese horario se acaba de ocupar. Vuelve atrás y elige otro."; return; }
        // Pide a Store que cree la cita con todos los datos elegidos.
        const res = window.Store.createAppointment({ userId: user.id, servicio: s.servicio, barbero, fecha: s.fecha, hora: s.hora, nombre, tel });
        // Si Store devuelve error, lo muestra en pantalla y no continúa.
        if (!res.ok) { err.textContent = res.error; return; }
        // Reinicia el estado y guarda la cita confirmada para mostrar la pantalla final.
        s = { ...fresh(), done: res.cita };
        // Redibuja el asistente en modo "cita confirmada".
        render();
        // Actualiza la lista de citas para incluir la nueva.
        renderList();
        // Si se pasó un callback, avisa que hubo cambios (por ejemplo, para actualizar el contador).
        if (onUpdate) onUpdate();
      // Cierra el manejo de confirmación.
      }
    // Cierra el listener de clics del asistente.
    });

    // Solo enlaza el listener de cancelación si existe la lista de citas.
    if (list) {
      // Escucha clics dentro de la lista de citas.
      list.addEventListener("click", (e) => {
        // Busca el botón de cancelar más cercano al elemento clicado.
        const b = e.target.closest("[data-cancel]");
        // Si no se hizo clic en un botón de cancelar, no hace nada.
        if (!b) return;
        // Cancela la cita por su id, comprobando que pertenezca al usuario actual.
        window.Store.cancelAppointment(b.dataset.cancel, user.id);
        // Redibuja la lista para reflejar la cancelación.
        renderList();
        // Avisa del cambio mediante el callback si existe.
        if (onUpdate) onUpdate();
      // Cierra el listener de la lista.
      });
    // Cierra la comprobación de la lista.
    }

    // Dibuja el asistente por primera vez.
    render();
    // Dibuja la lista de citas por primera vez.
    renderList();
  // Cierra la función mount.
  }

  // Expone únicamente la función mount para que agenda.js pueda montar el asistente.
  return { mount };
// Cierra la IIFE y la asignación a window.Booking.
})();
