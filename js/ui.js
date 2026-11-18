/* ===== Interfaz compartida: header, sesión visible y animaciones ===== */

// IIFE: ejecuta el código de inmediato y mantiene sus variables fuera del alcance global.
(() => {
  // Añade la clase "js" al elemento <html> para que el CSS sepa que JavaScript está activo.
  document.documentElement.classList.add("js");
  // Escapa caracteres peligrosos de HTML (& < > " ') para insertar texto del usuario sin romper el marcado.
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Detecta si el usuario pidió reducir las animaciones en su sistema operativo.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Header con fondo al hacer scroll ---- */
  // Busca el encabezado de la página usando el atributo data-header.
  const header = document.querySelector("[data-header]");
  // Busca el elemento "centinela" que sirve para detectar cuándo se hizo scroll.
  const sentinel = document.querySelector("[data-sentinel]");
  // Solo activa la función si existen ambos elementos y el navegador soporta IntersectionObserver.
  if (header && sentinel && "IntersectionObserver" in window) {
    // Crea un observador que recibe las entradas cuando el centinela entra o sale de la pantalla.
    new IntersectionObserver(([entry]) => {
      // Si el centinela ya no es visible, añade la clase "is-scrolled"; si vuelve a serlo, la quita.
      header.classList.toggle("is-scrolled", !entry.isIntersecting);
    // Empieza a observar el centinela.
    }).observe(sentinel);
  // Cierra la comprobación del header.
  }

  /* ---- Menú móvil ---- */
  // Obtiene el elemento de navegación por su id.
  const nav = document.getElementById("nav");
  // Obtiene el botón que abre y cierra el menú móvil.
  const toggle = document.querySelector(".nav-toggle");
  // Función que abre o cierra el menú según el valor booleano `open`.
  const setMenu = (open) => {
    // Si falta el menú o el botón, no hace nada.
    if (!nav || !toggle) return;
    // Añade o quita la clase "is-open" al menú para mostrarlo u ocultarlo.
    nav.classList.toggle("is-open", open);
    // Actualiza el atributo ARIA que indica a los lectores de pantalla si el menú está abierto.
    toggle.setAttribute("aria-expanded", String(open));
    // Cambia la etiqueta accesible del botón según el estado del menú.
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    // Bloquea o desbloquea el scroll del cuerpo mientras el menú está abierto.
    document.body.classList.toggle("menu-open", open);
  // Cierra la función setMenu.
  };
  // Solo enlaza los eventos si existen el menú y el botón.
  if (nav && toggle) {
    // Al hacer clic en el botón, alterna el menú según su estado actual.
    toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    // Al hacer clic dentro del menú en un enlace, lo cierra.
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    // Al presionar la tecla Escape, cierra el menú.
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    // Al cambiar el tamaño de la ventana a más de 900 px, cierra el menú móvil.
    window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });
  // Cierra el bloque de eventos del menú.
  }

  /* ---- Zona de sesión del header ---- */
  // Obtiene el contenedor donde se muestra el botón de ingresar o el menú del usuario.
  const authArea = document.getElementById("auth-area");
  // Función que dibuja la zona de sesión según haya usuario logueado o no.
  const renderAuthArea = () => {
    // Si no existe el contenedor, no hace nada.
    if (!authArea) return;
    // Pregunta a Auth si hay un usuario en sesión (o null si Auth no está cargado).
    const user = window.Auth ? window.Auth.currentUser() : null;
    // Si hay usuario, muestra su menú personal.
    if (user) {
      /*
        Plantilla HTML del menú del usuario. Línea por línea:
        - <details class="user-menu">: contenedor desplegable del menú.
        - <summary>: fila visible con el punto, el primer nombre y la flecha.
        - <span class="user-dot">: adorno visual; aria-hidden lo oculta a lectores de pantalla.
        - <span class="user-name">: primer nombre del usuario, escapado con esc().
        - <div class="user-panel">: panel con los enlaces y el botón de cerrar sesión.
        - <a href="agenda.html">Mi agenda</a>: acceso a las citas.
        - <a href="cuenta.html">Mi cuenta</a>: acceso a los datos de la cuenta.
        - <button data-logout>Cerrar sesión</button>: botón que el listener global detecta.
      */
      authArea.innerHTML = `<details class="user-menu">
        <summary><span class="user-dot" aria-hidden="true"></span><span class="user-name">${esc(user.nombre.split(/\s+/)[0])}</span><span class="chev" aria-hidden="true"></span></summary>
        <div class="user-panel">
          <a href="agenda.html">Mi agenda</a>
          <a href="cuenta.html">Mi cuenta</a>
          <button type="button" data-logout>Cerrar sesión</button>
        </div>
      </details>`;
    // Si no hay usuario, muestra el botón de ingresar.
    } else {
      // Enlace al login que, tras entrar, lleva a la agenda (next codificado con %23 para el ancla).
      authArea.innerHTML = `<a class="btn btn-outline btn-sm" href="cuenta.html?next=agenda.html">Ingresar</a>`;
    // Cierra el caso sin usuario.
    }
  // Cierra la función renderAuthArea.
  };
  // Ejecuta el dibujo de la zona de sesión al cargar la página.
  renderAuthArea();

  // Escucha clics en todo el documento para manejar el cierre de sesión y el cierre del menú desplegable.
  document.addEventListener("click", (e) => {
    // Si el clic fue en el botón de cerrar sesión (o dentro de él)...
    if (e.target.closest("[data-logout]")) {
      // Evita el comportamiento por defecto del botón.
      e.preventDefault();
      // Si Auth existe, cierra la sesión.
      if (window.Auth) window.Auth.logout();
      // Si estamos en la página de la agenda, vuelve al inicio; en otras páginas, recarga.
      if (document.body.classList.contains("page-app")) location.replace("index.html");
      // En cualquier otro caso, recarga la página actual para reflejar el cierre.
      else location.reload();
      // Sale del listener para no ejecutar el resto.
      return;
    // Cierra el bloque de cierre de sesión.
    }
    // Recorre todos los menús de usuario que estén abiertos.
    document.querySelectorAll(".user-menu[open]").forEach((d) => {
      // Si el clic ocurrió fuera del menú, lo cierra quitando el atributo "open".
      if (!d.contains(e.target)) d.removeAttribute("open");
    // Cierra el recorrido de menús.
    });
  // Cierra el listener de clics.
  });

  /* ---- CTAs de reserva según la sesión ---- */
  // Vuelve a consultar el usuario actual para ajustar los botones de reserva.
  const user = window.Auth ? window.Auth.currentUser() : null;
  // Recorre todos los elementos marcados con data-book (botones "Reservar").
  document.querySelectorAll("[data-book]").forEach((a) => {
    // Si hay sesión, el botón lleva a la agenda; si no, al login con destino a la agenda y su ancla.
    a.setAttribute("href", user ? "agenda.html#reservar" : "cuenta.html?next=agenda.html%23reservar");
  // Cierra el recorrido de botones de reserva.
  });

  /* ---- Año del footer ---- */
  // Recorre los elementos marcados con data-year y escribe el año actual.
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---- Entrada del hero ---- */
  // Solo anima si la librería GSAP está cargada y el usuario no pidió reducir movimiento.
  if (window.gsap && !reduce) {
    // Selecciona los elementos del hero que deben aparecer animados.
    const heroItems = document.querySelectorAll("[data-hero]");
    // Si hay al menos uno, prepara la animación.
    if (heroItems.length) {
      // Anima la aparición: opacidad y visibilidad desde 0, desplazamiento vertical, duración, curva y retardo escalonado.
      gsap.from(heroItems, { autoAlpha: 0, y: 30, duration: 1.1, ease: "expo.out", stagger: 0.09, delay: 0.1 });
      // Busca la imagen de fondo del hero.
      const bg = document.querySelector(".hero-bg img");
      // Si existe, le aplica un zoom suave desde escala 1.12 hasta su tamaño normal.
      if (bg) gsap.from(bg, { scale: 1.12, duration: 2.8, ease: "expo.out" });
    // Cierra la comprobación de elementos del hero.
    }
  // Cierra la comprobación de GSAP y movimiento reducido.
  }

  /* ---- Aparición de secciones ---- */
  // Selecciona todos los elementos que deben aparecer al hacer scroll.
  const reveals = document.querySelectorAll("[data-reveal]");
  // Solo trabaja si hay elementos para animar.
  if (reveals.length) {
    // Si no hay IntersectionObserver o el usuario prefiere menos movimiento, muestra todo de inmediato.
    if (!("IntersectionObserver" in window) || reduce) {
      // Añade la clase "is-in" a cada elemento para que el CSS lo muestre.
      reveals.forEach((el) => el.classList.add("is-in"));
    // Si se puede animar, usa un observador.
    } else {
      // Crea el observador que recibe la lista de elementos que cambian de visibilidad.
      const io = new IntersectionObserver((entries) => {
        // Recorre cada entrada observada.
        entries.forEach((entry) => {
          // Si el elemento todavía no está visible, no hace nada.
          if (!entry.isIntersecting) return;
          // Marca el elemento como visible para que el CSS lo anime.
          entry.target.classList.add("is-in");
          // Deja de observarlo para que la animación ocurra una sola vez.
          io.unobserve(entry.target);
        // Cierra el recorrido de entradas.
        });
      // Configura el observador: 12% visible y un margen inferior de -40 px para adelantar la aparición.
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      // Empieza a observar cada elemento animable.
      reveals.forEach((el) => io.observe(el));
    // Cierra el caso con IntersectionObserver.
    }
  // Cierra la comprobación de elementos reveal.
  }
// Cierra la IIFE.
})();
