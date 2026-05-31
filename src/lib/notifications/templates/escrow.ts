// AfriBayit — Escrow/Transaction Notification Templates (French)
import type { NotificationTemplate } from '../types';

export const escrowTemplates: NotificationTemplate[] = [
  {
    id: 'transaction_created',
    category: 'transaction',
    channel: 'in_app',
    title: 'Transaction créée',
    body: 'Une nouvelle transaction de {{amount}} pour "{{propertyTitle}}" a été créée.',
  },
  {
    id: 'transaction_created_email',
    category: 'transaction',
    channel: 'email',
    subject: '💰 Nouvelle transaction initiée — {{amount}}',
    title: 'Transaction créée',
    body: 'Une nouvelle transaction a été initiée pour la propriété "{{propertyTitle}}" d\'un montant de {{amount}}.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Une nouvelle transaction a été initiée :</p>
      <div style="background:#f0f7ff;border-left:4px solid #003087;padding:16px;margin:16px 0;border-radius:4px;">
        <strong>Propriété :</strong> {{propertyTitle}}<br>
        <strong>Montant :</strong> {{amount}}<br>
        <strong>Référence :</strong> {{transactionRef}}<br>
        <strong>Statut :</strong> En attente de financement
      </div>
      <p>Les fonds seront sécurisés via notre système de séquestre jusqu'à la finalisation de la transaction.</p>
    `,
  },
  {
    id: 'funds_received',
    category: 'transaction',
    channel: 'in_app',
    title: 'Fonds reçus en séquestre',
    body: 'Les fonds de {{amount}} ont été reçus et sécurisés en séquestre pour la transaction {{transactionRef}}.',
  },
  {
    id: 'funds_received_email',
    category: 'transaction',
    channel: 'email',
    subject: '✅ Fonds sécurisés en séquestre',
    title: 'Fonds reçus en séquestre',
    body: 'Les fonds de {{amount}} ont été reçus et sécurisés en séquestre.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Les fonds ont été reçus et sécurisés en séquestre :</p>
      <div style="background:#f0fff4;border-left:4px solid #00A651;padding:16px;margin:16px 0;border-radius:4px;">
        <strong>Montant séquestré :</strong> {{amount}}<br>
        <strong>Référence :</strong> {{transactionRef}}<br>
        <strong>Statut :</strong> Fonds sécurisés ✓
      </div>
      <p>Le processus de vérification des documents peut maintenant commencer.</p>
    `,
  },
  {
    id: 'deed_signed',
    category: 'transaction',
    channel: 'in_app',
    title: 'Acte signé',
    body: 'L\'acte de vente pour "{{propertyTitle}}" a été signé par le notaire. En attente d\'enregistrement ANDF.',
  },
  {
    id: 'funds_released',
    category: 'transaction',
    channel: 'in_app',
    title: 'Fonds libérés',
    body: 'Les fonds de {{amount}} ont été libérés au vendeur pour la transaction {{transactionRef}}.',
  },
  {
    id: 'funds_released_email',
    category: 'transaction',
    channel: 'email',
    subject: '🎉 Transaction finalisée — Fonds libérés',
    title: 'Fonds libérés',
    body: 'Les fonds de {{amount}} ont été libérés au vendeur.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Excellente nouvelle ! La transaction est finalisée :</p>
      <div style="background:#f0fff4;border-left:4px solid #00A651;padding:16px;margin:16px 0;border-radius:4px;">
        <strong>Montant libéré :</strong> {{amount}}<br>
        <strong>Propriété :</strong> {{propertyTitle}}<br>
        <strong>Référence :</strong> {{transactionRef}}<br>
        <strong>Statut :</strong> Transaction complétée 🎉
      </div>
    `,
  },
  {
    id: 'dispute_opened',
    category: 'transaction',
    channel: 'in_app',
    title: 'Litige ouvert',
    body: 'Un litige a été ouvert pour la transaction {{transactionRef}}. Raison : {{disputeReason}}.',
  },
  {
    id: 'dispute_opened_email',
    category: 'transaction',
    channel: 'email',
    subject: '⚠️ Litige ouvert — Transaction {{transactionRef}}',
    title: 'Litige ouvert',
    body: 'Un litige a été ouvert pour la transaction {{transactionRef}}.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Un litige a été ouvert concernant votre transaction :</p>
      <div style="background:#fff5f5;border-left:4px solid #D93025;padding:16px;margin:16px 0;border-radius:4px;">
        <strong>Référence :</strong> {{transactionRef}}<br>
        <strong>Raison :</strong> {{disputeReason}}<br>
        <strong>Statut :</strong> Fonds bloqués en séquestre
      </div>
      <p>Notre équipe de résolution des litiges examinera votre dossier.</p>
    `,
  },
  {
    id: 'dispute_opened_sms',
    category: 'transaction',
    channel: 'sms',
    title: 'Litige ouvert',
    body: 'AfriBayit: Litige ouvert pour transaction {{transactionRef}}. Fonds bloqués. Raison: {{disputeReason}}',
  },
];
