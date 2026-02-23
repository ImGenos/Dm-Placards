import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { nom, email, sujet, telephone, message } = data;

    // Basic validation
    if (!nom || !email || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nom, email et message sont requis' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email invalide' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    await resend.emails.send({
      from: 'DM Placards <onboarding@resend.dev>', // Use your verified domain once set up
      to: email, // Sends confirmation to the customer
      replyTo: email,
      subject: sujet ? `Contact: ${sujet}` : 'Nouveau message de contact',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nouveau message de contact - DM Placards</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nom:</strong> ${nom}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Téléphone:</strong> ${telephone || 'Non fourni'}</p>
            <p><strong>Sujet:</strong> ${sujet || 'Non spécifié'}</p>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Ce message a été envoyé depuis le formulaire de contact de DM Placards.
          </p>
        </div>
      `
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message envoyé avec succès! Nous vous répondrons dans les plus brefs délais.' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
