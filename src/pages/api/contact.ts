import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Protection XSS : échappement HTML
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const data = await request.json();
    const { nom, email, sujet, telephone, message, telephone2, formLoadTime } = data;
    const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';

    // 1. VALIDATION STRICTE
    if (!nom?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: 'Champs obligatoires manquants.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Format d'email invalide." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. RATE LIMITING AVEC VERCEL KV
    const kvKey = `limit:${ip}`;
    const count = await kv.incr(kvKey);
    if (count === 1) await kv.expire(kvKey, 3600); // expire après 1h

    if (count > 3) {
      return new Response(
        JSON.stringify({ success: false, message: 'Trop de tentatives (max 3/heure).' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. SÉCURITÉ ANTI-BOT (Honeypot & Rapidité)
    if (telephone2) {
      console.warn('Bot détecté (honeypot)');
      return new Response(
        JSON.stringify({ success: true, message: 'Message envoyé avec succès !' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (formLoadTime && Date.now() - formLoadTime < 3000) {
      console.warn('Bot détecté (trop rapide)');
      return new Response(
        JSON.stringify({ success: false, message: 'Erreur de validation.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. ÉCHAPPEMENT DE TOUS LES CHAMPS AFFICHÉS
    const safeNom = escapeHtml(nom.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeMsg = escapeHtml(message.trim());
    const safeSujet = escapeHtml(sujet?.trim() || 'Nouveau contact');
    const safeTel = escapeHtml(telephone?.trim() || 'Non renseigné');

    // Vérification de la variable d'environnement destinataire
    const toEmail = import.meta.env.RESEND_TO_EMAIL;
    if (!toEmail) {
      console.error('RESEND_TO_EMAIL non défini');
      throw new Error('Configuration manquante');
    }

    // 5. ENVOI DE L'EMAIL
    const { error } = await resend.emails.send({
      from: 'DM Placards <onboarding@resend.dev>', // À changer après validation du domaine
      to: toEmail,
      replyTo: email, // permet de répondre directement à l'utilisateur
      subject: `[Site Web] ${safeSujet}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333;">Nouveau message de ${safeNom}</h2>
          <p><strong>Email :</strong> ${safeEmail}</p>
          <p><strong>Téléphone :</strong> ${safeTel}</p>
          <hr />
          <p style="white-space: pre-wrap;">${safeMsg}</p>
        </div>
      `
    });

    if (error) throw error;

    // 6. RÉPONSE DE SUCCÈS
    return new Response(
      JSON.stringify({ success: true, message: 'Message envoyé avec succès !' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur API:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erreur serveur. Veuillez réessayer.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};