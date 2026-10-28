/* ===== Reserva en 4 pasos (Servicio → Profesional → Fecha y hora → Confirmación) =====
   Se monta en cualquier contenedor y trabaja con el usuario de la sesión. */
window.Booking = (() => {
  const D = window.SHADDAI || {};
  const items = (D.categorias || []).flatMap((c) => c.items || []);
  const STEPS = ["Servicio", "Profesional", "Fecha y hora", "Confirmación"];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const when = (f, h) => new Date(`${f}T${h}:00`).toLocaleString("es-CO", {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit"
  });
  const nameOf = (id) => items.find((i) => i.id === id)?.nombre ?? id;
  const phoneOk = (tel) => String(tel).replace(/\D/g, "").length >= 7;
  const fresh = () => ({ step: 0, servicio: null, barbero: null, fecha: null, hora: null, done: null });

  function mount({ root, list, user, onUpdate }) {
    if (!root || !user) return;
    let s = fresh();

    const days = () => Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      return d;
    });

    const slots = (f) => {
      const day = new Date(`${f}T00:00:00`).getDay();
      const h = D.horario ? D.horario[day] : null;
      if (!h) return [];
      const toM = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
      const out = [];
      for (let m = toM(h[0]); m + D.intervalo <= toM(h[1]); m += D.intervalo) {
        const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        if (new Date(`${f}T${t}:00`) > new Date()) out.push(t);
      }
      return out;
    };

    const taken = (f) => (window.Store ? window.Store.takenSlots(f) : []);
    const freeBarbers = (f, t) => (D.barberos || []).filter((b) => !taken(f).some((a) => a.hora === t && a.barbero === b));
    const open = (f, t) => (s.barbero === "any" ? freeBarbers(f, t).length > 0 : freeBarbers(f, t).includes(s.barbero));

    const opt = (k, v, label, sub = "", disabled = false) =>
      `<button type="button" class="opt" data-k="${k}" data-v="${esc(v)}" aria-pressed="${s[k] === v}" ${disabled ? "disabled" : ""}>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</button>`;

    const body = () => {
      if (s.done) {
        const c = s.done;
        const msg = `Hola, agendé en Shaddai Barber Spa: ${nameOf(c.servicio)}, ${when(c.fecha, c.hora)}, con ${c.barbero}. A nombre de ${c.nombre}.`;
        return `<div class="bk-done">
          <h3>Tu cita quedó agendada, ${esc(c.nombre)}.</h3>
          <p>${esc(nameOf(c.servicio))} · ${esc(when(c.fecha, c.hora))} · ${esc(c.barbero)}</p>
          <div class="actions">
            <a class="btn btn-red" target="_blank" rel="noopener" href="https://wa.me/${esc(D.contacto.whatsapp)}?text=${encodeURIComponent(msg)}">Avisar por WhatsApp</a>
            <button type="button" class="btn btn-ghost" data-act="again">Agendar otra</button>
          </div>
        </div>`;
      }
      if (s.step === 0) {
        return `<div class="opts">${items.map((i) => opt("servicio", i.id, i.nombre, `${i.min} min`)).join("") || "<p>No hay servicios configurados.</p>"}</div>`;
      }
      if (s.step === 1) {
        return `<div class="opts">${(D.barberos || []).map((b) => opt("barbero", b, b)).join("")}${opt("barbero", "any", "Cualquiera disponible", "El primero libre")}</div>`;
      }
      if (s.step === 2) {
        const dates = days().map((d) => {
          const f = iso(d);
          const closed = !slots(f).length;
          return `<button type="button" class="opt" data-k="fecha" data-v="${f}" aria-pressed="${s.fecha === f}" ${closed ? "disabled" : ""}>${esc(d.toLocaleDateString("es-CO", { weekday: "short" }))}<small>${d.getDate()}</small></button>`;
        }).join("");
        const hrs = s.fecha
          ? slots(s.fecha).map((t) => `<button type="button" class="opt" data-k="hora" data-v="${t}" aria-pressed="${s.hora === t}" ${open(s.fecha, t) ? "" : "disabled"}>${t}</button>`).join("")
          : "";
        return `<div class="dates">${dates}</div><div class="slots">${hrs}</div>`;
      }
      return `<p class="summary"><strong>${esc(nameOf(s.servicio))}</strong> · ${esc(when(s.fecha, s.hora))} · ${esc(s.barbero === "any" ? "Cualquiera disponible" : s.barbero)}</p>
        <div class="fields">
          <div class="field"><label for="c-nombre">Nombre</label><input id="c-nombre" autocomplete="name" value="${esc(user.nombre)}" required></div>
          <div class="field"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" autocomplete="tel" value="${esc(user.telefono || "")}" required></div>
        </div>
        <p class="err" role="alert" aria-live="polite"></p>`;
    };

    const ready = () => [s.servicio, s.barbero, s.fecha && s.hora][s.step];

    const render = () => {
      const head = s.done ? "" : `<ol class="stepper">${STEPS.map((n, i) => `<li class="${i === s.step ? "is-on" : i < s.step ? "is-done" : ""}">${n}</li>`).join("")}</ol>`;
      const nav = s.done ? "" : `<div class="bk-nav">
        ${s.step ? `<button type="button" class="btn btn-ghost btn-sm" data-act="back">Atrás</button>` : "<span></span>"}
        ${s.step < 3
          ? `<button type="button" class="btn btn-red btn-sm" data-act="next" ${ready() ? "" : "disabled"}>Siguiente</button>`
          : `<button type="button" class="btn btn-red btn-sm" data-act="confirm">Confirmar cita</button>`}
      </div>`;
      root.innerHTML = head + body() + nav;
    };

    const renderList = () => {
      if (!list) return;
      const now = new Date();
      const all = window.Store.appointmentsOf(user.id)
        .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
      const upcoming = all.filter((c) => new Date(`${c.fecha}T${c.hora}:00`) >= now);
      const past = all.filter((c) => !upcoming.includes(c)).reverse();
      if (!all.length) {
        list.innerHTML = `<p class="empty">Aún no tienes citas.<br>Elige un servicio para empezar.</p>`;
        return;
      }
      const row = (c, isPast) => `<div class="cita ${isPast ? "past" : ""}">
        <div><strong>${esc(nameOf(c.servicio))}</strong><span>${esc(when(c.fecha, c.hora))} · ${esc(c.barbero)}</span></div>
        ${isPast ? "" : `<button type="button" class="btn-cancel" data-cancel="${esc(c.id)}">Cancelar</button>`}
      </div>`;
      list.innerHTML = `${upcoming.length ? `<h3>Próximas</h3>${upcoming.map((c) => row(c, false)).join("")}` : "<p class=\"empty\">No tienes citas próximas.</p>"}
        ${past.length ? `<h3>Historial</h3>${past.map((c) => row(c, true)).join("")}` : ""}`;
    };

    root.addEventListener("click", (e) => {
      const o = e.target.closest("[data-k]");
      const a = e.target.closest("[data-act]");
      if (o) {
        s[o.dataset.k] = o.dataset.v;
        if (o.dataset.k === "fecha") s.hora = null;
        render();
        return;
      }
      if (!a) return;
      if (a.dataset.act === "next" && ready()) { s.step++; render(); }
      if (a.dataset.act === "back") { s.step--; render(); }
      if (a.dataset.act === "again") { s = fresh(); render(); }
      if (a.dataset.act === "confirm") {
        const nombre = root.querySelector("#c-nombre").value.trim();
        const tel = root.querySelector("#c-tel").value.trim();
        const err = root.querySelector(".err");
        if (!nombre || !phoneOk(tel)) { err.textContent = "Escribe tu nombre y un teléfono válido."; return; }
        const barbero = s.barbero === "any" ? freeBarbers(s.fecha, s.hora)[0] : s.barbero;
        if (!barbero) { err.textContent = "Ese horario se acaba de ocupar. Vuelve atrás y elige otro."; return; }
        const res = window.Store.createAppointment({ userId: user.id, servicio: s.servicio, barbero, fecha: s.fecha, hora: s.hora, nombre, tel });
        if (!res.ok) { err.textContent = res.error; return; }
        s = { ...fresh(), done: res.cita };
        render();
        renderList();
        if (onUpdate) onUpdate();
      }
    });

    if (list) {
      list.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cancel]");
        if (!b) return;
        window.Store.cancelAppointment(b.dataset.cancel, user.id);
        renderList();
        if (onUpdate) onUpdate();
      });
    }

    render();
    renderList();
  }

  return { mount };
})();
