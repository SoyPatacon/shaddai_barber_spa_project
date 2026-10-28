/* ===== Pantalla de cuenta: login y registro ===== */
(() => {
  const Auth = window.Auth;
  if (!Auth) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "agenda.html";

  const title = document.getElementById("auth-title");
  const intro = document.getElementById("auth-intro");
  const formsWrap = document.getElementById("auth-forms");
  const sessionPanel = document.getElementById("auth-session");
  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  const panels = {
    login: document.getElementById("form-login"),
    register: document.getElementById("form-register")
  };

  const showSession = (user) => {
    if (!formsWrap || !sessionPanel) return;
    formsWrap.hidden = true;
    sessionPanel.hidden = false;
    title.textContent = `Hola, ${user.nombre.split(/\s+/)[0]}`;
    intro.textContent = "Tu sesión está activa en este navegador.";
    sessionPanel.innerHTML = `
      <p class="session-line">Sesión iniciada como <strong>${esc(user.email)}</strong></p>
      <div class="session-actions">
        <a class="btn btn-red btn-sm" href="${esc(Auth.safeNext(next))}">Ir a mi agenda</a>
        <button class="btn btn-ghost btn-sm" type="button" data-logout>Cambiar de cuenta</button>
      </div>`;
  };

  const user = Auth.currentUser();
  if (user) {
    showSession(user);
    return;
  }

  const clearMsg = (form) => {
    const msg = form.querySelector(".form-msg");
    if (msg) msg.textContent = "";
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let switchTimer = null;

  const replay = (el, className) => {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  };

  const selectTab = (name, { animate = true, focus = false } = {}) => {
    const target = panels[name];
    if (!target) return;

    const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    if (animate && current && current.dataset.tab === name && !target.hidden) {
      if (focus) {
        const first = target.querySelector("input");
        if (first) first.focus({ preventScroll: true });
      }
      return;
    }

    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    Object.entries(panels).forEach(([key, panel]) => {
      if (key === name) return;
      panel.hidden = true;
      panel.classList.remove("is-entering");
    });

    target.hidden = false;
    title.textContent = name === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta";
    intro.textContent = name === "login"
      ? "Entra para agendar, revisar y administrar tus citas."
      : "Un minuto y ya puedes reservar tu primera cita.";

    clearTimeout(switchTimer);
    if (animate && !reduceMotion) {
      replay(target, "is-entering");
      replay(title, "text-in");
      replay(intro, "text-in");
      switchTimer = setTimeout(() => {
        target.classList.remove("is-entering");
        title.classList.remove("text-in");
        intro.classList.remove("text-in");
      }, 900);
    } else {
      target.classList.remove("is-entering");
      title.classList.remove("text-in");
      intro.classList.remove("text-in");
    }

    if (focus) {
      const first = target.querySelector("input");
      if (first) first.focus({ preventScroll: true });
    }
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.tab, { focus: true })));
  selectTab("login", { animate: false });

  /* ---- Mostrar / ocultar contraseña ---- */
  document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Ocultar" : "Ver";
      btn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  });

  /* ---- Envío de formularios ---- */
  const submit = async (form, action) => {
    const msg = form.querySelector(".form-msg");
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.textContent;
    msg.textContent = "";
    btn.disabled = true;
    btn.textContent = "Un momento…";
    let res;
    try {
      res = await action();
    } catch {
      res = { ok: false, error: "Algo salió mal. Inténtalo de nuevo." };
    }
    if (!res.ok) {
      msg.textContent = res.error;
      btn.disabled = false;
      btn.textContent = label;
      return;
    }
    location.replace(Auth.safeNext(next));
  };

  panels.login.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = panels.login;
    submit(f, () => Auth.login(f.elements.email.value, f.elements.password.value));
  });

  panels.register.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = panels.register;
    submit(f, () => Auth.register({
      nombre: f.elements.nombre.value,
      email: f.elements.email.value,
      telefono: f.elements.telefono.value,
      password: f.elements.password.value
    }));
  });

  panels.login.addEventListener("input", () => clearMsg(panels.login));
  panels.register.addEventListener("input", () => clearMsg(panels.register));
})();
