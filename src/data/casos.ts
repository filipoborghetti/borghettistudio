export interface Caso {
  slug: string;
  nombre: string;
  tag: string;
  descripcion: string;
  instagram: string;
  spotify: string;
  seguidores: string;
  oyentes: string;
  screenshot: string;
  video: string;
  urlWeb: string;
  urlCaso: string;
  desafio?: string;
  solucion?: string;
  servicios?: string[];
  cliente?: string;
  ano?: string;
  lighthouse?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

export const casos: Caso[] = [
  {
    slug: "one-flyt",
    nombre: "One Flyt",
    tag: "Artista urbano independiente",
    descripcion:
      "One Flyt es un artista de trap melódico y reggaetón alternativo de Villa Devoto, Buenos Aires. Diseñamos y desarrollamos su sitio web oficial para centralizar su presencia digital y acompañar el lanzamiento de su primer álbum.",
    instagram: "https://instagram.com/oneflyt1",
    spotify: "https://open.spotify.com/intl-es/artist/2DB4gqzMQy1kvcHWgrNUgp",
    seguidores: "+30K",
    oyentes: "+190K",
    screenshot: "/images/casos/one-flyt/screenshot.png",
    video: "/images/casos/one-flyt/scroll.mp4",
    urlWeb: "https://oneflyt.vercel.app",
    urlCaso: "/portafolio/one-flyt",
    desafio: "One Flyt estaba creciendo en plataformas como Spotify e Instagram, pero no tenía un espacio propio donde centralizar su música, fechas de shows y biografía. Su presencia digital estaba dispersa entre múltiples plataformas y necesitaba una web que transmitiera su identidad visual oscura y urbana, funcionara bien en mobile y fuera fácil de actualizar sin depender de un desarrollador.",
    solucion: "Desarrollamos un sitio estático con Astro que carga casi instantáneamente, con un diseño oscuro que refleja la estética del artista. Integramos Sanity CMS para que One Flyt pueda actualizar su biografía, lanzamientos y fechas de shows de forma autónoma. Cada fecha del tour tiene su propia página con información detallada y link de compra de entradas.",
    servicios: ["Diseño UI", "Desarrollo con Astro", "Integración con Sanity CMS", "Despliegue en Vercel"],
    cliente: "One Flyt",
    ano: "2026",
    lighthouse: {
      performance: 96,
      accessibility: 95,
      bestPractices: 98,
      seo: 95,
    },
  },
];