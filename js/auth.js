/* ===== Cuentas de usuario =====
   Demo local: la contraseña se guarda con PBKDF2-SHA256 + salt cuando el navegador
   lo permite. No es seguridad de producción; al migrar a Supabase esto se delega
   al servicio de autenticación. */
window.Auth = (() => {
  const Store = window.Store;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const bytesToB64 = (bytes) => btoa(String.fromCharCode(...bytes));
  const b64ToBytes = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const cryptoOk = () => !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);

  const makeSalt = () => {
    if (window.crypto && window.crypto.getRandomValues) {
      const a = new Uint8Array(16);
      window.crypto.getRandomValues(a);
      return bytesToB64(a);
    }
    return "demo-salt-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  // Respaldo para contextos sin crypto.subtle (por ejemplo, abrir el archivo con file://).
  const fallbackHash = (password, salt) => {
    const text = salt + "|" + password;
    let h1 = 0x811c9dc5;
    let h2 = 0x1000193;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
    }
    return "demo$" + h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  };

  const hash = async (password, salt) => {
    if (!cryptoOk()) return fallbackHash(password, salt);
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64ToBytes(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
    return "pbkdf2$" + bytesToB64(new Uint8Array(bits));
  };

  const verify = async (password, salt, stored) => {
    if (String(stored).startsWith("demo$")) return fallbackHash(password, salt) === stored;
    return (await hash(password, salt)) === stored;
  };

  async function register({ nombre, email, telefono, password }) {
    const name = String(nombre || "").trim();
    const mail = String(email || "").trim().toLowerCase();
    const phone = String(telefono || "").trim();
    if (name.length < 2) return { ok: false, error: "Escribe tu nombre completo." };
    if (!EMAIL_RE.test(mail)) return { ok: false, error: "Escribe un correo válido." };
    if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Escribe un teléfono válido." };
    if (String(password || "").length < 8) return { ok: false, error: "La contraseña necesita al menos 8 caracteres." };
    if (Store.userByEmail(mail)) return { ok: false, error: "Ese correo ya tiene una cuenta. Inicia sesión." };

    const passSalt = makeSalt();
    const user = {
      id: Store.uid(),
      nombre: name,
      email: mail,
      telefono: phone,
      passSalt,
      passHash: await hash(password, passSalt),
      creado: new Date().toISOString()
    };
    const list = Store.getUsers();
    list.push(user);
    if (!Store.saveUsers(list)) return { ok: false, error: "No se pudo guardar la cuenta en este navegador." };
    Store.startSession(user.id);
    if (!Store.getSession()) return { ok: false, error: "El navegador bloqueó el almacenamiento local. Revisa la configuración de privacidad." };
    return { ok: true, user: Store.publicUser(user) };
  }

  async function login(email, password) {
    const mail = String(email || "").trim().toLowerCase();
    if (!mail || !password) return { ok: false, error: "Escribe tu correo y tu contraseña." };
    const user = Store.userByEmail(mail);
    if (!user) return { ok: false, error: "No encontramos una cuenta con ese correo." };
    const ok = await verify(String(password), user.passSalt, user.passHash);
    if (!ok) return { ok: false, error: "La contraseña no coincide. Inténtalo de nuevo." };
    Store.startSession(user.id);
    if (!Store.getSession()) return { ok: false, error: "El navegador bloqueó el almacenamiento local. Revisa la configuración de privacidad." };
    return { ok: true, user: Store.publicUser(user) };
  }

  const logout = () => Store.endSession();
  const currentUser = () => Store.getSession()?.user || null;

  const safeNext = (next) => {
    const value = String(next || "");
    return /^[a-z0-9._-]+\.html(#[a-z0-9_-]+)?$/i.test(value) ? value : "agenda.html";
  };

  const requireUser = (next = "agenda.html") => {
    const user = currentUser();
    if (user) return user;
    const base = safeNext(next);
    const target = base + (location.hash && !base.includes("#") ? location.hash : "");
    location.replace("cuenta.html?next=" + encodeURIComponent(target));
    return null;
  };

  return { register, login, logout, currentUser, safeNext, requireUser };
})();
