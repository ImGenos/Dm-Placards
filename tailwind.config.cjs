/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        hero: "url('/banner.png')",
        'hero-overlay': "linear-gradient(135deg, rgba(41, 47, 54, 0.7) 0%, rgba(41, 47, 54, 0.4) 50%, rgba(205, 162, 116, 0.3) 100%), url('/banner.png')",
        main: "url('/Background.jpg')",
        about: "url('/aboutpage-bg.png')",
        services: "url('/servicespage-bg.jpg')",
        contact: "url('/contactpage-bg.jpg')",
      },
      fontFamily: {
        dm: ["DM Serif Display", "serif"],
        jost: ["Jost", "sans-serif"],
        serif: ["DM Serif Display", "serif"], // Alternative reference
      },
      colors: {
        // Keeping your original color palette
        primary: {
          100: "#CDA274",
          200: "#292F36",
          300: "#F4F0EC",
          400: "#E2E2E2",
        },
        text: {
          blue: "#1B2534",
          gray: "#4D4F52",
          "gray-100": "#5F5F5F",
          "gray-200": "#4D5053",
          "gray-300": "#E5E5E5",
        },
        // Adding new colors
        background: "#F9F5F0", // Warm background color
        accent: "#CDA274",     // Same as primary.100 for easier reference
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
      fontSize: {
        // Additional font sizes for more precise control
        '2xs': '.625rem',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".center": {
          display: "flex",
          "justify-content": "center",
          "align-items": "center",
        },
        ".startCenter": {
          display: "flex",
          "align-items": "center",
        },
        ".btwn": {
          display: "flex",
          "justify-content": "space-between",
          "align-items": "center",
        },
        // Additional utility classes
        ".container": {
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        },
        ".section": {
          paddingTop: "4rem",
          paddingBottom: "4rem",
        },
        ".btn": {
          display: "inline-block",
          padding: "0.75rem 2rem",
          borderRadius: "0.25rem",
          fontWeight: "500",
          fontSize: "1rem",
          textAlign: "center",
          transition: "all 0.3s ease",
          textDecoration: "none",
          cursor: "pointer",
        },
        ".btn-primary": {
          backgroundColor: "#CDA274",
          color: "white",
        },
        ".btn-primary:hover": {
          backgroundColor: "#bb9569",
        },
        ".btn-outline": {
          border: "1px solid #CDA274",
          color: "#292F36",
        },
        ".btn-outline:hover": {
          backgroundColor: "#CDA274",
          color: "white",
        },
        ".glass": {
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".text-shadow": {
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
        },
      });
    }),
  ],
};