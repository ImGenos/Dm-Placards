import React from "react";

const Logo = () => {
  return (
    <svg
      width="180"
      height="50"
      viewBox="0 0 180 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Text as actual text element instead of path */}
      <text
        x="44"
        y="32"
        fontFamily="serif"
        fontSize="24"
        fontWeight="600"
        fill="#292F36"
      >
        DM Placards
      </text>
      
      {/* Arch symbol (preserved from original) */}
      <path
        d="M0 42.0003H13.4588V32.499C13.4588 30.4853 15.0898 28.8543 17.1035 28.8543C19.1172 28.8543 20.7482 30.4853 20.7482 32.499V42.0003H33.9975V8C15.2211 8 0 23.2211 0 42.0003Z"
        fill="#CDA274"
      />
    </svg>
  );
};

export default Logo;