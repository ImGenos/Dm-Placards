# Configuration du Formulaire de Contact

✅ **Le formulaire est maintenant complètement configuré avec Resend!**

## Fonctionnalités Actives

✅ API serverless Vercel (`/api/contact`)
✅ Validation des données côté client et serveur
✅ Gestion des états (chargement, succès, erreur)
✅ Interface utilisateur avec feedback visuel
✅ Envoi d'emails via Resend

## Configuration Actuelle

Le formulaire utilise Resend pour envoyer les emails. Votre clé API est déjà configurée dans le fichier `.env`.

### Important: Email "From"

Actuellement, le formulaire utilise `onboarding@resend.dev` comme adresse d'envoi. C'est parfait pour les tests, mais pour la production, vous devriez:

1. **Vérifier votre domaine dans Resend:**
   - Allez sur [resend.com/domains](https://resend.com/domains)
   - Ajoutez votre domaine (ex: dmplacards.fr)
   - Configurez les enregistrements DNS

2. **Modifier l'adresse d'envoi dans `src/pages/api/contact.ts`:**
   ```typescript
   from: 'DM Placards <contact@votredomaine.fr>',
   ```

### Recevoir les Messages

Actuellement, les emails sont envoyés au client (confirmation). Pour recevoir les messages vous-même, modifiez dans `src/pages/api/contact.ts`:

```typescript
// Envoi à vous-même
await resend.emails.send({
  from: 'DM Placards <onboarding@resend.dev>',
  to: 'votre-email@example.com', // Votre email professionnel
  replyTo: email, // Email du client pour répondre facilement
  subject: sujet ? `Contact: ${sujet}` : 'Nouveau message de contact',
  html: `...`
});
```

Ou envoyez deux emails (un au client, un à vous):

```typescript
// Email au client (confirmation)
await resend.emails.send({
  from: 'DM Placards <onboarding@resend.dev>',
  to: email,
  subject: 'Merci pour votre message',
  html: `<p>Bonjour ${nom},</p><p>Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.</p>`
});

// Email à vous (notification)
await resend.emails.send({
  from: 'DM Placards <onboarding@resend.dev>',
  to: 'votre-email@example.com',
  replyTo: email,
  subject: `Nouveau contact: ${sujet || 'Sans sujet'}`,
  html: `<p><strong>Nom:</strong> ${nom}</p>...`
});
```

## Test Local

Pour tester localement:

```bash
npm run dev
```

Puis allez sur `http://localhost:4321/contact` et testez le formulaire.

## Déploiement sur Vercel

1. Poussez votre code sur GitHub (le fichier `.env` ne sera pas inclus grâce au `.gitignore`)
2. Importez le projet dans Vercel
3. **Important:** Ajoutez la variable d'environnement dans Vercel:
   - Allez dans Settings → Environment Variables
   - Ajoutez: `RESEND_API_KEY` = `your_resend_api_key_here`
4. Déployez!

## Limites du Plan Gratuit Resend

- 3000 emails par mois
- 100 emails par jour
- Parfait pour un site de contact professionnel

## Support

Si vous avez des questions:
- [Documentation Resend](https://resend.com/docs)
- [Documentation Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [Documentation Vercel](https://vercel.com/docs/functions)
