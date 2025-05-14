import React, { useState, useEffect } from "react";
import Logo from "../icons/logo.tsx"; // Your Logo component
import useMediaQuery from "../utils/useMediaQuery.ts";
import { motion } from "framer-motion";

const Navbar = () => {
  const [toggled, setToggled] = useState(false);
  const matches = useMediaQuery("(min-width: 1280px)"); // XL breakpoint

  const linkStyle = "text-xl leading-6 font-jost text-primary-200 hover:text-primary-100 transition-all";

  // --- Configuration for Heights ---
  const logoActualHeightRem = 10; // For h-40 (160px). Your <Logo /> should render at this height.
  const navLinksBarHeightRem = 4; // For h-16 (64px). This is the new height for the links bar.

  // Calculate how much the logo overhangs the nav links bar on top and bottom
  const logoOverhangRem = (logoActualHeightRem - navLinksBarHeightRem) / 2; // e.g., (10 - 4) / 2 = 3rem

  // This padding will be applied to the top and bottom of the main content wrapper
  const headerVerticalPaddingStyleVal = `${logoOverhangRem}rem`; // e.g., "3rem"

  // --- Tailwind Class Strings for Heights ---
  const logoHeightClass = `h-[${logoActualHeightRem}rem]`; // e.g., "h-[10rem]"
  const navLinksHeightClass = `h-[${navLinksBarHeightRem}rem]`; // e.g., "h-[4rem]"

  // Optional: Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (toggled && !matches) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { // Cleanup on component unmount
      document.body.style.overflow = "auto";
    };
  }, [toggled, matches]);

  return (
    // 1. Outermost div for the full-width background.
    <div className="bg-background w-full">
      {/* 2. Centered, max-width container. This is the main positioning context.
             - 'relative' makes it the anchor for the absolutely positioned logo.
             - 'paddingTop' makes space for the top part of the oversized logo.
             - 'paddingBottom' makes space for the bottom part of the oversized logo. */}
      <div
        className="max-w-[1200px] m-auto w-full relative"
        style={{
          paddingTop: headerVerticalPaddingStyleVal,
          paddingBottom: headerVerticalPaddingStyleVal,
        }}
      >
        {/* 3. Links Bar.
             Sits within the content area of its parent (after parent's paddingTop).
             Has its own defined (shorter) height.
             'z-10' keeps it above the parent's background but below the logo. */}
        <div
          className={`w-full flex justify-between items-center px-12 xl:px-0 relative z-10 ${navLinksHeightClass}`}
        >
          {/* Navigation Items Container (Desktop Nav or Mobile Hamburger).
               'ml-auto' pushes this block to the right.
               'flex items-center h-full' ensures vertical centering of its content
               within this 'navLinksHeightClass' bar. */}
          <div className="ml-auto flex items-center h-full">
            {matches && ( // Desktop Navigation
              // Added 'items-center' here to vertically center the nav links
              <nav className="flex flex-row gap-8 items-center">
                <a href="/" className={linkStyle}>Accueil</a>
                <a href="/about" className={linkStyle}>À Propos</a>
                <a href="/services" className={linkStyle}>Services</a>
                <a href="/contact" className={linkStyle}>Nous Contacter</a>
              </nav>
            )}

            {!matches && ( // Mobile Hamburger Toggle
              <div
                onClick={() => setToggled(!toggled)}
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

        {/* 4. Absolutely Positioned Logo.
             - Positioned relative to the `max-w-[1200px]` div.
             - 'top: 0px' places its top edge at the beginning of the parent's paddingTop area.
             - 'left: 0px' places its left edge at the beginning of the parent's content area.
             - 'px-12 xl:px-0' on this div aligns the logo's content horizontally with the links bar's content.
             - 'z-20' places it above the links bar. */}
        <div
          className="absolute left-0 z-20 px-12 xl:px-0" // Horizontal padding to align content
          style={{ top: '0px' }} // Position at the top of the padded parent container
        >
          <a href="/" aria-label="Go to homepage" className={`flex items-center ${logoHeightClass}`}>
            {/* Your <Logo /> component should render the logo at its full desired height (e.g., 160px) */}
            <Logo />
          </a>
        </div>

        {/* Mobile Menu Overlay - Fixed position, higher z-index */}
        {toggled && !matches && (
          <motion.nav
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: "0%" }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="flex flex-col fixed top-0 right-0 h-screen bg-background w-[75%] md:w-[90%] text-primary-200 gap-6 items-center justify-center z-50 shadow-lg"
          >
            <a href="/" className={linkStyle} onClick={() => setToggled(false)}>Accueil</a>
            <a href="/about" className={linkStyle} onClick={() => setToggled(false)}>À Propos</a>
            <a href="/services" className={linkStyle} onClick={() => setToggled(false)}>Services</a>
            <a href="/contact" className={linkStyle} onClick={() => setToggled(false)}>Nous Contacter</a>
          </motion.nav>
        )}
      </div>
    </div>
  );
};

export default Navbar;