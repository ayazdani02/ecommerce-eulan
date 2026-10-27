"use client";
import { useState, type FormEvent } from "react";
export function ContactForm() {
  const [message, setMessage] = useState("");
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (!email) {
      setMessage(
        "El canal oficial de contacto está pendiente de confirmación. Tu mensaje no se ha enviado ni guardado.",
      );
      return;
    }
    const subject = encodeURIComponent(
      `Consulta EULÁN — ${String(data.get("nombre")).slice(0, 80)}`,
    );
    const body = encodeURIComponent(
      `Nombre: ${data.get("nombre")}\nCorreo: ${data.get("correo")}\n\n${data.get("mensaje")}`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setMessage(
      "Se preparó el correo en tu aplicación. Revisa y envíalo desde allí. Este sitio no lo ha enviado.",
    );
  }
  return (
    <form className="contact-form" onSubmit={prepare}>
      <label className="field">
        Tu nombre
        <input name="nombre" autoComplete="name" required maxLength={100} />
      </label>
      <label className="field">
        Correo electrónico
        <input
          name="correo"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
        />
      </label>
      <label className="field">
        Mensaje
        <textarea name="mensaje" required minLength={10} maxLength={3000} />
      </label>
      <p className="demo-note">
        {email
          ? "Prepararemos un correo en tu aplicación de email. El envío lo realizas tú."
          : "Formulario de demostración. El contacto oficial aún no está configurado; este formulario no envía ni almacena información."}
      </p>
      <button className="button btn" type="submit">
        Preparar correo
      </button>
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
