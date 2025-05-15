import React from "react";
import { motion } from "framer-motion"; // Temporarily commented out
import Logo from "../icons/logo.tsx";
import Instagram from "../icons/instagram.tsx";

const Footer = () => {
  // Animation variants (temporarily unused)
  // const containerVariants = {
  //   hidden: { opacity: 0 },
  //   visible: {
  //     opacity: 1,
  //     transition: {
  //       staggerChildren: 0.1,
  //     },
  //   },
  // };

  // const itemVariants = {
  //   hidden: { y: 20, opacity: 0 },
  //   visible: { y: 0, opacity: 1 },
  // };

  return (
    <footer className="bg-primary-300 pt-20 pb-16 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-primary-100 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary-100 translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        {/* Replaced motion.div with div */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10"
          // initial="hidden" // Temporarily removed
          // whileInView="visible" // Temporarily removed
          // viewport={{ once: true, margin: "-100px" }} // Temporarily removed
          // variants={containerVariants} // Temporarily removed
        >
          {/* Column 1 - Logo and Description */}
          {/* Replaced motion.div with div */}
          <div className="flex flex-col space-y-6">
            <div className="mb-4 transform hover:scale-105 transition-transform">
              <Logo />
            </div>
            <p className="text-text-gray-200 font-jost text-base leading-relaxed">
              Réalisation sur mesure : Placard, dressing, bibliothèque, sous-pente,
              commode, bureau, structure de lit, chevet, dessous d'escalier,
              portes coulissantes, séparation de pièces ...
            </p>
            <div className="flex space-x-4 items-center mt-6">
              <a
                href="https://www.instagram.com/dmplacards/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-100 hover:text-primary-200 transition-all transform hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram />
              </a>
            </div>
          </div>

          {/* Column 2 - Pages */}
          {/* Replaced motion.div with div */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-primary-200 font-dm text-2xl relative after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary-100 after:mt-2">
              Pages
            </h3>
            <ul className="space-y-4">
              {[
                { href: "/", label: "Accueil" },
                { href: "/about", label: "À Propos" },
                { href: "/services", label: "Services" },
                { href: "/contact", label: "Nous Contacter" },
              ].map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-text-gray-200 hover:text-primary-100 transition-all block py-1 relative overflow-hidden group"
                  >
                    <span className="relative z-10 inline-block group-hover:translate-x-2 transition-transform">
                      {link.label}
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-100 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Services */}
          {/* Replaced motion.div with div */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-primary-200 font-dm text-2xl relative after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary-100 after:mt-2">
              Services
            </h3>
            <ul className="space-y-4">
              {[
                "Dressings",
                "Sous pente",
                "Sous escalier",
                "Chambre",
              ].map((service, index) => (
                <li key={index} className="text-text-gray-200 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-100 mr-2"></span>
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact */}
          {/* Replaced motion.div with div */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-primary-200 font-dm text-2xl relative after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary-100 after:mt-2">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="text-text-gray-200 flex items-start">
                <svg 
                  className="w-5 h-5 mt-1 mr-3 flex-shrink-0 text-primary-100"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>
                  15 Rue André Citroën lot 15, 78140 Vélizy-Villacoublay
                  <span className="block mt-1 text-sm opacity-75">SIRET - 421 678 822</span>
                </span>
              </li>
              <li>
                <a href="mailto:dm.placards@wanadoo.fr" className="text-text-gray-200 hover:text-primary-100 transition-all flex items-center group">
                  <svg 
                    className="w-5 h-5 mr-3 text-primary-100 group-hover:scale-110 transition-transform"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  dm.placards@wanadoo.fr
                </a>
              </li>
              <li>
                <a href="tel:0134653570" className="text-text-gray-200 hover:text-primary-100 transition-all flex items-center group">
                  <svg 
                    className="w-5 h-5 mr-3 text-primary-100 group-hover:scale-110 transition-transform"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  01 34 65 35 70
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to action banner */}
      <div className="mt-16 bg-primary-200 py-8 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-white font-jost text-lg md:text-xl">
              Vous avez un projet d'aménagement sur mesure ?
            </p>
            <a 
              href="/contact" 
              className="bg-primary-100 hover:bg-opacity-90 text-white px-8 py-3 rounded-full font-jost transition-all transform hover:scale-105"
            >
              Contactez-nous
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
