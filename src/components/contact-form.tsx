import React, { useState } from "react";
import Button from "./button.tsx";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    sujet: "",
    telephone: "",
    message: "",
  });
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Envoi en cours..." });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ type: "success", message: result.message });
        setFormData({ nom: "", email: "", sujet: "", telephone: "", message: "" });
      } else {
        setStatus({ type: "error", message: result.message });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Une erreur est survenue. Veuillez réessayer.",
      });
    }
  };

  return (
    <div className="col-span-1 lg:col-span-2">
      <form
        onSubmit={handleSubmit}
        className="w-full grid grid-cols-2 gap-x-10 gap-y-[50px]"
      >
        <label htmlFor="nom">
          <input
            type="text"
            name="nom"
            id="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Nom"
          />
        </label>
        <label htmlFor="email">
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Email"
          />
        </label>
        <label htmlFor="sujet">
          <input
            type="text"
            name="sujet"
            id="sujet"
            value={formData.sujet}
            onChange={handleChange}
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Sujet"
          />
        </label>
        <label htmlFor="telephone">
          <input
            type="tel"
            name="telephone"
            id="telephone"
            value={formData.telephone}
            onChange={handleChange}
            className="col-span-1 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
            placeholder="Téléphone"
          />
        </label>
        <textarea
          name="message"
          id="message"
          value={formData.message}
          onChange={handleChange}
          required
          className="col-span-2 border-b w-full border-black outline-none py-3 text-base lg:text-[22px] lg:leading-[33px] tracking-tight font-jost text-text-gray"
          cols={30}
          rows={10}
          placeholder="Bonjour, Je souhaiterais réaliser...
(Pensez à préciser les dimensions pour que notre devis soit le plus précis possible et joindre une photo)"
        ></textarea>

        {status.type !== "idle" && (
          <div
            className={`col-span-2 p-4 rounded ${
              status.type === "success"
                ? "bg-green-100 text-green-800"
                : status.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="w-full flex justify-end col-span-2">
          <Button
            text={status.type === "loading" ? "Envoi..." : "Envoyez"}
            type="submit"
            disabled={status.type === "loading"}
          />
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
