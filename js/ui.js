/* ===== Interfaz compartida: header, sesión visible y animaciones ===== */
(() => {
  document.documentElement.classList.add("js");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Header con fondo al hacer scroll ---- */
  const header = document.querySelector("[data-header]");
  const sentinel = document.querySelector("[data-sentinel]");
  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle("is-scrolled", !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* ---- Menú móvil ---- */
  const nav = document.getElementById("nav");
  const toggle = document.querySelector(".nav-toggle");
  const setMenu = (open) => {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("menu-open", open);
  };
  if (nav && toggle) {
    toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });
  }

  /* ---- Zona de sesión del header ---- */
  const authArea = document.getElementById("auth-area");
  const renderAuthArea = () => {
    if (!authArea) return;
    const user = window.Auth ? window.Auth.currentUser() : null;
    if (user) {
      authArea.innerHTML = `<details class="user-menu">
        <summary><span class="user-dot" aria-hidden="true"></span><span class="user-name">${esc(user.nombre.split(/\s+/)[0])}</span><span class="chev" aria-hidden="true"></span></summary>
        <div class="user-panel">
          <a href="agenda.html">Mi agenda</a>
          <a href="cuenta.html">Mi cuenta</a>
          <button type="button" data-logout>Cerrar sesión</button>
        </div>
      </details>`;
    } else {
      authArea.innerHTML = `<a class="btn btn-outline btn-sm" href="cuenta.html?next=agenda.html">Ingresar</a>`;
    }
  };
  renderAuthArea();

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-logout]")) {
      e.preventDefault();
      if (window.Auth) window.Auth.logout();
      if (document.body.classList.contains("page-app")) location.replace("index.html");
      else location.reload();
      return;
    }
    document.querySelectorAll(".user-menu[open]").forEach((d) => {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });

  /* ---- CTAs de reserva según la sesión ---- */
  const user = window.Auth ? window.Auth.currentUser() : null;
  document.querySelectorAll("[data-book]").forEach((a) => {
    a.setAttribute("href", user ? "agenda.html#reservar" : "cuenta.html?next=agenda.html%23reservar");
  });

  /* ---- Año del footer ---- */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---- Entrada del hero ---- */
  if (window.gsap && !reduce) {
    const heroItems = document.querySelectorAll("[data-hero]");
    if (heroItems.length) {
      gsap.from(heroItems, { autoAlpha: 0, y: 30, duration: 1.1, ease: "expo.out", stagger: 0.09, delay: 0.1 });
      const bg = document.querySelector(".hero-bg img");
      if (bg) gsap.from(bg, { scale: 1.12, duration: 2.8, ease: "expo.out" });
    }
  }

  /* ---- Aparición de secciones ---- */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    if (!("IntersectionObserver" in window) || reduce) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach((el) => io.observe(el));
    }
  }
})();
