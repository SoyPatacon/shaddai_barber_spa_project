/* ===== Capa de datos =====
   Hoy todo vive en localStorage (solo este navegador). La idea es que estas
   mismas funciones se reemplacen por Supabase más adelante sin tocar las pantallas. */

// Crea en `window` un objeto `Store` calculado con una función autoejecutable (IIFE): el resultado se guarda y las variables internas quedan privadas.
window.Store = (() => {
  // Objeto con las claves (nombres) que se usan para guardar cada tipo de dato en localStorage.
  const KEY = {
    // Clave donde se guarda el arreglo de usuarios registrados.
    users: "shaddai:users",
    // Clave donde se guarda la sesión activa (usuario y fecha de expiración).
    session: "shaddai:session",
    // Clave donde se guarda el arreglo de citas.
    appts: "shaddai:appointments",
    // Clave de la versión anterior del sitio, usada solo para migrar citas antiguas.
    legacy: "shaddai-citas"
  // Cierra el objeto KEY.
  };
  // Duración de la sesión en milisegundos: 30 días × 24 horas × 60 minutos × 60 segundos × 1000 ms.
  const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

  // Función auxiliar que lee una clave de localStorage, la convierte de JSON a objeto y devuelve `fallback` si algo falla.
  const read = (key, fallback) => {
    // Abre un bloque `try` para capturar errores de lectura o de JSON inválido.
    try {
      // Obtiene el texto guardado en localStorage para esa clave (o null si no existe).
      const raw = localStorage.getItem(key);
      // Si hay contenido lo convierte con JSON.parse; si no, devuelve el valor por defecto.
      return raw ? JSON.parse(raw) : fallback;
    // Bloque `catch` sin variable: se ejecuta si localStorage no está disponible o el JSON está corrupto.
    } catch {
      // Devuelve el valor por defecto para que la app no se rompa.
      return fallback;
    // Cierra el bloque catch.
    }
  // Cierra la función read.
  };
  // Función auxiliar que convierte un valor a JSON y lo guarda en localStorage; devuelve true si tuvo éxito.
  const write = (key, value) => {
    // Abre el bloque `try` para capturar errores de escritura (por ejemplo, almacenamiento lleno o bloqueado).
    try {
      // Guarda el valor serializado como texto JSON bajo la clave indicada.
      localStorage.setItem(key, JSON.stringify(value));
      // Devuelve true para avisar que el guardado funcionó.
      return true;
    // Captura cualquier error de almacenamiento.
    } catch {
      // Devuelve false para que quien llama sepa que no se pudo guardar.
      return false;
    // Cierra el bloque catch.
    }
  // Cierra la función write.
  };
  // Genera un identificador único para usuarios y citas.
  const uid = () => {
    // Si el navegador soporta `crypto.randomUUID`, lo usa porque genera un UUID seguro y único.
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    // Respaldo: combina la fecha actual en base 36 con un fragmento aleatorio para reducir colisiones.
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  // Cierra la función uid.
  };
  // Normaliza un correo: lo convierte a texto, quita espacios de los extremos y lo pasa a minúsculas.
  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
  // Devuelve solo los datos públicos del usuario (sin contraseña ni salt) o el valor falsy recibido.
  const publicUser = (u) => u && ({ id: u.id, nombre: u.nombre, email: u.email, telefono: u.telefono, creado: u.creado });

  /* ---- Usuarios ---- */
  // Lee la lista completa de usuarios; si no existe, devuelve un arreglo vacío.
  const getUsers = () => read(KEY.users, []);
  // Guarda la lista completa de usuarios en localStorage y devuelve true/false según el resultado.
  const saveUsers = (list) => write(KEY.users, list);
  // Busca un usuario por su id y devuelve el objeto encontrado o null si no existe.
  const userById = (id) => getUsers().find((u) => u.id === id) || null;
  // Busca un usuario por correo (normalizado) y devuelve el objeto encontrado o null.
  const userByEmail = (email) => getUsers().find((u) => u.email === normalizeEmail(email)) || null;

  /* ---- Sesión ---- */
  // Obtiene la sesión activa validando que exista, que no haya expirado y que el usuario siga registrado.
  const getSession = () => {
    // Lee el objeto de sesión guardado; null si no hay ninguno.
    const s = read(KEY.session, null);
    // Si no hay sesión o le falta el userId, no hay sesión válida.
    if (!s || !s.userId) return null;
    // Comprueba si falta la fecha de expiración o si ya pasó la fecha actual.
    if (!s.expira || Date.now() > s.expira) {
      // Borra la sesión caducada de localStorage.
      localStorage.removeItem(KEY.session);
      // Devuelve null porque la sesión ya no es válida.
      return null;
    // Cierra la comprobación de expiración.
    }
    // Busca al usuario dueño de la sesión para confirmar que todavía existe.
    const user = userById(s.userId);
    // Si el usuario fue eliminado, la sesión deja de ser válida.
    if (!user) {
      // Borra la sesión huérfana de localStorage.
      localStorage.removeItem(KEY.session);
      // Devuelve null porque no hay usuario asociado.
      return null;
    // Cierra la comprobación del usuario.
    }
    // Devuelve los datos públicos del usuario junto con la fecha de expiración de la sesión.
    return { user: publicUser(user), expira: s.expira };
  // Cierra la función getSession.
  };
  // Inicia una sesión nueva para el usuario indicado, guardando su id y una fecha de expiración.
  const startSession = (userId) => {
    // Escribe en localStorage el id del usuario y la fecha actual más la duración de la sesión.
    write(KEY.session, { userId, expira: Date.now() + SESSION_MS });
    // Devuelve la sesión ya validada (o null si el guardado falló).
    return getSession();
  // Cierra la función startSession.
  };
  // Cierra la sesión activa eliminando su clave de localStorage.
  const endSession = () => localStorage.removeItem(KEY.session);

  /* ---- Citas ---- */
  // Lee todas las citas guardadas; si no hay, devuelve un arreglo vacío.
  const getAppointments = () => read(KEY.appts, []);
  // Guarda el arreglo completo de citas en localStorage.
  const saveAppointments = (list) => write(KEY.appts, list);
  // Devuelve solo las citas del usuario indicado que no estén canceladas.
  const appointmentsOf = (userId) => getAppointments()
    // Filtra por dueño de la cita y descarta las que tienen estado "cancelada".
    .filter((a) => a.userId === userId && a.estado !== "cancelada");

  // Crea una cita nueva después de comprobar que el horario y el barbero estén libres.
  const createAppointment = (data) => {
    // Obtiene la lista actual de citas para revisar conflictos y luego agregar la nueva.
    const list = getAppointments();
    // `some` devuelve true si ya existe una cita no cancelada en la misma fecha, hora y con el mismo barbero.
    const conflict = list.some((a) => a.estado !== "cancelada" && a.fecha === data.fecha && a.hora === data.hora && a.barbero === data.barbero);
    // Si hay conflicto, corta la función y devuelve un error explicativo.
    if (conflict) return { ok: false, error: "Ese horario se acaba de ocupar. Elige otro." };
    // Construye la cita con id único, estado confirmado, fecha de creación y los datos recibidos (que pueden sobrescribir esos campos).
    const cita = { id: uid(), estado: "confirmada", creado: new Date().toISOString(), ...data };
    // Agrega la cita nueva al final del arreglo en memoria.
    list.push(cita);
    // Intenta guardar; si falla, devuelve un error sin confirmar la cita.
    if (!saveAppointments(list)) return { ok: false, error: "No se pudo guardar la cita en este navegador." };
    // Devuelve éxito junto con la cita creada.
    return { ok: true, cita };
  // Cierra la función createAppointment.
  };

  // Cancela una cita solo si pertenece al usuario indicado, cambiando su estado a "cancelada".
  const cancelAppointment = (id, userId) => {
    // Recorre todas las citas y reemplaza la que coincide en id y dueño por una copia con estado "cancelada"; las demás quedan igual.
    const list = getAppointments().map((a) => (a.id === id && a.userId === userId ? { ...a, estado: "cancelada" } : a));
    // Guarda la lista actualizada en localStorage.
    saveAppointments(list);
  // Cierra la función cancelAppointment.
  };

  // Devuelve las citas no canceladas de una fecha concreta (se usan para saber qué horas están ocupadas).
  const takenSlots = (fecha) => getAppointments()
    // Filtra por estado distinto de "cancelada" y por la fecha solicitada.
    .filter((a) => a.estado !== "cancelada" && a.fecha === fecha);

  /* ---- Migración desde la versión anterior (shaddai-citas) ---- */
  // Lee las citas de la versión anterior del sitio desde su propia clave de localStorage.
  const getLegacy = () => read(KEY.legacy, []);
  // Devuelve cuántas citas antiguas quedan pendientes por importar.
  const pendingLegacy = () => getLegacy().length;
  // Importa las citas antiguas al usuario indicado y devuelve cuántas se importaron.
  const importLegacy = (userId) => {
    // Obtiene el arreglo de citas antiguas.
    const legacy = getLegacy();
    // Si no hay citas antiguas, termina y devuelve 0.
    if (!legacy.length) return 0;
    // Obtiene las citas actuales para conservarlas junto a las importadas.
    const list = getAppointments();
    // Prepara las citas antiguas: filtra las inválidas y transforma cada una al formato nuevo.
    const mapped = legacy
      // Descarta registros sin fecha, hora o servicio, porque no se pueden agendar.
      .filter((c) => c && c.fecha && c.hora && c.servicio)
      // Convierte cada cita antigua en una cita nueva con los campos que espera la app.
      .map((c) => ({
        // Genera un id nuevo para la cita importada.
        id: uid(),
        // Asigna la cita al usuario que está haciendo la importación.
        userId,
        // Copia el servicio de la cita antigua.
        servicio: c.servicio,
        // Copia el barbero o usa "Por asignar" si no venía informado.
        barbero: c.barbero || "Por asignar",
        // Copia la fecha de la cita antigua.
        fecha: c.fecha,
        // Copia la hora de la cita antigua.
        hora: c.hora,
        // Marca la cita como confirmada.
        estado: "confirmada",
        // Guarda la fecha y hora actual en formato ISO como momento de creación.
        creado: new Date().toISOString(),
        // Marca el origen para saber que vino de la migración.
        origen: "importada"
      // Cierra el objeto de cada cita mapeada.
      }));
    // Guarda la lista actual más las citas importadas.
    saveAppointments([...list, ...mapped]);
    // Elimina la clave antigua para no volver a importar las mismas citas.
    localStorage.removeItem(KEY.legacy);
    // Devuelve cuántas citas se importaron.
    return mapped.length;
  // Cierra la función importLegacy.
  };

  // Devuelve el objeto público de Store con todas las funciones que las pantallas pueden usar.
  return {
    // Utilidades generales: id único, datos públicos del usuario y normalización de correo.
    uid, publicUser, normalizeEmail,
    // Funciones de usuarios: leer, guardar y buscar por id o correo.
    getUsers, saveUsers, userById, userByEmail,
    // Funciones de sesión: obtener, iniciar y cerrar.
    getSession, startSession, endSession,
    // Funciones de citas: leer, listar por usuario, crear, cancelar y consultar horas ocupadas.
    getAppointments, appointmentsOf, createAppointment, cancelAppointment, takenSlots,
    // Funciones de migración: contar e importar citas de la versión anterior.
    pendingLegacy, importLegacy
  // Cierra el objeto que se devuelve.
  };
// Cierra la IIFE y la asignación a window.Store.
})();
