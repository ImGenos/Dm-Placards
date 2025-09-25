import React from "react";
import Button from "./button.tsx";

const ContactForm = () => {
  return (
    <div className="col-span-1 lg:col-span-2">
      <form className="w-full grid grid-cols-2 gap-x-10 gap-y-[50px]">
        <label htmlFor="Nom">
          <input
            type="text"
            name="Nom"
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Nom"
          />
        </label>
        <label htmlFor="email">
          <input
            type="email"
            name="email"
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Email"
          />
        </label>
        <label htmlFor="Sujet">
          <input
            type="text"
            name="Sujet"
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Sujet"
          />
        </label>
        <label htmlFor="Téléphone">
          <input
            type="tel"
            name="Téléphone"
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Téléphone"
          />
        </label>
        <textarea
          name="message"
          className="col-span-2 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
          cols={30}
          rows={10}
          placeholder="Bonjour, Je souhaiterais réaliser...
(Pensez à préciser les dimmensions pour que notre devis soit le plus précis possible et joindre une photo)"
        ></textarea>

        <div className="w-full flex justify-end col-span-2">
          <Button text="Envoyez" type="submit" />
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
