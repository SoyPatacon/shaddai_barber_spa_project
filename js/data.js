/* ===== Datos del sitio (edita aquí) =====
   Los valores marcados como ilustrativos son de ejemplo: reemplázalos por los reales. */
window.SHADDAI = {
  contacto: {
    whatsapp: "573000000000",   // código de país + número, sin signos
    correo: "",
    direccion: "",              // ej.: "Calle 00 # 00-00, Ciudad"
    mapa: "",                   // misma dirección o nombre del lugar para Google Maps
    ciudad: "Bogotá · Colombia"
  },

  // Horario ilustrativo. Clave = día (0 domingo … 6 sábado); [apertura, cierre]; null = cerrado.
  horario: { 0: null, 1: ["09:00", "19:00"], 2: ["09:00", "19:00"], 3: ["09:00", "19:00"], 4: ["09:00", "19:00"], 5: ["09:00", "19:00"], 6: ["09:00", "17:00"] },
  intervalo: 30, // minutos entre turnos

  barberos: ["Barbero 1", "Barbero 2"], // ilustrativo: pon los nombres reales

  // precio: null muestra "Por confirmar". Duraciones (min) ilustrativas.
  categorias: [
    { nombre: "Corte y estilo", items: [
      { id: "corte", nombre: "Corte clásico", desc: "Tijera y máquina, con lavado y peinado final.", min: 40, precio: null },
      { id: "degradado", nombre: "Degradado", desc: "Transición limpia a la altura que prefieras.", min: 45, precio: null }
    ]},
    { nombre: "Barba y ritual", items: [
      { id: "barba", nombre: "Perfilado de barba", desc: "Diseño, aceites y acabado a navaja.", min: 30, precio: null },
      { id: "afeitado", nombre: "Afeitado con toalla caliente", desc: "Vapor, espuma y navaja, sin prisa.", min: 40, precio: null },
      { id: "ritual", nombre: "Ritual Shaddai", desc: "Corte, barba y facial en una sola visita.", min: 90, precio: null }
    ]},
    { nombre: "Cuidado facial", items: [
      { id: "facial", nombre: "Limpieza facial", desc: "Exfoliación y mascarilla para una piel tranquila.", min: 40, precio: null },
      { id: "cejas", nombre: "Cejas y contorno", desc: "Definición suave y natural.", min: 15, precio: null }
    ]}
  ],

  // Galería de trabajos. Reemplaza los archivos manteniendo el nombre y la proporción 4:5.
  trabajos: [
    { img: "assets/img/CORTE1.jpg", titulo: "Fade a tijera", servicio: "Corte", alt: "Degradado limpio terminado a tijera en Shaddai Barber Spa" },
    { img: "assets/img/CORTE2.jpg", titulo: "Perfilado clásico", servicio: "Barba", alt: "Perfilado de barba a navaja en Shaddai Barber Spa" },
    { img: "assets/img/CORTE3.jpg", titulo: "Ritual completo", servicio: "Corte + barba", alt: "Corte y barba terminados en Shaddai Barber Spa" }
  ]
};
