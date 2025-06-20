import React, { useState, useEffect } from "react";
import Logo from "../icons/logo.tsx";
import useMediaQuery from "../utils/useMediaQuery.ts";
import { motion } from "framer-motion";

const Navbar = () => {
  const [toggled, setToggled] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const matches = useMediaQuery("(min-width: 1280px)"); // desktop size breakpoint

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkStyle = "text-xl leading-6 font-jost text-primary-200 hover:text-accent transition-all relative group";
  const activeLinkStyle = "after:content-[''] after:absolute after:h-[2px] after:w-0 after:left-0 after:bottom-[-4px] after:bg-accent after:transition-all group-hover:after:w-full";

  // Configuration for Heights (Desktop)
  const logoActualHeightRem = 8;
  const navLinksBarHeightRem = 2;
  const logoOverhangRem = ((logoActualHeightRem - navLinksBarHeightRem) / 2)+0.2;
  const headerVerticalPaddingStyleVal = `${logoOverhangRem}rem`;
  const logoHeightClass = `h-[${logoActualHeightRem}rem]`; // Desktop logo height class
  const navLinksHeightClass = `h-[${navLinksBarHeightRem}rem]`;

  // --- Mobile Logo Height ---
  const mobileLogoActualHeightRem = 5; // Choose a smaller height for mobile
  const mobileLogoHeightClass = `h-20`; // Mobile logo height class


  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (toggled && !matches) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [toggled, matches]);

  return (
    <div className={`w-full sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-background shadow-md" : "bg-background"}`}>
      <div
        className="max-w-[1200px] m-auto w-full relative"
        style={{
          paddingTop: headerVerticalPaddingStyleVal,
          paddingBottom: headerVerticalPaddingStyleVal,
        }}
      >
        {/* --- CORRECTED: Logo div position reverted --- */}
        {/* This div remains a direct child of the main padded container */}
        <div
          className="absolute left-0 z-20 px-6 md:px-12 xl:px-0"
          style={{ top: '0px' }} // Revert top style to original
        >
           {/* Keep the conditional height class applied ONLY to the anchor tag */}
          <a href="/" aria-label="Go to homepage" className={`flex items-center ${matches ? logoHeightClass : mobileLogoHeightClass}`}>
            <Logo />
          </a>
        </div>


        {/* This div contains the nav links / mobile toggle */}
        <div
          className={`w-full flex justify-between items-center px-6 md:px-12 xl:px-0 relative z-10 ${navLinksHeightClass}`}
        >
          <div className="ml-auto flex items-center h-full">
            {matches && (
              <nav className="flex flex-row gap-8 items-center">
                <a href="/" className={`${linkStyle} ${activeLinkStyle}`}>Accueil</a>
                <a href="/about" className={`${linkStyle} ${activeLinkStyle}`}>À Propos</a>
                <a href="/services" className={`${linkStyle} ${activeLinkStyle}`}>Services</a>
                {/* Added ml-8 for spacing consistency on desktop contact button */}
                <a href="/contact" className={`${linkStyle} ml-8 btn btn-outline rounded-full py-2 px-6`}>Nous Contacter</a>
              </nav>
            )}

            {!matches && (
              <div
                // --- Keep the Modified onClick handler for mobile ---
                onClick={() => {
                  if (!toggled && !matches) {
                    console.log("Attempting to scroll to top on mobile menu open."); // Add this line
                    window.scrollTo({ top: 1, behavior: 'smooth' });
                  }
                  setToggled(!toggled);
                }}
                className="space-y-1 cursor-pointer z-30"
                aria-label="Toggle menu"
                aria-expanded={toggled}
              >
                <motion.span
                  animate={{ rotateZ: toggled ? 45 : 0, y: toggled ? 8 : 0 }}
                  className="block h-0.5 w-8 bg-primary-200"
                ></motion.span>
                <motion.span
                  animate={{ width: toggled ? 0 : 24 }}
                  className="block h-0.5 w-6 bg-primary-200"
                ></motion.span>
                <motion.span
                  animate={{
                    rotateZ: toggled ? -45 : 0,
                    y: toggled ? -8 : 0,
                    width: toggled ? 32 : 16,
                  }}
                  className="block h-0.5 w-4 bg-primary-200"
                ></motion.span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu overlay - This part remains the same */}
        {toggled && !matches && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-200 bg-opacity-30 backdrop-blur-sm z-40"
              onClick={() => setToggled(false)}
            />

            {/* Menu panel */}
            <motion.nav
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: "0%" }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="flex flex-col fixed top-0 right-0 h-screen bg-background w-[75%] md:w-[50%] text-primary-200 gap-6 items-center justify-center z-50 shadow-lg"
            >
              <div className="flex flex-col gap-6 items-center">
                <a href="/" className={`${linkStyle} text-2xl`} onClick={() => setToggled(false)}>Accueil</a>
                <a href="/about" className={`${linkStyle} text-2xl`} onClick={() => setToggled(false)}>À Propos</a>
                <a href="/services" className={`${linkStyle} text-2xl`} onClick={() => setToggled(false)}>Services</a>
                <a
                   href="/contact"
                   className="mt-4 btn btn-primary rounded-full py-3 px-8 text-xl"
                   onClick={() => setToggled(false)}
                >
                  Nous Contacter
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;