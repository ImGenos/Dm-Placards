import Facebook from "../icons/facebook.tsx";
import Instagram from "../icons/instagram.tsx";
import LinkedIn from "../icons/linkedin.tsx";
import Logo from "../icons/logo.tsx";
import Twitter from "../icons/twitter.tsx";

const Footer = () => {
  return (
    <footer className="mt-[135px] w-full bg-white">
      <div className="w-full max-w-[1300px] px-12 xl:px-0 mx-auto pb-[135px] grid grid-cols-1 lg:grid-cols-5 md:grid-cols-2 gap-6">
        {/* start */}
        <div className="col-span-1 md:col-span-2">
          <a href="/" className="">
            <Logo />
          </a>
          <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray pt-[18px] pb-[33px] max-w-[400px]">
            Réalisation sur mesure : Placard, dressing, bibliothèque, sous-pente, commode, bureau, structure de lit, chevet, dessous d’escalier, portes coulissantes, séparation de pièces ...          </p>
          <div className="flex gap-5 md:gap-[54px]">
            <a href="/">
              <Facebook />
            </a>
            <a href="/">
              <Twitter />
            </a>
            <a href="/">
              <LinkedIn />
            </a>
            <a href="/">
              <Instagram />
            </a>
          </div>
        </div>
        <div className="col-span-1 flex flex-col gap-4">
          <h5 className="text-primary-200 font-dm text-[22px] lg:text-[25px] leading-loose">
            Pages
          </h5>
          <div className="flex flex-col gap-6">
            <a
              href="/about"
              className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray"
            >
              À Propos
            </a>
            <a
              href="/services"
              className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray"
            >
              Services
            </a>
            <a
              href="/contact"
              className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray"
            >
              Nous Contacter
            </a>
          </div>
        </div>
        <div className="col-span-1 flex flex-col gap-4">
          <h5 className="text-primary-200 font-dm text-[22px] lg:text-[25px] leading-loose">
            Services
          </h5>
          <div className="flex flex-col gap-6">
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray">
              Dressings
            </p>
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray">
              Sous pente
            </p>
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray">
              Sous escalier
            </p>
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray">
              Chambre
            </p>
          </div>
        </div>
        <div className="col-span-1 flex flex-col gap-4">
          <h5 className="text-primary-200 font-dm text-[22px] lg:text-[25px] leading-loose">
            Contact
          </h5>
          <div className="flex flex-col gap-6">
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray break-words">
              15 Rue André Citroën, 78140 Vélizy-Villacoublay SIRET - 421 678 822
            </p>
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray">
              Dm-placards@wanado.com
            </p>
            <p className="tracking-tight text-base lg:text-[22px] lg:leading-[33px] font-jost text-text-gray">
              01 34 65 35 70
            </p>
          </div>
        </div>

        {/* End */}
      </div>
    </footer>
  );
};

export default Footer;
