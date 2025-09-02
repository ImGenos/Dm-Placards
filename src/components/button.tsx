import ArrowSec from "../icons/arrow-sec.tsx";
import ArrowPri from "../icons/arrow-pri.tsx";

export interface ButtonProps {
  variant?: "primary" | "secondary";
  text: string;
  type?: "submit" | "button";
  href?: string;
}

const Button = (props: ButtonProps) => {
  const { variant = "primary", text = "Default Text", type = "button", href } = props;

  const defaultStyles =
    "rounded-[18px] flex items-center justify-center gap-[9px] w-fit text-white text-base lg:text-lg font-semibold font-['Jost'] leading-snug tracking-tight px-10 py-5 md:px-[54px] md:py-[26px]";
  const bgClass = variant === "primary" ? "bg-primary-200" : "bg-primary-100";
  const className = `${defaultStyles} ${bgClass}`;

  // Capitalize only the first letter of the text
  const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  // If href is provided, render as a link
  if (href) {
    return (
      <a href={href} className={className}>
        {capitalizedText}
        {variant === "primary" ? <ArrowSec /> : <ArrowPri />}
      </a>
    );
  }

  // Otherwise, render as a button
  return (
    <button className={className} type={type}>
      {capitalizedText}
      {variant === "primary" ? <ArrowSec /> : <ArrowPri />}
    </button>
  );
};

export default Button;
