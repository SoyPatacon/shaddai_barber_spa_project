/* ===== Cuentas de usuario =====
   Demo local: la contraseña se guarda con PBKDF2-SHA256 + salt cuando el navegador
   lo permite. No es seguridad de producción; al migrar a Supabase esto se delega
   al servicio de autenticación. */

// Crea en `window` un objeto `Auth` mediante una IIFE; así las funciones quedan encapsuladas y solo se exponen las necesarias.
window.Auth = (() => {
  // Guarda una referencia al objeto Store para no escribir `window.Store` en cada llamada.
  const Store = window.Store;
  // Expresión regular que valida un correo: texto, arroba, dominio, punto y al menos 2 letras de extensión.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Convierte un arreglo de bytes en texto Base64 (útil para guardar salt y hash como texto).
  const bytesToB64 = (bytes) => btoa(String.fromCharCode(...bytes));
  // Hace lo contrario: convierte un texto Base64 en un arreglo de bytes (Uint8Array).
  const b64ToBytes = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  // Comprueba si el navegador ofrece la API criptográfica necesaria (crypto.subtle y números aleatorios seguros).
  const cryptoOk = () => !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);

  // Genera un "salt" (valor aleatorio) único que se añade a la contraseña antes de hashearla.
  const makeSalt = () => {
    // Si el navegador tiene generador de números aleatorios seguro, lo usa.
    if (window.crypto && window.crypto.getRandomValues) {
      // Crea un arreglo de 16 bytes que se llenará con valores aleatorios.
      const a = new Uint8Array(16);
      // Llena el arreglo con bytes aleatorios criptográficamente seguros.
      window.crypto.getRandomValues(a);
      // Convierte esos bytes a Base64 y los devuelve como salt.
      return bytesToB64(a);
    // Cierra la comprobación de crypto.
    }
    // Respaldo para navegadores sin crypto: combina texto fijo, un número aleatorio y la fecha actual.
    return "demo-salt-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  // Cierra la función makeSalt.
  };

  // Respaldo para contextos sin crypto.subtle (por ejemplo, abrir el archivo con file://).
  // Calcula un hash simple y no seguro usando dos acumuladores y la posición de cada carácter.
  const fallbackHash = (password, salt) => {
    // Une el salt y la contraseña con un separador para que el resultado dependa de ambos.
    const text = salt + "|" + password;
    // Primer acumulador inicializado con una constante típica de FNV-1a (32 bits).
    let h1 = 0x811c9dc5;
    // Segundo acumulador inicializado con otra constante para producir más dispersión.
    let h2 = 0x1000193;
    // Recorre el texto carácter por carácter.
    for (let i = 0; i < text.length; i++) {
      // Obtiene el código numérico del carácter actual.
      const c = text.charCodeAt(i);
      // Mezcla el acumulador h1 con el carácter y multiplica por el primo de FNV, manteniéndolo en 32 bits sin signo.
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      // Mezcla el acumulador h2 sumando el carácter y multiplicando por otro primo, también en 32 bits sin signo.
      h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
    // Cierra el bucle.
    }
    // Devuelve el hash con prefijo "demo$" y cada acumulador en hexadecimal de 8 dígitos.
    return "demo$" + h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  // Cierra la función fallbackHash.
  };

  // Calcula el hash de una contraseña usando PBKDF2-SHA256 si el navegador lo permite.
  const hash = async (password, salt) => {
    // Si no hay soporte criptográfico, usa el respaldo simple.
    if (!cryptoOk()) return fallbackHash(password, salt);
    // Importa la contraseña como una clave criptográfica apta para PBKDF2 (solo derivación de bits).
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    // Deriva 256 bits usando PBKDF2 con el salt, 120000 iteraciones y SHA-256.
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64ToBytes(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
    // Convierte los bits derivados a Base64 y les añade el prefijo "pbkdf2$".
    return "pbkdf2$" + bytesToB64(new Uint8Array(bits));
  // Cierra la función hash.
  };

  // Comprueba si una contraseña coincide con el hash guardado, usando el mismo algoritmo con el que se creó.
  const verify = async (password, salt, stored) => {
    // Si el hash guardado empieza con "demo$", compara con el respaldo simple.
    if (String(stored).startsWith("demo$")) return fallbackHash(password, salt) === stored;
    // En caso contrario, calcula el hash PBKDF2 y lo compara con el guardado.
    return (await hash(password, salt)) === stored;
  // Cierra la función verify.
  };

  // Registra un usuario nuevo validando los datos, hasheando la contraseña y creando la sesión.
  async function register({ nombre, email, telefono, password }) {
    // Limpia el nombre quitando espacios de los extremos.
    const name = String(nombre || "").trim();
    // Limpia el correo y lo pasa a minúsculas para compararlo de forma uniforme.
    const mail = String(email || "").trim().toLowerCase();
    // Limpia el teléfono quitando espacios de los extremos.
    const phone = String(telefono || "").trim();
    // Valida que el nombre tenga al menos 2 caracteres.
    if (name.length < 2) return { ok: false, error: "Escribe tu nombre completo." };
    // Valida el formato del correo con la expresión regular.
    if (!EMAIL_RE.test(mail)) return { ok: false, error: "Escribe un correo válido." };
    // Valida que el teléfono tenga al menos 7 dígitos (ignorando guiones, espacios, etc.).
    if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Escribe un teléfono válido." };
    // Valida que la contraseña tenga al menos 8 caracteres.
    if (String(password || "").length < 8) return { ok: false, error: "La contraseña necesita al menos 8 caracteres." };
    // Comprueba que el correo no esté ya registrado.
    if (Store.userByEmail(mail)) return { ok: false, error: "Ese correo ya tiene una cuenta. Inicia sesión." };

    // Genera un salt único para este usuario.
    const passSalt = makeSalt();
    // Construye el objeto del usuario con sus datos y credenciales.
    const user = {
      // Asigna un identificador único.
      id: Store.uid(),
      // Guarda el nombre ya limpio.
      nombre: name,
      // Guarda el correo normalizado.
      email: mail,
      // Guarda el teléfono.
      telefono: phone,
      // Guarda el salt usado para el hash.
      passSalt,
      // Calcula y guarda el hash de la contraseña (espera porque es asíncrono).
      passHash: await hash(password, passSalt),
      // Guarda la fecha de creación en formato ISO.
      creado: new Date().toISOString()
    // Cierra el objeto usuario.
    };
    // Obtiene la lista actual de usuarios.
    const list = Store.getUsers();
    // Agrega el usuario nuevo a la lista.
    list.push(user);
    // Intenta guardar la lista; si falla, devuelve un error.
    if (!Store.saveUsers(list)) return { ok: false, error: "No se pudo guardar la cuenta en este navegador." };
    // Inicia la sesión automáticamente para el usuario recién registrado.
    Store.startSession(user.id);
    // Verifica que la sesión se haya podido crear (por ejemplo, si localStorage está bloqueado).
    if (!Store.getSession()) return { ok: false, error: "El navegador bloqueó el almacenamiento local. Revisa la configuración de privacidad." };
    // Devuelve éxito con los datos públicos del usuario (sin contraseña).
    return { ok: true, user: Store.publicUser(user) };
  // Cierra la función register.
  }

  // Inicia sesión comprobando el correo y la contraseña contra los datos guardados.
  async function login(email, password) {
    // Normaliza el correo recibido.
    const mail = String(email || "").trim().toLowerCase();
    // Exige que ambos campos tengan contenido.
    if (!mail || !password) return { ok: false, error: "Escribe tu correo y tu contraseña." };
    // Busca al usuario por correo.
    const user = Store.userByEmail(mail);
    // Si no existe, devuelve un error genérico.
    if (!user) return { ok: false, error: "No encontramos una cuenta con ese correo." };
    // Verifica la contraseña contra el salt y el hash guardados (espera el resultado asíncrono).
    const ok = await verify(String(password), user.passSalt, user.passHash);
    // Si no coincide, devuelve un error.
    if (!ok) return { ok: false, error: "La contraseña no coincide. Inténtalo de nuevo." };
    // Crea la sesión para el usuario autenticado.
    Store.startSession(user.id);
    // Comprueba que la sesión se haya guardado correctamente.
    if (!Store.getSession()) return { ok: false, error: "El navegador bloqueó el almacenamiento local. Revisa la configuración de privacidad." };
    // Devuelve éxito con los datos públicos del usuario.
    return { ok: true, user: Store.publicUser(user) };
  // Cierra la función login.
  }

  // Cierra la sesión actual delegando en Store.
  const logout = () => Store.endSession();
  // Devuelve el usuario de la sesión actual o null si no hay sesión válida (el `?.` evita errores si getSession devuelve null).
  const currentUser = () => Store.getSession()?.user || null;

  // Valida a qué página se puede redirigir después del login para evitar redirecciones externas o maliciosas.
  const safeNext = (next) => {
    // Convierte el valor recibido a texto (cadena vacía si es null/undefined).
    const value = String(next || "");
    // Solo acepta un nombre de archivo .html con caracteres seguros y, opcionalmente, un ancla (#...).
    return /^[a-z0-9._-]+\.html(#[a-z0-9_-]+)?$/i.test(value) ? value : "agenda.html";
  // Cierra la función safeNext.
  };

  // Protege una página: devuelve el usuario si hay sesión o redirige al login si no la hay.
  const requireUser = (next = "agenda.html") => {
    // Obtiene el usuario de la sesión actual.
    const user = currentUser();
    // Si hay usuario, permite el acceso devolviéndolo.
    if (user) return user;
    // Valida la página de destino a la que se volverá después de iniciar sesión.
    const base = safeNext(next);
    // Conserva el ancla de la URL actual si existe y el destino no tiene ya una.
    const target = base + (location.hash && !base.includes("#") ? location.hash : "");
    // Redirige a la pantalla de cuenta enviando el destino en el parámetro `next` (codificado para la URL).
    location.replace("cuenta.html?next=" + encodeURIComponent(target));
    // Devuelve null para indicar que no hay usuario y que la página debe detenerse.
    return null;
  // Cierra la función requireUser.
  };

  // Expone públicamente las funciones de autenticación que usarán las demás pantallas.
  return { register, login, logout, currentUser, safeNext, requireUser };
// Cierra la IIFE y la asignación a window.Auth.
})();
