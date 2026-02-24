import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3; // 3 submissions per hour per IP

function checkRateLimit(ip: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
    return { allowed: false, resetIn };
  }

  record.count++;
  return { allowed: true };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000); // Every 10 minutes

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const data = await request.json();
    const { nom, email, sujet, telephone, message, website, formLoadTime } = data;

    // Get client IP for rate limiting
    const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Trop de tentatives. Veuillez réessayer dans ${rateLimit.resetIn} minutes.` 
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Honeypot check
    if (website) {
      // Bot detected - return success but don't send email
      console.log('Bot detected via honeypot field');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message envoyé avec succès!' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Time-based check (server-side validation)
    if (formLoadTime) {
      const timeTaken = Date.now() - formLoadTime;
      if (timeTaken < 3000) {
        console.log('Bot detected: form submitted too quickly');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Veuillez prendre le temps de remplir le formulaire.' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

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
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'DM Placards <onboarding@resend.dev>', // TODO: Replace with your verified domain
      to: import.meta.env.RESEND_TO_EMAIL || 'votre-email@dmplacards.fr',
      replyTo: email, // Customer's email for easy replies
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

    if (emailError) {
      console.error('Resend error:', emailError);
      throw emailError;
    }

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
