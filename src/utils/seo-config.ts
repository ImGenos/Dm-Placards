// SEO Configuration migrated from Yoast SEO WordPress settings
// Based on previous site configuration at dm-placards.com

export const seoConfig = {
  // Site Information
  siteName: "DM Placards",
  siteUrl: "https://dm-placards.com",
  defaultTitle: "DM Placards - Magasin Lot N°15 - C.C L'usine MODE & MAISON Velizy Villacoublay",
  titleSeparator: "—", // Yoast separator: "sc-dash"
  
  // Company Information
  company: {
    name: "DM Placards",
    legalName: "DM Placards Magasin Lot N°15 - C.C L'usine MODE & MAISON Velizy Villacoublay",
    logo: "/logo.png",
    type: "LocalBusiness",
  },

  // Contact Information
  contact: {
    phone: "0134653570",
    address: {
      streetAddress: "Lot N°15 - C.C L'usine MODE & MAISON",
      addressLocality: "Velizy Villacoublay",
      addressRegion: "Île-de-France",
      postalCode: "78140",
      addressCountry: "FR"
    }
  },

  // Social Media
  social: {
    instagram: "https://www.instagram.com/dmplacards/?hl=fr",
  },

  // Default Meta Tags
  defaultMeta: {
    description: "Spécialiste du rangement sur mesure : placards, dressings, bibliothèques, bureaux. 27 ans d'expérience à Vélizy-Villacoublay.",
    keywords: [
      "placard sur mesure",
      "dressing",
      "bibliothèque",
      "rangement",
      "aménagement intérieur",
      "Vélizy-Villacoublay",
      "DM Placards"
    ],
  },

  // Open Graph Defaults
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "DM Placards",
    images: {
      default: "/logo.png",
    }
  },

  // Twitter Card
  twitter: {
    cardType: "summary_large_image",
  },

  // Verification Codes (from Yoast)
  verification: {
    google: "AIzaSyAdqASr8CpCOmtjy4S3mmuOW3Naosg79kk",
    msvalidate: "79d9d1a5ac424991873b9d1a3311d7a0",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: "DM Placards — Rangements sur mesure à Vélizy-Villacoublay",
    description: "Spécialiste du rangement sur mesure depuis 27 ans : placards, dressings, bibliothèques, bureaux. Showroom à Vélizy-Villacoublay. Devis gratuit.",
    keywords: ["placard sur mesure", "dressing", "bibliothèque", "rangement", "Vélizy"],
  },
  services: {
    title: "Services — DM Placards",
    description: "Découvrez nos services : conception 3D, fabrication sur mesure, installation professionnelle. Plan de projet, travaux intérieurs, réalisation.",
    keywords: ["services rangement", "conception 3D", "installation placard", "aménagement"],
  },
  galerie: {
    title: "Galerie — Nos Réalisations — DM Placards",
    description: "Découvrez nos réalisations : dressings, bibliothèques, placards sous-pente. Photos de nos projets sur mesure.",
    keywords: ["galerie", "réalisations", "photos dressing", "exemples placards"],
  },
  "galerie-bibliotheque": {
    title: "Bibliothèques sur mesure — Galerie — DM Placards",
    description: "Découvrez nos bibliothèques sur mesure : rangement stylé pour vos livres et objets déco. Photos et exemples de réalisations.",
    keywords: ["bibliothèque sur mesure", "meuble bibliothèque", "rangement livres"],
  },
  "galerie-dressing": {
    title: "Dressings sur mesure — Galerie — DM Placards",
    description: "Nos dressings sur mesure : optimisation de l'espace avec rangements personnalisés. Photos de nos réalisations.",
    keywords: ["dressing sur mesure", "aménagement dressing", "rangement vêtements"],
  },
  "galerie-sous-pentes": {
    title: "Placards sous-pente — Galerie — DM Placards",
    description: "Optimisez vos combles avec nos placards sous-pente sur mesure. Photos et exemples d'aménagements.",
    keywords: ["placard sous-pente", "aménagement combles", "rangement sous toit"],
  },
  magasin: {
    title: "Le Magasin — Expositions — DM Placards",
    description: "Visitez notre showroom à Vélizy : expositions d'armoires, bureaux, dressings. Large choix de matériaux et finitions.",
    keywords: ["magasin", "showroom", "exposition", "Vélizy-Villacoublay"],
  },
  contact: {
    title: "Nous Contacter — Devis Gratuit — DM Placards",
    description: "Contactez-nous pour votre projet de rangement sur mesure. Devis gratuit. Tél : 01 34 65 35 70. Showroom à Vélizy-Villacoublay.",
    keywords: ["contact", "devis gratuit", "téléphone", "rendez-vous"],
  },
  privacy: {
    title: "Politique de Confidentialité — DM Placards",
    description: "Politique de confidentialité et protection des données personnelles de DM Placards.",
    keywords: ["confidentialité", "RGPD", "données personnelles"],
  },
};

// Helper function to generate full page title
export function getPageTitle(pageKey: keyof typeof pageSEO): string {
  const page = pageSEO[pageKey];
  return page?.title || `${seoConfig.defaultTitle}`;
}

// Helper function to generate meta description
export function getPageDescription(pageKey: keyof typeof pageSEO): string {
  const page = pageSEO[pageKey];
  return page?.description || seoConfig.defaultMeta.description;
}

// Helper function to generate keywords
export function getPageKeywords(pageKey: keyof typeof pageSEO): string {
  const page = pageSEO[pageKey];
  const keywords = page?.keywords || seoConfig.defaultMeta.keywords;
  return keywords.join(", ");
}

// Generate canonical URL
export function getCanonicalURL(path: string): string {
  return `${seoConfig.siteUrl}${path}`;
}

// Generate structured data for Organization
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": seoConfig.company.name,
    "legalName": seoConfig.company.legalName,
    "url": seoConfig.siteUrl,
    "logo": `${seoConfig.siteUrl}${seoConfig.company.logo}`,
    "telephone": seoConfig.contact.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": seoConfig.contact.address.streetAddress,
      "addressLocality": seoConfig.contact.address.addressLocality,
      "addressRegion": seoConfig.contact.address.addressRegion,
      "postalCode": seoConfig.contact.address.postalCode,
      "addressCountry": seoConfig.contact.address.addressCountry
    },
    "sameAs": [
      seoConfig.social.instagram
    ]
  };
}
