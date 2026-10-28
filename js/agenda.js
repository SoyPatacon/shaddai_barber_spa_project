/* ===== Panel de citas del usuario ===== */
(() => {
  const Auth = window.Auth;
  const Store = window.Store;
  if (!Auth || !Store || !window.Booking) return;

  const user = Auth.requireUser("agenda.html");
  if (!user) return;

  const nameEl = document.getElementById("user-name");
  if (nameEl) nameEl.textContent = user.nombre.split(/\s+/)[0];

  const root = document.getElementById("reserva");
  const list = document.getElementById("citas");
  const count = document.getElementById("citas-count");
  const banner = document.getElementById("legacy-banner");

  const updateCount = () => {
    if (!count) return;
    const now = new Date();
    const n = Store.appointmentsOf(user.id)
      .filter((c) => new Date(`${c.fecha}T${c.hora}:00`) >= now).length;
    count.textContent = n ? `${n} próxima${n === 1 ? "" : "s"}` : "Sin citas próximas";
  };

  if (banner && Store.pendingLegacy() > 0) {
    banner.hidden = false;
    const btn = banner.querySelector("[data-import-legacy]");
    if (btn) {
      btn.addEventListener("click", () => {
        const n = Store.importLegacy(user.id);
        banner.hidden = true;
        if (n) location.reload();
      });
    }
  }

  window.Booking.mount({ root, list, user, onUpdate: updateCount });
  updateCount();
})();
