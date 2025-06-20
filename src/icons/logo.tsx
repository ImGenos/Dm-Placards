import React from "react";

interface LogoProps {
  className?: string; // Define the prop here
}

// Use LogoProps in the component's function signature
const Logo = ({ className }: LogoProps) => {
  return (
    // Apply the className prop to the desired element
    <div className={`h-40 flex items-center ${className}`}>
      <img
        src="/logo.png"
        alt="DM Placards Logo"
        className="h-full w-auto"
      />
    </div>
  );
};

export default Logo;