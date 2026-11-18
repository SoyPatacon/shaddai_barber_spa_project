/* ===== Pantalla de cuenta: login y registro ===== */

// IIFE que controla las pestañas, los formularios y la sesión de la pantalla de cuenta.
(() => {
  // Toma el objeto Auth para iniciar sesión, registrar y cerrar sesión.
  const Auth = window.Auth;
  // Si Auth no está cargado, termina para evitar errores.
  if (!Auth) return;
  // Escapa caracteres especiales de HTML para insertar texto de forma segura.
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Lee los parámetros de la URL actual (por ejemplo, ?next=agenda.html).
  const params = new URLSearchParams(location.search);
  // Obtiene la página de destino tras iniciar sesión; si no viene, usa la agenda.
  const next = params.get("next") || "agenda.html";

  // Referencia al título principal de la pantalla.
  const title = document.getElementById("auth-title");
  // Referencia al texto introductorio bajo el título.
  const intro = document.getElementById("auth-intro");
  // Referencia al contenedor que agrupa los formularios.
  const formsWrap = document.getElementById("auth-forms");
  // Referencia al panel que se muestra cuando ya hay una sesión activa.
  const sessionPanel = document.getElementById("auth-session");
  // Convierte en arreglo las pestañas de "Ingresar" y "Crear cuenta".
  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  // Objeto que relaciona cada pestaña con su formulario correspondiente.
  const panels = {
    // Formulario de inicio de sesión.
    login: document.getElementById("form-login"),
    // Formulario de registro.
    register: document.getElementById("form-register")
  // Cierra el objeto de paneles.
  };

  // Muestra el panel de sesión activa con el nombre del usuario.
  const showSession = (user) => {
    // Si faltan los contenedores necesarios, no hace nada.
    if (!formsWrap || !sessionPanel) return;
    // Oculta los formularios de login y registro.
    formsWrap.hidden = true;
    // Muestra el panel de sesión.
    sessionPanel.hidden = false;
    // Cambia el título por un saludo con el primer nombre del usuario.
    title.textContent = `Hola, ${user.nombre.split(/\s+/)[0]}`;
    // Escribe un texto que confirma que la sesión está activa.
    intro.textContent = "Tu sesión está activa en este navegador.";
    /*
      HTML del panel de sesión. Línea por línea:
      - <p class="session-line">: texto con el correo de la cuenta.
      - <div class="session-actions">: fila de botones.
      - <a class="btn btn-red">: enlace validado por Auth.safeNext hacia la agenda.
      - <button data-logout> "Cambiar de cuenta": cierra la sesión (lo maneja ui.js).
    */
    sessionPanel.innerHTML = `
      <p class="session-line">Sesión iniciada como <strong>${esc(user.email)}</strong></p>
      <div class="session-actions">
        <a class="btn btn-red btn-sm" href="${esc(Auth.safeNext(next))}">Ir a mi agenda</a>
        <button class="btn btn-ghost btn-sm" type="button" data-logout>Cambiar de cuenta</button>
      </div>`;
  // Cierra la función showSession.
  };

  // Consulta si ya hay un usuario con sesión iniciada.
  const user = Auth.currentUser();
  // Si ya hay sesión, muestra el panel correspondiente.
  if (user) {
    // Dibuja el panel de sesión activa.
    showSession(user);
    // Termina la ejecución: no tiene sentido cargar los formularios.
    return;
  // Cierra el caso de sesión existente.
  }

  // Borra el mensaje de error o aviso de un formulario.
  const clearMsg = (form) => {
    // Busca el elemento de mensaje dentro del formulario.
    const msg = form.querySelector(".form-msg");
    // Si existe, vacía su texto.
    if (msg) msg.textContent = "";
  // Cierra la función clearMsg.
  };

  // Detecta si el usuario prefiere reducir las animaciones.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Variable para guardar el temporizador de la animación de cambio de pestaña.
  let switchTimer = null;

  // Reinicia una animación CSS quitando la clase, forzando un reflow y volviéndola a añadir.
  const replay = (el, className) => {
    // Quita la clase de animación si ya estaba puesta.
    el.classList.remove(className);
    // Lee offsetWidth para obligar al navegador a recalcular el diseño (reinicia la animación).
    void el.offsetWidth;
    // Vuelve a añadir la clase para que la animación empiece de nuevo.
    el.classList.add(className);
  // Cierra la función replay.
  };

  // Cambia a la pestaña indicada ("login" o "register") y ajusta textos y animaciones.
  const selectTab = (name, { animate = true, focus = false } = {}) => {
    // Obtiene el formulario correspondiente a la pestaña.
    const target = panels[name];
    // Si la pestaña no existe, no hace nada.
    if (!target) return;

    // Busca la pestaña que está marcada como seleccionada actualmente.
    const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    // Si ya estamos en esa pestaña y su formulario está visible...
    if (animate && current && current.dataset.tab === name && !target.hidden) {
      // Si se pidió enfocar, enfoca el primer campo sin hacer scroll.
      if (focus) {
        // Busca el primer input del formulario.
        const first = target.querySelector("input");
        // Si existe, lo enfoca.
        if (first) first.focus({ preventScroll: true });
      // Cierra el enfoque.
      }
      // Sale sin repetir la animación.
      return;
    // Cierra el caso de pestaña ya activa.
    }

    // Marca como seleccionada solo la pestaña pulsada y desmarca las demás (accesibilidad).
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    // Recorre todos los paneles para ocultar los que no corresponden.
    Object.entries(panels).forEach(([key, panel]) => {
      // Si es el panel que se va a mostrar, lo salta.
      if (key === name) return;
      // Oculta el otro formulario.
      panel.hidden = true;
      // Le quita la clase de animación de entrada.
      panel.classList.remove("is-entering");
    // Cierra el recorrido de paneles.
    });

    // Muestra el formulario seleccionado.
    target.hidden = false;
    // Cambia el título según la pestaña elegida.
    title.textContent = name === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta";
    // Cambia la introducción según la pestaña elegida.
    intro.textContent = name === "login"
      // Texto para iniciar sesión.
      ? "Entra para agendar, revisar y administrar tus citas."
      // Texto para crear una cuenta.
      : "Un minuto y ya puedes reservar tu primera cita.";

    // Cancela cualquier temporizador de animación anterior.
    clearTimeout(switchTimer);
    // Si se debe animar y el usuario no pidió reducir movimiento...
    if (animate && !reduceMotion) {
      // Reinicia la animación de entrada del formulario.
      replay(target, "is-entering");
      // Reinicia la animación del título.
      replay(title, "text-in");
      // Reinicia la animación de la introducción.
      replay(intro, "text-in");
      // Programa la limpieza de las clases de animación después de 900 ms.
      switchTimer = setTimeout(() => {
        // Quita la clase de animación del formulario.
        target.classList.remove("is-entering");
        // Quita la clase de animación del título.
        title.classList.remove("text-in");
        // Quita la clase de animación de la introducción.
        intro.classList.remove("text-in");
      // Cierra el temporizador.
      }, 900);
    // Si no se anima, limpia las clases de inmediato.
    } else {
      // Quita la clase de animación del formulario.
      target.classList.remove("is-entering");
      // Quita la clase de animación del título.
      title.classList.remove("text-in");
      // Quita la clase de animación de la introducción.
      intro.classList.remove("text-in");
    // Cierra el caso sin animación.
    }

    // Si se pidió enfocar, enfoca el primer campo del formulario visible.
    if (focus) {
      // Busca el primer input del formulario.
      const first = target.querySelector("input");
      // Si existe, lo enfoca sin hacer scroll.
      if (first) first.focus({ preventScroll: true });
    // Cierra el enfoque.
    }
  // Cierra la función selectTab.
  };

  // Al hacer clic en una pestaña, cambia a ella y enfoca su primer campo.
  tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.tab, { focus: true })));
  // Al cargar la página, muestra la pestaña de login sin animación.
  selectTab("login", { animate: false });

  /* ---- Mostrar / ocultar contraseña ---- */
  // Recorre todos los botones que permiten mostrar u ocultar la contraseña.
  document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
    // Añade el comportamiento al hacer clic en cada botón.
    btn.addEventListener("click", () => {
      // Busca el input asociado dentro del mismo contenedor del botón.
      const input = btn.parentElement.querySelector("input");
      // Comprueba si la contraseña está actualmente oculta.
      const show = input.type === "password";
      // Cambia el tipo del input a texto para mostrarla, o a password para ocultarla.
      input.type = show ? "text" : "password";
      // Cambia el texto del botón según el nuevo estado.
      btn.textContent = show ? "Ocultar" : "Ver";
      // Actualiza la etiqueta accesible del botón para lectores de pantalla.
      btn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    // Cierra el listener del botón.
    });
  // Cierra el recorrido de botones de contraseña.
  });

  /* ---- Envío de formularios ---- */
  // Función común que envía un formulario: bloquea el botón, ejecuta la acción y muestra errores o redirige.
  const submit = async (form, action) => {
    // Busca el elemento donde se muestran los mensajes.
    const msg = form.querySelector(".form-msg");
    // Busca el botón de envío del formulario.
    const btn = form.querySelector('button[type="submit"]');
    // Guarda el texto original del botón para restaurarlo si hay error.
    const label = btn.textContent;
    // Limpia cualquier mensaje anterior.
    msg.textContent = "";
    // Desactiva el botón para evitar envíos duplicados.
    btn.disabled = true;
    // Cambia el texto del botón para indicar que está procesando.
    btn.textContent = "Un momento…";
    // Declara la variable donde se guardará el resultado.
    let res;
    // Abre un bloque try para capturar errores inesperados.
    try {
      // Ejecuta la acción asíncrona (login o registro) y espera su resultado.
      res = await action();
    // Captura cualquier excepción de la acción.
    } catch {
      // Convierte el error en un resultado fallido con un mensaje genérico.
      res = { ok: false, error: "Algo salió mal. Inténtalo de nuevo." };
    // Cierra el bloque catch.
    }
    // Si la acción falló...
    if (!res.ok) {
      // Muestra el mensaje de error devuelto.
      msg.textContent = res.error;
      // Vuelve a habilitar el botón.
      btn.disabled = false;
      // Restaura el texto original del botón.
      btn.textContent = label;
      // Sale de la función sin redirigir.
      return;
    // Cierra el caso de error.
    }
    // Si todo salió bien, redirige a la página de destino validada.
    location.replace(Auth.safeNext(next));
  // Cierra la función submit.
  };

  // Escucha el envío del formulario de inicio de sesión.
  panels.login.addEventListener("submit", (e) => {
    // Evita que el navegador recargue la página al enviar.
    e.preventDefault();
    // Guarda una referencia corta al formulario de login.
    const f = panels.login;
    // Llama a submit con la acción de login usando los valores de correo y contraseña.
    submit(f, () => Auth.login(f.elements.email.value, f.elements.password.value));
  // Cierra el listener del formulario de login.
  });

  // Escucha el envío del formulario de registro.
  panels.register.addEventListener("submit", (e) => {
    // Evita que el navegador recargue la página al enviar.
    e.preventDefault();
    // Guarda una referencia corta al formulario de registro.
    const f = panels.register;
    // Llama a submit con la acción de registro y los datos escritos.
    submit(f, () => Auth.register({
      // Envía el nombre.
      nombre: f.elements.nombre.value,
      // Envía el correo.
      email: f.elements.email.value,
      // Envía el teléfono.
      telefono: f.elements.telefono.value,
      // Envía la contraseña.
      password: f.elements.password.value
    // Cierra el objeto enviado a register.
    }));
  // Cierra el listener del formulario de registro.
  });

  // Al escribir en el formulario de login, borra el mensaje de error anterior.
  panels.login.addEventListener("input", () => clearMsg(panels.login));
  // Al escribir en el formulario de registro, borra el mensaje de error anterior.
  panels.register.addEventListener("input", () => clearMsg(panels.register));
// Cierra la IIFE.
})();
