/* ===== Datos del sitio (edita aquí) =====
   Los valores marcados como ilustrativos son de ejemplo: reemplázalos por los reales. */
window.SHADDAI = {
  contacto: {
    whatsapp: "573227837126",   // código de país + número, sin signos
    correo: "ShaddaiBarber@gmail.com",
    direccion: "Cl. 4 #15-17 |  Barrio Hacaritama",              // ej.: "Calle 00 # 00-00, Ciudad"
    // Ficha oficial del lugar. Esta URL se copia desde Google Maps › Compartir › Insertar un mapa.
    mapaEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248.71683025936494!2d-73.61532524977096!3d4.127669750757571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3e2f006ceb18a1%3A0x793a1233abe05301!2sShaddai%20Barber%20Spa%20%7C%20Hacaritama!5e0!3m2!1ses-419!2sco!4v1793225197545!5m2!1ses-419!2sco",
    mapa: "",                   // respaldo: dirección o nombre si no hay mapaEmbed
    ciudad: "Villavicencio · Colombia"
  },

  // Horario ilustrativo. Clave = día (0 domingo … 6 sábado); [apertura, cierre]; null = cerrado.
  horario: { 0: null, 1: ["07:00", "20:00"], 2: ["07:00", "20:00"], 3: ["07:00", "20:00"], 4: ["07:00", "20:00"], 5: ["07:00", "20:00"], 6: ["07:00", "20:00"] },
  intervalo: 60, // minutos entre turnos

  barberos: ["Yeison Saavedra", "Gustavo Petro"], // ilustrativo: pon los nombres reales

  // precio: null muestra "Por confirmar". Duraciones (min) ilustrativas.
  categorias: [
    { nombre: "Cortes de cabello", items: [
      { id: "corte", nombre: "Corte clásico", desc: "Corte de cabello con lavado, peinado y mascarilla facial.", min: 60, precio: 24000 },
      { id: "corte_cejas", nombre: "Corte + cejas", desc: "Corte de cabello y diseño de cejas con lavado, peinado y mascarilla facial.", min: 65, precio: 26000 }
    ]},
    { nombre: "Ritual de barba", items: [
      { id: "barba", nombre: "Perfilado de barba", desc: "Diseño y acabado a navaja mas exfoliación.", min: 30, precio: 18000 },
      { id: "exfoliacion", nombre: "EJEMPLO", desc: "(DESCRIPCIÖN DEL SERVICIO).", min: 10, precio: 9999 },
    ]},
    { nombre: "Manicure", items: [
      { id: "semi", nombre: "Semipermanente", desc: "Diseño con acabado semipermanente en manos y pies.", min: 80, precio: 80000 },
      { id: "tradicional", nombre: "Tradicional", desc: "Diseño con esmalte tradicional en manos y pies.", min: 60, precio: 55000 }
    ]}
  ],

  // Galería de trabajos. Reemplaza los archivos manteniendo el nombre y la proporción 4:5.
  trabajos: [
    { img: "assets/img/CORTE1.jpg", titulo: "Fade a tijera", servicio: "Corte", alt: "Degradado limpio terminado a tijera en Shaddai Barber Spa" },
    { img: "assets/img/CORTE2.jpg", titulo: "Perfilado clásico", servicio: "Barba", alt: "Perfilado de barba a navaja en Shaddai Barber Spa" },
    { img: "assets/img/CORTE3.jpg", titulo: "Ritual completo", servicio: "Corte + barba", alt: "Corte y barba terminados en Shaddai Barber Spa" }
  ]
};
