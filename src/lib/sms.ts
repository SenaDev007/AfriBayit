/**
 * AfriBayit — SMS / WhatsApp via Africa's Talking
 * CDC §5.8 — Notifications transactionnelles
 *
 * Feature flag : SMS_PROVIDER=africastalking|console (défaut: console)
 * Variables env requises en production :
 *   AT_USERNAME   — nom d'utilisateur Africa's Talking
 *   AT_API_KEY    — clé API Africa's Talking
 *   AT_SENDER_ID  — ex: "AFRIBAYIT" (optionnel, sandbox ignore)
 */

// ─── Client ───────────────────────────────────────────────────────────────────

function getATClient() {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;

  if (!username || !apiKey) return null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AT = require("africastalking");
  return AT({ username, apiKey });
}

// ─── Core send ───────────────────────────────────────────────────────────────

async function sendSMS(to: string | string[], message: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER ?? "console";
  const recipients = Array.isArray(to) ? to : [to];

  if (provider === "africastalking") {
    const client = getATClient();
    if (!client) {
      console.warn("[sms] AT_USERNAME ou AT_API_KEY manquant — SMS non envoyé");
      return;
    }
    try {
      const sms = client.SMS;
      const opts: Record<string, unknown> = { to: recipients, message };
      if (process.env.AT_SENDER_ID) opts.from = process.env.AT_SENDER_ID;
      await sms.send(opts);
    } catch (err) {
      console.error("[sms] Africa's Talking error:", err);
    }
  } else {
    // console mode (dev / test)
    console.log(`[SMS → ${recipients.join(", ")}]:\n${message}`);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

/**
 * OTP libération escrow (2FA ≥500K FCFA)
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  await sendSMS(
    phone,
    `AfriBayit : Votre code de confirmation escrow est ${otp}. Valide 10 min. Ne le partagez jamais.`
  );
}

/**
 * Confirmation réservation locataire
 */
export async function sendBookingConfirmationSMS(
  phone: string,
  propertyTitle: string,
  checkIn: Date,
  ref: string
): Promise<void> {
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  await sendSMS(
    phone,
    `AfriBayit : Réservation confirmée ! ${propertyTitle} le ${fmt(checkIn)}. Réf: ${ref.slice(0, 8)}. Fonds sécurisés par escrow.`
  );
}

/**
 * Notification paiement reçu (vendeur)
 */
export async function sendPaymentReceivedSMS(phone: string, amount: number): Promise<void> {
  await sendSMS(
    phone,
    `AfriBayit : Paiement de ${amount.toLocaleString("fr-FR")} FCFA reçu et sécurisé en escrow. Connectez-vous pour suivre la transaction.`
  );
}

/**
 * Alerte libération fonds (vendeur)
 */
export async function sendFundsReleasedSMS(phone: string, amount: number): Promise<void> {
  await sendSMS(
    phone,
    `AfriBayit : Félicitations ! ${amount.toLocaleString("fr-FR")} FCFA ont été libérés sur votre compte. Délai virement : 1-3 jours ouvrables.`
  );
}

/**
 * Alerte remboursement (acheteur)
 */
export async function sendRefundSMS(phone: string, amount: number): Promise<void> {
  await sendSMS(
    phone,
    `AfriBayit : Remboursement de ${amount.toLocaleString("fr-FR")} FCFA initié. Délai : 3-5 jours ouvrables selon votre opérateur.`
  );
}

/**
 * Mission GeoTrust assignée (géomètre)
 */
export async function sendGeoTrustMissionSMS(phone: string, city: string, missionRef: string): Promise<void> {
  await sendSMS(
    phone,
    `AfriBayit GeoTrust : Nouvelle mission à ${city}. Réf: ${missionRef.slice(0, 8)}. Connectez-vous pour accepter.`
  );
}

/**
 * Rappel renouvellement abonnement (J-7)
 */
export async function sendSubscriptionReminderSMS(phone: string, planName: string, expiresAt: Date): Promise<void> {
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  await sendSMS(
    phone,
    `AfriBayit : Votre abonnement ${planName} expire le ${fmt(expiresAt)}. Renouvelez pour garder l'accès à vos services.`
  );
}
