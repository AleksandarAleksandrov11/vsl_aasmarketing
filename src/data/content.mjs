// Textos y datos de la landing: todas las cifras (también las de los alt de las
// capturas), testimonios y preguntas frecuentes. Los titulares de sección sin
// cifras están en src/templates/landing.mjs y los textos legales en legal.mjs.
// Cifras: solo las confirmadas (web aasmarketing.com y alt de las capturas).
// Reglas: tuteo, frases cortas, sin guiones largos ni medios y sin emojis.

export const SITE = {
  url: 'https://vsl.aasmarketing.com',
  name: 'AAS Marketing',
  whatsapp: '34695850590',
  whatsappDisplay: '+34 695 850 590',
  email: 'aaswebmarketing@gmail.com',
  instagram: 'https://www.instagram.com/aas_webmarketing/',
  instagramHandle: '@aas_webmarketing',
  reviews: 'https://share.google/XqEnxlBCnqPrfpFHi',
  updated: 'octubre de 2026',
};

export const CTA = 'Quiero mi estrategia gratis';
export const RATING = '5,0 en Google';
export const HEADER_CTA = 'Estrategia gratis';

export const META = {
  title: 'Estrategia gratis para tus redes en 24 h · AAS Marketing',
  description:
    'Analizo tu perfil y en menos de 24 horas te mando gratis la estrategia que seguiría, con los cambios concretos para conseguir más clientes. Sin llamadas y sin compromiso.',
  ogTitle: 'Tu estrategia gratis de redes sociales y Meta Ads en menos de 24 horas',
  ogDescription:
    'Analizo tu perfil y te mando gratis por WhatsApp la estrategia que seguiría para conseguir más clientes. Sin llamadas y sin compromiso.',
};

// Todas las capturas de reels se recortan a 4:5 con el mismo encuadre (`crop`,
// en píxeles del original): fuera queda la franja de abajo con el contador de
// Instagram o TikTok, que la página pone igual en todas, y no hay franjas negras.
// Primer reel de Exoneris: sale en el muro de resultados.
const EXONERIS_REEL = {
  src: 'img/cases/exoneris-primer-video.jpg',
  alt: 'Primer reel de Javier Núñez, de Exoneris Consulting, sobre dónde comprar pisos baratos, con 151 mil visualizaciones',
  crop: { left: 0, top: 60, width: 405, height: 506 },
};

// Cifra exacta de cada captura sacada del alt de index.html del origen. De más a menos visitas.
export const RESULTS = [
  { src: 'img/results/tatuajes-946mil.webp', views: '946 mil', who: 'Estudio de tatuajes', alt: 'Reel de un estudio de tatuajes con 946 mil visualizaciones', crop: { left: 0, top: 200, width: 800, height: 1000 } },
  { src: 'img/results/vdn-performance-406mil.webp', views: '+406 mil', who: 'VDN Performance', alt: 'Reel de VDN Performance sobre los mejores coches por menos de 3.000 euros, con más de 406 mil visualizaciones', crop: { left: 44, top: 0, width: 712, height: 890 } },
  { src: 'img/results/vdn-performance-307mil.webp', views: '306,9 mil', who: 'VDN Performance', alt: 'Reel de VDN Performance sobre los mejores coches por menos de 5.000 euros, con 306,9 mil visualizaciones', crop: { left: 19, top: 0, width: 762, height: 952 } },
  { src: 'img/results/tatuajes-250mil.webp', views: '257 mil', who: 'Estudio de tatuajes', alt: 'Reel de un estudio de tatuajes sobre las zonas que más duelen al tatuarse, con 257 mil visualizaciones', crop: { left: 0, top: 255, width: 800, height: 1000 } },
  { ...EXONERIS_REEL, views: '151 mil', who: 'Exoneris Consulting' },
  { src: 'img/results/wash-go-detailing-110mil.webp', views: '110 mil', who: 'Wash & Go Detailing', alt: 'Reel de presentación de Wash & Go Detailing con 110 mil visualizaciones', crop: { left: 0, top: 200, width: 800, height: 1000 } },
  { src: 'img/results/michel-tobias-80mil.webp', views: '80,3 mil', who: 'Míchel Tobías, psicólogo deportivo', alt: 'Reel de Míchel Tobías, psicólogo deportivo, con 80,3 mil visualizaciones', crop: { left: 0, top: 0, width: 800, height: 1000 } },
  { src: 'img/results/vdn-performance-54mil.webp', views: '53,8 mil', who: 'VDN Performance', alt: 'Reel de VDN Performance con 53,8 mil visualizaciones', crop: { left: 29, top: 0, width: 742, height: 927 } },
  { src: 'img/results/wash-go-detailing-52mil.webp', views: '52,4 mil', who: 'Wash & Go Detailing', alt: 'Reel de Wash & Go Detailing con un Volvo XC40, con 52,4 mil visualizaciones', crop: { left: 0, top: 200, width: 800, height: 1000 } },
  { src: 'img/results/psicologia-gloria-37mil.webp', views: '37,1 mil', who: 'Gloria Díaz, psicóloga', alt: 'Reel de la psicóloga Gloria Díaz con 37,1 mil visualizaciones', crop: { left: 0, top: 100, width: 800, height: 1000 } },
  { src: 'img/results/psicologia-33mil.webp', views: '33,2 mil', who: 'Consulta de psicología', alt: 'Reel de una consulta de psicología con 33,2 mil visualizaciones', crop: { left: 0, top: 267, width: 800, height: 1000 } },
];

export const HERO = {
  // Una línea por elemento: el titular corta siempre igual (sin saltos al cargar la fuente).
  title: ['Más clientes', 'desde tus', 'redes.'],
  sub: 'Grabo, edito y publico tus vídeos y lanzo tus anuncios en Meta.',
  note: 'Gratis, sin compromiso y en menos de 24 horas.',
  trust: [RATING, '+25 cuentas', '+10 M de visitas'], // la primera lleva la estrella
  // Los tres reels con más visitas: el del centro, el de más.
  cards: [RESULTS[1], RESULTS[0], RESULTS[2]],
};

// Banda de cifras en bucle (solo cifras confirmadas: web, casos y capturas).
export const STATS = [
  { value: '+10 M', label: 'visitas en vídeos de clientes' },
  { value: '+2.500', label: 'leads con Meta Ads en 2 meses' },
  { value: '946 mil', label: 'visitas en un solo reel' },
  { value: '+25', label: 'cuentas gestionadas' },
  { value: '+2,5 M', label: 'visitas en menos de 3 meses' },
  { value: '+300', label: 'vídeos editados' },
  { value: '24 h', label: 'para mandarte tu estrategia' },
  { value: '1.058', label: 'seguidores nuevos con un primer vídeo' },
  { value: '+5.000', label: 'seguidores para un solo cliente' },
  { value: '5,0', label: 'en Google', star: true },
];

export const PAINS = [
  'Publicas y no te llegan clientes.',
  'No tienes tiempo para las redes.',
  'Has pagado anuncios que no traían nada.',
];

// Titulares con cifras (los demás titulares de sección están en la plantilla).
export const HEADLINES = {
  results: 'Más de 10 millones de visitas.',
  accounts: 'Más de 25 cuentas confían en nosotros.',
};

export const VDN = {
  title: '2,5 millones de visitas en menos de 3 meses.',
  client: 'VDN Performance',
  sector: 'Reprogramaciones de coches en Madrid',
  logo: 'img/cases/vdn-logo.webp',
  kpis: [
    { value: '+2.500', label: 'leads con Meta Ads en 2 meses' },
    { value: '+5.000', label: 'seguidores entre todas las plataformas' },
  ],
  shots: [
    { src: 'img/cases/vdn-perfil-instagram.webp', alt: 'Perfil de Instagram de VDN Performance con 1.768 seguidores' },
    { src: 'img/cases/vdn-perfil-tiktok.webp', alt: 'Perfil de TikTok de VDN Performance con 3.541 seguidores y 74,2 mil me gusta' },
  ],
};

// Cifras actualizadas con las capturas de octubre de 2026 (estadísticas del
// primer vídeo y perfil): 151.155 reproducciones, 126.433 espectadores,
// 1.058 seguidores nuevos y 1.032 seguidores en la cuenta.
export const EXONERIS = {
  title: 'Su primer vídeo: +1.000 seguidores nuevos.',
  client: 'Javier Núñez',
  sector: 'Exoneris Consulting, subastas y NPL',
  // La foto de su perfil, recortada de la captura.
  avatar: { src: 'img/cases/exoneris-perfil.jpg', crop: { left: 36, top: 22, width: 280, height: 280 } },
  kpis: [
    { value: '151 mil', label: 'visitas' },
    { value: '126 mil', label: 'personas lo vieron' },
    { value: '1.058', label: 'seguidores nuevos' },
  ],
  shots: [
    { src: 'img/cases/exoneris-estadisticas.jpg', alt: 'Estadísticas del primer vídeo: 151.155 reproducciones, 126.433 espectadores, 15 segundos de tiempo medio de reproducción y 1.058 seguidores nuevos' },
  ],
};

// Así trabajo: lo que antes eran "Qué hacemos", "Voy a grabar a tu negocio" y
// "Lo de siempre vs AAS", en cuatro puntos.
export const WORK = [
  { icon: 'camera', title: 'Voy a grabar a tu negocio', text: 'A cualquier parte de España y de Europa.' },
  { icon: 'film', title: 'Edito y publico', text: 'Guiones, gancho en 3 segundos y subtítulos.' },
  { icon: 'target', title: 'Lanzo tus anuncios', text: 'Meta Ads con los leads directos a tu WhatsApp.' },
  { icon: 'chart', title: 'Te lo explico cada mes', text: 'Informe y reunión mensual. Crecimiento real.' },
];

// Nombre, sector y seguidores salen del alt de cada imagen en el origen.
export const ACCOUNTS = [
  ['alex-zsurzs', 'Alex Zsurzs', '', '59,1 mil'],
  ['david-archilla', 'David Archilla', 'nutrición', '19 mil'],
  ['gerard-rehabilitywod', 'Gerard', 'fisioterapeuta en CrossFit', '8.975'],
  ['paula-martinez', 'Paula Martínez', '', '7.772'],
  ['daniel-pueyo', 'Daniel Pueyo', 'entrenador online', '5.784'],
  ['marisa-le-fay', 'Marisa Le Fay', 'tarot y guía del alma', '4.878'],
  ['javier-ruiz-vytalgroup', 'Javier Ruiz', 'fisio y equipos médicos', '4.784'],
  ['pao-guarino', 'Pao Guarino', 'registros akáshicos y tarot', '3.878'],
  ['wash-go-detailing', 'Wash & Go Detailing', '', '3.159'],
  ['logolea', 'LogoLEA', 'logopedia y psicología en Madrid', '2.616'],
  ['maram-psicologia', 'MARAM Psicología', '', '1.777'],
  ['vdn-performance', 'VDN Performance', 'reprogramaciones en Madrid', '1.768'],
  ['carlos-sanchez', 'Carlos Sánchez', 'entrenador online', '1.377'],
  ['creaciones-jmc', 'Creaciones JMC', 'regalos personalizados', '1.368'],
  ['monica-baena', 'Mónica Baena', 'terapeuta en Málaga', '1.267'],
  ['vanessa', 'Vanessa', 'facilitadora de Kundalini', '1.057'],
  ['gloria', 'Gloria Díaz', 'psicóloga', '1.046'],
  ['javier-nunez-exoneris', 'Javier Núñez', 'subastas y NPL', '1.032'],
  ['programa-mujeres-30', 'Programa de entrenamiento para mujeres de más de 30', '', '863'],
  ['psiquekarolina', 'Karolina Cieliczka', 'psicóloga', '790'],
  ['aniitatellootattoo', 'Ana Tello', 'tatuadora en Málaga', '732'],
  ['brandon-palate', 'Brandon', 'nutricionista online', '716'],
  ['laura-dominguez', 'Laura Domínguez Partia', '', '583'],
  ['michel-tobias', 'Míchel Tobías', 'psicólogo deportivo', '543'],
  ['yallah-viajes', 'Yallah Viajes', 'viajes a Marruecos', '148'],
  ['crearte', 'CreArte', 'talleres de personalización', '128'],
].map(([file, name, sector, followers]) => ({ file, name, sector, followers }));

// Copiados tal cual de index.html del origen, en el orden pedido. Al final,
// reseñas de Google genéricas (las de diseño web se dejan fuera a propósito).
export const TESTIMONIALS = [
  { name: 'Adrián López', role: 'Meta Ads', text: 'Después de probar con otras personas para la publicidad de mi negocio, decidí confiar en Aleks para llevar las campañas de Meta Ads. La diferencia ha sido enorme. Me explicó cómo iba a trabajar, fue transparente en todo momento y empezamos a recibir muchos más contactos. Muy profesional y siempre disponible para cualquier duda.' },
  { name: 'Aleks Nikolaev Antonov', role: 'Gestión de redes', text: 'Contraté a Aleks para gestionar nuestras redes sociales porque apenas teníamos tiempo para publicar. En pocas semanas empezamos a tener una imagen mucho más profesional y un contenido mucho más cuidado. Lo que más me gustó es que todo tenía una estrategia detrás y no eran publicaciones hechas por hacer. Muy recomendable.' },
  { name: 'AeroFlex', role: 'Landing + Ads', text: 'Lo que más me gustó fue el trato. Aleks no intenta venderte cosas que no necesitas, sino que busca la mejor solución para tu negocio. Me hizo una landing para captar clientes con anuncios y está funcionando realmente bien. Muy contento con el trabajo.' },
  { name: 'Esther Argibay Martín', role: 'Edición de vídeo', text: 'La edición de vídeo ha sido espectacular. Le envié varias grabaciones que parecían imposibles de aprovechar y consiguió transformarlas en vídeos muy dinámicos para Instagram y TikTok. Los resultados han sido muy buenos y la calidad es muchísimo mejor de lo que esperaba.' },
  { name: 'Adriana Aleksandrova', role: 'Edición de vídeo', text: 'Encargué varios vídeos para Instagram y TikTok y el cambio ha sido enorme. La edición es muy profesional, con subtítulos, buen ritmo y un estilo moderno que engancha mucho más. Sin duda volveré a trabajar con Aleks.' },
  { name: 'Silvia Koeva', role: 'Reseña en Google', text: 'Lo que más valoro de Aleks es la cercanía. No solo hace un buen trabajo, sino que se implica de verdad en que tu proyecto salga adelante. Siempre aporta ideas nuevas, escucha cualquier sugerencia y busca soluciones cuando aparece algún problema. Es difícil encontrar profesionales así.' },
  { name: 'Alex Zsurzs', role: 'Z Solutions · Formación', text: 'Estaba buscando un informático, pero no quería cualquiera, ni mucho menos una empresa donde ser un número más en la cola de sus proyectos. Aleks fue el primero en enseñarme algo real, algo que yo podía ver, y cuadraba exactamente con lo que tenía en la cabeza: mismo estilo y acabado. Después de entrevistar a otros que solo me pasaban presupuestos, sin una imagen, decidí seguir con Aleks por su rapidez al contestar y proponer. El precio nunca fue lo decisivo; me guié por las sensaciones y no me equivoqué. Me presta atención, me escucha, no me presiona cuando me tomo mis tiempos, y cuando vuelvo a aparecer está al 100% como si nada. Siempre voy a recomendar a Aleks en cualquier proyecto: sé que nunca me dejará mal. Destaca muchísimo por su seriedad y su compromiso constante.' },
  { name: 'Cookie Cup', role: 'Web y redes', text: 'Gran profesional y experto en todo lo relacionado con la creación de páginas web y el conocimiento de redes.' },
  { name: 'Mari Trini Cruz', role: 'Reseña en Google', text: 'Profesional que entiende las necesidades del cliente, encuentra soluciones y está siempre disponible.' },
  { name: 'Juan José Sánchez', role: 'Reseña en Google', text: 'Estupendo profesional, muy recomendable y de toda confianza.' },
  { name: 'Miguel C.', role: 'Reseña en Google', text: 'Muy profesional y trabajador. Altamente recomendado para todo tipo de públicos, un 10/10.' },
  { name: 'Comunidad Herederos', role: 'Reseña en Google', text: 'Buen profesional, de confianza y recomendable 100%.' },
];

export const ABOUT = {
  title: 'Soy Aleks.',
  lines: [
    'Llevo las redes y los anuncios de más de 25 cuentas y voy yo a grabar a cada negocio.',
    'Trabajo con un número limitado de plazas para que cada cuenta tenga resultados.',
  ],
};

export const FORM = {
  title: 'Te mando tu estrategia gratis.',
  sub: 'En menos de 24 horas. Plazas limitadas. Sin llamadas y sin compromiso.',
  intro: 'Analizo tu perfil y te mando la estrategia que seguiría, con los cambios concretos para conseguir más clientes.',
  done: 'Analizo tu perfil y te mando la estrategia por WhatsApp en menos de 24 horas.',
};

// `review` marca respuestas redactadas o adaptadas que Aleks debe confirmar.
export const FAQS = [
  { q: '¿De verdad es gratis?', a: 'Sí. Analizo tu perfil y te mando la estrategia sin coste y sin compromiso. Si te sirve y la aplicas tú, perfecto.' },
  { q: '¿Qué recibo exactamente?', a: 'Un análisis de tu perfil y la estrategia que seguiría: qué cambiar en tu perfil, qué vídeos hacer y cómo convertir seguidores en clientes.', review: 'REVISAR: confírmame este contenido' },
  { q: '¿Tengo que hacer una llamada?', a: 'No. Me dejas tus datos, analizo tu perfil y te mando la estrategia por WhatsApp. Si tienes dudas, me escribes.' },
  { q: '¿Tengo que grabar yo los vídeos?', a: 'No. Voy yo a tu negocio a grabar, estés en cualquier parte de España o de Europa, y me encargo de la edición y la publicación. Si prefieres grabar tú, te paso los guiones y te guío para que salga bien a la primera.' },
  { q: '¿Vienes a mi ciudad?', a: 'Sí. Me desplazo por toda España y Europa. Lo vemos cuando te mande la estrategia.', review: 'REVISAR: adaptada a la oferta nueva (antes terminaba en otro paso que ya no existe)' },
  { q: '¿Cuánto cuesta?', a: 'Depende de lo que necesites. Junto con la estrategia te mando un precio cerrado, sin sorpresas.' },
  { q: '¿Hay plazas?', a: 'Trabajo con un número limitado de cuentas a la vez para que cada una tenga resultados. Si ahora no hay hueco, te lo digo al mandarte la estrategia.' },
  { q: '¿Cuándo se notan los resultados con Meta Ads?', a: 'Depende del sector y del presupuesto, pero una campaña bien montada suele traer contactos desde la primera semana. Con VDN Performance superamos los 2.500 leads en 2 meses.' },
  { q: '¿Qué necesito para empezar?', a: 'Con saber a qué te dedicas y tener tu Instagram, tu TikTok o tu web es suficiente. Con eso preparo tu estrategia. Del resto te guío yo paso a paso.', review: 'REVISAR: adaptada de la respuesta de la web a la oferta nueva' },
];

export const CLOSING = {
  title: 'Tus redes pueden traerte clientes.',
  sub: 'Estrategia gratis. Precio cerrado si quieres que la ejecute yo.',
};

export const FOOTER = {
  about: 'Redes sociales y Meta Ads para negocios. Grabo en tu negocio, edito, publico y lanzo tus anuncios.',
  services: ['Gestión de redes sociales', 'Meta Ads', 'Grabación en tu negocio', 'Edición de vídeo'],
  area: 'Grabo en toda España y Europa',
};
