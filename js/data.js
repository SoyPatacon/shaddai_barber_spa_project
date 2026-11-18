/* ===== Datos del sitio (edita aquí) =====
   Los valores marcados como ilustrativos son de ejemplo: reemplázalos por los reales. */

// Crea en el objeto global `window` una propiedad llamada `SHADDAI` que guarda toda la configuración del sitio.
window.SHADDAI = {
  // Abre el objeto `contacto`, que agrupa los datos de contacto y ubicación de la barbería.
  contacto: {
    // Número de WhatsApp en formato internacional (código de país + número, sin signos); se usa en los enlaces wa.me.
    whatsapp: "573227837126",   // código de país + número, sin signos
    // Correo electrónico público del negocio; se usa en el enlace mailto del pie de contacto.
    correo: "ShaddaiBarber@gmail.com",
    // Dirección física que se muestra como texto en la sección de contacto.
    direccion: "Cl. 4 #15-17 |  Barrio Hacaritama",              // ej.: "Calle 00 # 00-00, Ciudad"
    // Ficha oficial del lugar. Esta URL se copia desde Google Maps › Compartir › Insertar un mapa.
    // URL del iframe de Google Maps con la ubicación exacta; si está vacía se usa `mapa` como respaldo.
    mapaEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248.71683025936494!2d-73.61532524977096!3d4.127669750757571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3e2f006ceb18a1%3A0x793a1233abe05301!2sShaddai%20Barber%20Spa%20%7C%20Hacaritama!5e0!3m2!1ses-419!2sco!4v1793225197545!5m2!1ses-419!2sco",
    // Texto de respaldo (dirección o nombre del lugar) para generar un mapa por búsqueda si no hay `mapaEmbed`.
    mapa: "",                   // respaldo: dirección o nombre si no hay mapaEmbed
    // Ciudad y país que acompañan la dirección mostrada al usuario.
    ciudad: "Villavicencio · Colombia"
  // Cierra el objeto `contacto`.
  },

  // Horario ilustrativo. Clave = día (0 domingo … 6 sábado); [apertura, cierre]; null = cerrado.
  // Objeto que define el horario semanal: cada clave es un día (0 = domingo … 6 = sábado) y su valor son [apertura, cierre] o null si está cerrado.
  horario: { 0: null, 1: ["07:00", "20:00"], 2: ["07:00", "20:00"], 3: ["07:00", "20:00"], 4: ["07:00", "20:00"], 5: ["07:00", "20:00"], 6: ["07:00", "20:00"] },
  // Cantidad de minutos entre un turno y el siguiente; se usa para generar los horarios disponibles.
  intervalo: 60, // minutos entre turnos

  // Lista con los nombres de los barberos disponibles; el usuario elige uno al reservar.
  barberos: ["Yeison Saavedra", "Gustavo Petro"], // ilustrativo: pon los nombres reales

  // precio: null muestra "Por confirmar". Duraciones (min) ilustrativas.
  // Arreglo de categorías; cada categoría agrupa servicios (`items`) que se muestran en el menú.
  categorias: [
    // Primera categoría: agrupa los servicios de corte de cabello.
    { nombre: "Cortes de cabello", items: [
      // Servicio "Corte clásico": id único, nombre visible, descripción, duración en minutos y precio en pesos.
      { id: "corte", nombre: "Corte clásico", desc: "Corte de cabello con lavado, peinado y mascarilla facial.", min: 60, precio: 24000 },
      // Servicio "Corte + cejas": igual que el anterior, pero con más duración y otro precio.
      { id: "corte_cejas", nombre: "Corte + cejas", desc: "Corte de cabello y diseño de cejas con lavado, peinado y mascarilla facial.", min: 65, precio: 26000 }
    // Cierra el arreglo `items` y el objeto de la categoría.
    ]},
    // Segunda categoría: agrupa los servicios de barba.
    { nombre: "Ritual de barba", items: [
      // Servicio "Perfilado de barba" con su descripción, duración y precio.
      { id: "barba", nombre: "Perfilado de barba", desc: "Diseño y acabado a navaja mas exfoliación.", min: 30, precio: 18000 },
      // Servicio de ejemplo (marcado como EJEMPLO) que sirve de plantilla para agregar otro servicio real.
      { id: "exfoliacion", nombre: "EJEMPLO", desc: "(DESCRIPCIÖN DEL SERVICIO).", min: 10, precio: 9999 },
    // Cierra el arreglo `items` y el objeto de la categoría.
    ]},
    // Tercera categoría: agrupa los servicios de manicure.
    { nombre: "Manicure", items: [
      // Servicio "Semipermanente" con su descripción, duración y precio.
      { id: "semi", nombre: "Semipermanente", desc: "Diseño con acabado semipermanente en manos y pies.", min: 80, precio: 80000 },
      // Servicio "Tradicional" con su descripción, duración y precio.
      { id: "tradicional", nombre: "Tradicional", desc: "Diseño con esmalte tradicional en manos y pies.", min: 60, precio: 55000 }
    // Cierra el arreglo `items` y el objeto de la categoría.
    ]}
  // Cierra el arreglo `categorias`.
  ],

  // Galería de trabajos. Reemplaza los archivos manteniendo el nombre y la proporción 4:5.
  // Arreglo con las fotos de trabajos: ruta de la imagen, título, servicio y texto alternativo (accesibilidad).
  trabajos: [
    // Primer trabajo de la galería: imagen, título visible, categoría del servicio y descripción para lectores de pantalla.
    { img: "assets/img/CORTE1.jpg", titulo: "Fade a tijera", servicio: "Corte", alt: "Degradado limpio terminado a tijera en Shaddai Barber Spa" },
    // Segundo trabajo de la galería con sus datos correspondientes.
    { img: "assets/img/CORTE2.jpg", titulo: "Perfilado clásico", servicio: "Barba", alt: "Perfilado de barba a navaja en Shaddai Barber Spa" },
    // Tercer trabajo de la galería con sus datos correspondientes.
    { img: "assets/img/CORTE3.jpg", titulo: "Ritual completo", servicio: "Corte + barba", alt: "Corte y barba terminados en Shaddai Barber Spa" }
  // Cierra el arreglo `trabajos`.
  ]
// Cierra el objeto principal `SHADDAI` y termina la asignación con punto y coma.
};
