/* ===== Capa de datos =====
   Hoy todo vive en localStorage (solo este navegador). La idea es que estas
   mismas funciones se reemplacen por Supabase más adelante sin tocar las pantallas. */
window.Store = (() => {
  const KEY = {
    users: "shaddai:users",
    session: "shaddai:session",
    appts: "shaddai:appointments",
    legacy: "shaddai-citas"
  };
  const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  const uid = () => {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  };
  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
  const publicUser = (u) => u && ({ id: u.id, nombre: u.nombre, email: u.email, telefono: u.telefono, creado: u.creado });

  /* ---- Usuarios ---- */
  const getUsers = () => read(KEY.users, []);
  const saveUsers = (list) => write(KEY.users, list);
  const userById = (id) => getUsers().find((u) => u.id === id) || null;
  const userByEmail = (email) => getUsers().find((u) => u.email === normalizeEmail(email)) || null;

  /* ---- Sesión ---- */
  const getSession = () => {
    const s = read(KEY.session, null);
    if (!s || !s.userId) return null;
    if (!s.expira || Date.now() > s.expira) {
      localStorage.removeItem(KEY.session);
      return null;
    }
    const user = userById(s.userId);
    if (!user) {
      localStorage.removeItem(KEY.session);
      return null;
    }
    return { user: publicUser(user), expira: s.expira };
  };
  const startSession = (userId) => {
    write(KEY.session, { userId, expira: Date.now() + SESSION_MS });
    return getSession();
  };
  const endSession = () => localStorage.removeItem(KEY.session);

  /* ---- Citas ---- */
  const getAppointments = () => read(KEY.appts, []);
  const saveAppointments = (list) => write(KEY.appts, list);
  const appointmentsOf = (userId) => getAppointments()
    .filter((a) => a.userId === userId && a.estado !== "cancelada");

  const createAppointment = (data) => {
    const list = getAppointments();
    const conflict = list.some((a) => a.estado !== "cancelada" && a.fecha === data.fecha && a.hora === data.hora && a.barbero === data.barbero);
    if (conflict) return { ok: false, error: "Ese horario se acaba de ocupar. Elige otro." };
    const cita = { id: uid(), estado: "confirmada", creado: new Date().toISOString(), ...data };
    list.push(cita);
    if (!saveAppointments(list)) return { ok: false, error: "No se pudo guardar la cita en este navegador." };
    return { ok: true, cita };
  };

  const cancelAppointment = (id, userId) => {
    const list = getAppointments().map((a) => (a.id === id && a.userId === userId ? { ...a, estado: "cancelada" } : a));
    saveAppointments(list);
  };

  const takenSlots = (fecha) => getAppointments()
    .filter((a) => a.estado !== "cancelada" && a.fecha === fecha);

  /* ---- Migración desde la versión anterior (shaddai-citas) ---- */
  const getLegacy = () => read(KEY.legacy, []);
  const pendingLegacy = () => getLegacy().length;
  const importLegacy = (userId) => {
    const legacy = getLegacy();
    if (!legacy.length) return 0;
    const list = getAppointments();
    const mapped = legacy
      .filter((c) => c && c.fecha && c.hora && c.servicio)
      .map((c) => ({
        id: uid(),
        userId,
        servicio: c.servicio,
        barbero: c.barbero || "Por asignar",
        fecha: c.fecha,
        hora: c.hora,
        estado: "confirmada",
        creado: new Date().toISOString(),
        origen: "importada"
      }));
    saveAppointments([...list, ...mapped]);
    localStorage.removeItem(KEY.legacy);
    return mapped.length;
  };

  return {
    uid, publicUser, normalizeEmail,
    getUsers, saveUsers, userById, userByEmail,
    getSession, startSession, endSession,
    getAppointments, appointmentsOf, createAppointment, cancelAppointment, takenSlots,
    pendingLegacy, importLegacy
  };
})();
