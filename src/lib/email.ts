/**
 * AfriBayit — Email transactionnel via Resend
 * CDC §5.8 — Communications automatiques
 *
 * Toutes les fonctions sont no-throw : elles loggent l'erreur mais ne plantent
 * pas le flux appelant. L'email est best-effort.
 *
 * Variables env requises :
 *   RESEND_API_KEY   — clé API Resend
 *   FROM_EMAIL       — ex: "AfriBayit <noreply@afribayit.com>"
 *   NEXT_PUBLIC_APP_URL — ex: "https://afribayit.com"
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "AfriBayit <noreply@afribayit.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://afribayit.com";

// ─── Guard — ne rien envoyer si pas de clé ──────────────────────────────────

function canSend(): boolean {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY absent — email non envoyé");
    return false;
  }
  return true;
}

async function send(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!canSend()) return;
  try {
    const { error } = await resend.emails.send({ from: FROM, ...payload });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] send error:", err);
  }
}

// ─── Helpers HTML ────────────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#003087 0%,#0070BA 100%);padding:28px 40px;text-align:center;">
            <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Afri<span style="color:#D4AF37;">Bayit</span></span>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:0.5px;">Plateforme Immobilière Pan-Africaine</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} AfriBayit — Bénin · Côte d'Ivoire · Burkina Faso · Togo<br/>
              <a href="${APP_URL}/privacy" style="color:#0070BA;text-decoration:none;">Confidentialité</a> ·
              <a href="${APP_URL}/terms" style="color:#0070BA;text-decoration:none;">CGU</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0070BA;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin:20px 0;">${text}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#003087;">${text}</h1>`;
}

function p(text: string, style = ""): string {
  return `<p style="margin:12px 0;font-size:15px;color:#374151;line-height:1.6;${style}">${text}</p>`;
}

function badge(text: string, color = "#0070BA"): string {
  return `<span style="display:inline-block;background:${color}15;color:${color};font-weight:700;font-size:13px;padding:4px 12px;border-radius:20px;">${text}</span>`;
}

function separator(): string {
  return `<hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

/**
 * Email de bienvenue post-inscription
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const body = `
    ${h1(`Bienvenue sur AfriBayit, ${name.split(" ")[0]} ! 🎉`)}
    ${p("Votre compte est créé avec succès. Vous faites maintenant partie de la plus grande communauté immobilière pan-africaine.")}
    ${p("Pour accéder à toutes les fonctionnalités, commencez par compléter votre profil :")}
    <ul style="margin:12px 0;padding-left:20px;color:#374151;font-size:15px;line-height:1.8;">
      <li>Renseignez vos informations personnelles</li>
      <li>Vérifiez votre identité (KYC) pour débloquer les transactions</li>
      <li>Explorez les annonces dans votre pays</li>
    </ul>
    <div style="text-align:center;">
      ${btn("Compléter mon profil", `${APP_URL}/onboarding`)}
    </div>
    ${separator()}
    ${p("Des questions ? Notre assistante IA Rebecca est disponible 24h/24 pour vous accompagner.", "font-size:13px;color:#6b7280;")}
  `;
  await send({ to, subject: `Bienvenue sur AfriBayit, ${name.split(" ")[0]} !`, html: layout("Bienvenue", body) });
}

/**
 * Email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;
  const body = `
    ${h1("Réinitialisation de votre mot de passe")}
    ${p("Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :")}
    <div style="text-align:center;">
      ${btn("Réinitialiser mon mot de passe", resetUrl)}
    </div>
    ${separator()}
    ${p("Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.", "font-size:13px;color:#6b7280;")}
    ${p(`Ou copiez ce lien : <a href="${resetUrl}" style="color:#0070BA;word-break:break-all;">${resetUrl}</a>`, "font-size:12px;color:#9ca3af;")}
  `;
  await send({ to, subject: "Réinitialisation de votre mot de passe AfriBayit", html: layout("Réinitialisation", body) });
}

/**
 * Email OTP libération escrow (2FA ≥500K FCFA)
 */
export async function sendOTPEmail(to: string, name: string, otp: string, escrowRef: string, amount: number): Promise<void> {
  const body = `
    ${h1("Code de confirmation — Libération des fonds")}
    ${p(`Bonjour ${name.split(" ")[0]},`)}
    ${p(`Vous avez demandé la libération des fonds pour la transaction <strong>${escrowRef}</strong> d'un montant de <strong>${amount.toLocaleString("fr-FR")} FCFA</strong>.`)}
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#003087;color:#ffffff;font-size:36px;font-weight:900;letter-spacing:12px;padding:16px 32px;border-radius:12px;">${otp}</div>
    </div>
    ${p("Ce code est <strong>valable 10 minutes</strong> et ne peut être utilisé qu'une seule fois.")}
    ${separator()}
    ${p("Si vous n'avez pas initié cette demande, contactez immédiatement notre support.", "font-size:13px;color:#dc2626;")}
  `;
  await send({ to, subject: `${otp} — Code de libération escrow AfriBayit`, html: layout("Code OTP", body) });
}

/**
 * Email changement d'état KYC
 */
export async function sendKYCStatusEmail(
  to: string,
  name: string,
  action: "approved" | "rejected",
  docType: string,
  rejectReason?: string
): Promise<void> {
  const docLabels: Record<string, string> = {
    CNI: "Carte Nationale d'Identité",
    PASSPORT: "Passeport",
    SELFIE: "Photo selfie",
    PROOF_OF_ADDRESS: "Justificatif de domicile",
    TAX_ID: "Numéro fiscal",
  };
  const docLabel = docLabels[docType] ?? docType;

  const body = action === "approved"
    ? `
      ${h1("Document KYC approuvé ✅")}
      ${p(`Bonjour ${name.split(" ")[0]},`)}
      ${p(`Votre <strong>${docLabel}</strong> a été vérifié et approuvé par notre équipe.`)}
      ${badge("Document approuvé", "#16a34a")}
      ${p("Votre niveau KYC a été mis à jour. Vous pouvez maintenant effectuer des transactions jusqu'à votre nouvelle limite.")}
      <div style="text-align:center;">${btn("Voir mon tableau de bord", `${APP_URL}/dashboard`)}</div>
    `
    : `
      ${h1("Document KYC non accepté ❌")}
      ${p(`Bonjour ${name.split(" ")[0]},`)}
      ${p(`Votre <strong>${docLabel}</strong> n'a pas pu être validé pour la raison suivante :`)}
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#991b1b;">${rejectReason ?? "Document illisible ou non conforme."}</p>
      </div>
      ${p("Veuillez soumettre un nouveau document en vous assurant qu'il est :")}
      <ul style="margin:8px 0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
        <li>En cours de validité</li>
        <li>Lisible et non rogné</li>
        <li>Au format JPEG, PNG ou PDF</li>
      </ul>
      <div style="text-align:center;">${btn("Soumettre un nouveau document", `${APP_URL}/kyc`)}</div>
    `;

  const subject = action === "approved"
    ? `✅ Document KYC approuvé — ${docLabel}`
    : `❌ Document KYC refusé — ${docLabel}`;

  await send({ to, subject, html: layout("Statut KYC", body) });
}

/**
 * Email changement d'état escrow
 */
export async function sendEscrowStatusEmail(
  to: string,
  name: string,
  state: "FUNDED" | "IN_PROGRESS" | "VALIDATION" | "RELEASED" | "REFUNDED" | "DISPUTED",
  escrowRef: string,
  amount: number,
  propertyTitle?: string
): Promise<void> {
  const configs: Record<string, { emoji: string; title: string; body: string; color: string }> = {
    FUNDED: {
      emoji: "🔒",
      color: "#0070BA",
      title: "Fonds reçus et sécurisés",
      body: `Les fonds ont été reçus et placés en escrow sécurisé. Le vendeur peut maintenant préparer le transfert du bien.`,
    },
    IN_PROGRESS: {
      emoji: "⚙️",
      color: "#D4AF37",
      title: "Transaction en cours",
      body: `La transaction est maintenant en cours. Les deux parties ont confirmé le démarrage du processus.`,
    },
    VALIDATION: {
      emoji: "🔍",
      color: "#7c3aed",
      title: "En attente de validation",
      body: `La transaction attend la validation finale des deux parties avant la libération des fonds. Connectez-vous pour confirmer.`,
    },
    RELEASED: {
      emoji: "✅",
      color: "#16a34a",
      title: "Fonds libérés — Transaction terminée",
      body: `Les fonds ont été libérés avec succès. La transaction est terminée. Merci de votre confiance !`,
    },
    REFUNDED: {
      emoji: "💸",
      color: "#dc2626",
      title: "Remboursement effectué",
      body: `Les fonds ont été remboursés à l'acheteur. Le remboursement sera visible sur votre compte sous 3–5 jours ouvrables selon votre opérateur.`,
    },
    DISPUTED: {
      emoji: "⚠️",
      color: "#ea580c",
      title: "Litige ouvert",
      body: `Un litige a été ouvert sur cette transaction. Notre équipe de médiation va vous contacter dans les 24 heures.`,
    },
  };

  const cfg = configs[state];
  if (!cfg) return;

  const body = `
    ${h1(`${cfg.emoji} ${cfg.title}`)}
    ${p(`Bonjour ${name.split(" ")[0]},`)}
    ${p(cfg.body)}
    ${separator()}
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;padding:16px;">
      <tr>
        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Référence</td>
        <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">${escrowRef.slice(0, 12)}...</td>
      </tr>
      ${propertyTitle ? `<tr><td style="font-size:13px;color:#6b7280;padding:4px 0;">Bien</td><td style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding:4px 0;">${propertyTitle}</td></tr>` : ""}
      <tr>
        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Montant</td>
        <td style="font-size:15px;color:${cfg.color};font-weight:800;text-align:right;padding:4px 0;">${amount.toLocaleString("fr-FR")} FCFA</td>
      </tr>
    </table>
    <div style="text-align:center;margin-top:24px;">
      ${btn("Voir la transaction", `${APP_URL}/dashboard/transactions`)}
    </div>
  `;

  await send({ to, subject: `${cfg.emoji} ${cfg.title} — ${amount.toLocaleString("fr-FR")} FCFA`, html: layout(cfg.title, body) });
}

/**
 * Email confirmation réservation (STR / hôtel)
 */
export async function sendBookingConfirmationEmail(opts: {
  to: string;
  name: string;
  propertyTitle: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  bookingRef: string;
}): Promise<void> {
  const { to, name, propertyTitle, checkIn, checkOut, guests, totalAmount, bookingRef } = opts;
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);

  const body = `
    ${h1("Réservation confirmée 🏠")}
    ${p(`Bonjour ${name.split(" ")[0]},`)}
    ${p(`Votre réservation pour <strong>${propertyTitle}</strong> a bien été enregistrée et sécurisée par escrow.`)}
    ${separator()}
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;padding:20px;">
      <tr><td style="font-size:13px;color:#6b7280;padding:6px 0;">Référence</td><td style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding:6px 0;">${bookingRef}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:6px 0;">Arrivée</td><td style="font-size:14px;color:#003087;font-weight:700;text-align:right;padding:6px 0;">${fmt(checkIn)}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:6px 0;">Départ</td><td style="font-size:14px;color:#003087;font-weight:700;text-align:right;padding:6px 0;">${fmt(checkOut)}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding:6px 0;">Durée</td><td style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding:6px 0;">${nights} nuit${nights > 1 ? "s" : ""} · ${guests} voyageur${guests > 1 ? "s" : ""}</td></tr>
      <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:10px;margin-top:10px;"></td></tr>
      <tr><td style="font-size:14px;color:#374151;font-weight:700;padding:4px 0;">Total sécurisé</td><td style="font-size:18px;color:#0070BA;font-weight:800;text-align:right;padding:4px 0;">${totalAmount.toLocaleString("fr-FR")} FCFA</td></tr>
    </table>
    <div style="text-align:center;margin-top:24px;">
      ${btn("Voir ma réservation", `${APP_URL}/dashboard/transactions`)}
    </div>
    ${separator()}
    ${p("Les fonds sont bloqués en escrow jusqu'à votre arrivée. Aucun paiement direct n'est nécessaire.", "font-size:13px;color:#6b7280;")}
  `;
  await send({ to, subject: `✅ Réservation confirmée — ${propertyTitle}`, html: layout("Confirmation réservation", body) });
}
