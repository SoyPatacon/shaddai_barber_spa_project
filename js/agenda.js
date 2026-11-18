/* ===== Panel de citas del usuario ===== */

// IIFE que inicializa la página de la agenda del usuario.
(() => {
  // Toma el objeto Auth para comprobar la sesión.
  const Auth = window.Auth;
  // Toma el objeto Store para leer y modificar citas.
  const Store = window.Store;
  // Si falta alguna pieza necesaria (Auth, Store o Booking), termina para evitar errores.
  if (!Auth || !Store || !window.Booking) return;

  // Exige un usuario con sesión; si no lo hay, redirige al login y devuelve null.
  const user = Auth.requireUser("agenda.html");
  // Si no hay usuario, detiene la ejecución de la página.
  if (!user) return;

  // Busca el elemento donde se muestra el nombre del usuario.
  const nameEl = document.getElementById("user-name");
  // Si existe, escribe solo el primer nombre (separando por espacios).
  if (nameEl) nameEl.textContent = user.nombre.split(/\s+/)[0];

  // Busca el contenedor donde se monta el asistente de reserva.
  const root = document.getElementById("reserva");
  // Busca el contenedor donde se lista las citas.
  const list = document.getElementById("citas");
  // Busca el elemento que muestra el contador de citas próximas.
  const count = document.getElementById("citas-count");
  // Busca el aviso para importar citas de la versión anterior.
  const banner = document.getElementById("legacy-banner");

  // Actualiza el texto del contador con el número de citas próximas.
  const updateCount = () => {
    // Si no existe el contador en la página, no hace nada.
    if (!count) return;
    // Guarda el momento actual para comparar con las citas.
    const now = new Date();
    // Cuenta las citas del usuario cuya fecha y hora son iguales o posteriores a ahora.
    const n = Store.appointmentsOf(user.id)
      // Filtra las citas futuras comparando la fecha/hora con el momento actual.
      .filter((c) => new Date(`${c.fecha}T${c.hora}:00`) >= now).length;
    // Muestra "N próxima(s)" o "Sin citas próximas" según el número.
    count.textContent = n ? `${n} próxima${n === 1 ? "" : "s"}` : "Sin citas próximas";
  // Cierra la función updateCount.
  };

  // Si existe el aviso y hay citas antiguas pendientes de importar...
  if (banner && Store.pendingLegacy() > 0) {
    // Muestra el aviso quitando el atributo hidden.
    banner.hidden = false;
    // Busca el botón de importar dentro del aviso.
    const btn = banner.querySelector("[data-import-legacy]");
    // Si el botón existe, le añade el comportamiento.
    if (btn) {
      // Al hacer clic, importa las citas antiguas al usuario actual.
      btn.addEventListener("click", () => {
        // Importa las citas y guarda cuántas se importaron.
        const n = Store.importLegacy(user.id);
        // Oculta el aviso después de importar.
        banner.hidden = true;
        // Si se importó al menos una cita, recarga la página para mostrarlas.
        if (n) location.reload();
      // Cierra el listener del botón de importar.
      });
    // Cierra la comprobación del botón.
    }
  // Cierra la comprobación del aviso.
  }

  // Monta el asistente de reserva y la lista de citas, pasando el callback para actualizar el contador.
  window.Booking.mount({ root, list, user, onUpdate: updateCount });
  // Ejecuta el contador una vez al cargar la página.
  updateCount();
// Cierra la IIFE.
})();
