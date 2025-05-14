import React from "react";
import Instagram from "../icons/instagram.tsx";
import Logo from "../icons/logo.tsx";

const Footer = () => {
  return (
    <footer className="bg-primary-300 pt-16 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 - Logo and Description */}
          <div className="flex flex-col space-y-6">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-primary-200 font-jost">
              Réalisation sur mesure : Placard, dressing, bibliothèque, sous-pente, 
              commode, bureau, structure de lit, chevet, dessous d'escalier, 
              portes coulissantes, séparation de pièces ...
            </p>
            <div className="flex space-x-4 items-center mt-4">
              <a href="https://www.instagram.com/dmplacards/" target="_blank" rel="noopener noreferrer" className="text-primary-100 hover:text-primary-200 transition-all">
                <Instagram />
              </a>
              {/* Add more social icons here if needed */}
            </div>
          </div>

          {/* Column 2 - Pages */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-primary-200 font-dm text-2xl">Pages</h3>
            <ul className="space-y-4">
              <li>
                <a href="/about" className="text-primary-200 hover:text-primary-100 transition-all">
                  À Propos
                </a>
              </li>
              <li>
                <a href="/services" className="text-primary-200 hover:text-primary-100 transition-all">
                  Services
                </a>
              </li>
              <li>
                <a href="/contact" className="text-primary-200 hover:text-primary-100 transition-all">
                  Nous Contacter
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 - Services */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-primary-200 font-dm text-2xl">Services</h3>
            <ul className="space-y-4">
              <li className="text-primary-200">Dressings</li>
              <li className="text-primary-200">Sous pente</li>
              <li className="text-primary-200">Sous escalier</li>
              <li className="text-primary-200">Chambre</li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-primary-200 font-dm text-2xl">Contact</h3>
            <ul className="space-y-4">
              <li className="text-primary-200">
                15 Rue André Citroën lot 15, 78140 Vélizy-Villacoublay 
                <br />SIRET - 421 678 822
              </li>
              <li>
                <a href="mailto:dm.placards@wanadoo.fr" className="text-primary-200 hover:text-primary-100 transition-all">
                dm.placards@wanadoo.fr
                </a>
              </li>
              <li>
                <a href="tel:0134653570" className="text-primary-200 hover:text-primary-100 transition-all">
                01 34 65 35 70
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;