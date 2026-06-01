// AfriBayit — Authentication Notification Templates (French)
import type { NotificationTemplate } from '../types';

export const authTemplates: NotificationTemplate[] = [
  {
    id: 'login_new_device',
    category: 'security',
    channel: 'in_app',
    title: 'Connexion depuis un nouvel appareil',
    body: 'Une connexion à votre compte a été détectée depuis un nouvel appareil : {{deviceInfo}} à {{location}}.',
  },
  {
    id: 'login_new_device_email',
    category: 'security',
    channel: 'email',
    subject: '[SECURITY] Connexion depuis un nouvel appareil detectee',
    title: 'Connexion depuis un nouvel appareil',
    body: 'Une connexion à votre compte a été détectée depuis un nouvel appareil.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Une connexion à votre compte AfriBayit a été détectée depuis un nouvel appareil :</p>
      <div style="background:#fff8e1;border-left:4px solid #D4AF37;padding:16px;margin:16px 0;border-radius:4px;">
        <strong>Appareil :</strong> {{deviceInfo}}<br>
        <strong>Localisation :</strong> {{location}}<br>
        <strong>Date :</strong> {{loginDate}}<br>
        <strong>Adresse IP :</strong> {{ipAddress}}
      </div>
      <p>Si ce n'était pas vous, veuillez changer votre mot de passe immédiatement et activer l'authentification à deux facteurs.</p>
    `,
  },
  {
    id: 'password_changed',
    category: 'security',
    channel: 'in_app',
    title: 'Mot de passe modifié',
    body: 'Votre mot de passe a été modifié avec succès.',
  },
  {
    id: 'password_changed_email',
    category: 'security',
    channel: 'email',
    subject: '[SECURITY] Mot de passe modifie',
    title: 'Mot de passe modifié',
    body: 'Votre mot de passe AfriBayit a été modifié avec succès.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Votre mot de passe AfriBayit a été modifié avec succès le {{changeDate}}.</p>
      <p>Si vous n'avez pas effectué cette modification, veuillez contacter notre support immédiatement.</p>
    `,
  },
  {
    id: 'kyc_approved',
    category: 'security',
    channel: 'in_app',
    title: 'KYC approuvé',
    body: 'Votre vérification d\'identité (KYC niveau {{kycLevel}}) a été approuvée. Vous avez maintenant accès à toutes les fonctionnalités associées.',
  },
  {
    id: 'kyc_approved_email',
    category: 'security',
    channel: 'email',
    subject: '[SUCCESS] Verification d\'identite approuvee',
    title: 'KYC approuvé',
    body: 'Votre vérification d\'identité a été approuvée.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <div style="background:#f0fff4;border-left:4px solid #00A651;padding:16px;margin:16px 0;border-radius:4px;">
        <strong style="color:#00A651;">[SUCCESS] Verification d'identite approuvee</strong><br>
        Niveau KYC : {{kycLevel}}<br>
        Date d'approbation : {{approvalDate}}
      </div>
      <p>Vous avez maintenant accès à toutes les fonctionnalités de votre compte.</p>
    `,
  },
  {
    id: 'kyc_rejected',
    category: 'security',
    channel: 'in_app',
    title: 'KYC refusé',
    body: 'Votre vérification d\'identité (KYC niveau {{kycLevel}}) a été refusée. Raison : {{rejectionReason}}.',
  },
  {
    id: 'kyc_rejected_email',
    category: 'security',
    channel: 'email',
    subject: '[REJECTED] Verification d\'identite refusee',
    title: 'KYC refusé',
    body: 'Votre vérification d\'identité a été refusée.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <div style="background:#fff5f5;border-left:4px solid #D93025;padding:16px;margin:16px 0;border-radius:4px;">
        <strong style="color:#D93025;">[REJECTED] Verification d'identite refusee</strong><br>
        Niveau KYC : {{kycLevel}}<br>
        Raison : {{rejectionReason}}
      </div>
      <p>Vous pouvez soumettre de nouveaux documents depuis votre profil.</p>
    `,
  },
];
