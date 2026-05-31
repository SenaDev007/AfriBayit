// AfriBayit — Community Notification Templates (French)
import type { NotificationTemplate } from '../types';

export const communityTemplates: NotificationTemplate[] = [
  {
    id: 'new_message',
    category: 'community',
    channel: 'in_app',
    title: 'Nouveau message',
    body: '{{senderName}} vous a envoyé un message : "{{messagePreview}}"',
  },
  {
    id: 'new_message_push',
    category: 'community',
    channel: 'push',
    title: 'Nouveau message de {{senderName}}',
    body: '{{messagePreview}}',
  },
  {
    id: 'post_reply',
    category: 'community',
    channel: 'in_app',
    title: 'Réponse à votre publication',
    body: '{{replierName}} a répondu à votre publication "{{postTitle}}" : "{{replyPreview}}"',
  },
  {
    id: 'post_reply_email',
    category: 'community',
    channel: 'email',
    subject: '[Reply] Nouvelle reponse a votre publication',
    title: 'Réponse à votre publication',
    body: '{{replierName}} a répondu à votre publication.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>{{replierName}} a répondu à votre publication <strong>"{{postTitle}}"</strong> :</p>
      <div style="background:#f5f5f5;border-left:4px solid #003087;padding:12px;margin:16px 0;border-radius:4px;">
        {{replyPreview}}
      </div>
    `,
  },
  {
    id: 'event_reminder',
    category: 'community',
    channel: 'in_app',
    title: 'Rappel d\'événement',
    body: 'L\'événement "{{eventTitle}}" commence {{eventTime}}. {{eventLocation}}',
  },
  {
    id: 'event_reminder_sms',
    category: 'community',
    channel: 'sms',
    title: 'Rappel événement',
    body: 'AfriBayit: Rappel - "{{eventTitle}}" commence {{eventTime}}. {{eventLocation}}',
  },
  {
    id: 'group_invite',
    category: 'community',
    channel: 'in_app',
    title: 'Invitation à un groupe',
    body: '{{inviterName}} vous a invité à rejoindre le groupe "{{groupName}}".',
  },
  {
    id: 'group_invite_email',
    category: 'community',
    channel: 'email',
    subject: '[Group] Invitation a rejoindre un groupe',
    title: 'Invitation à un groupe',
    body: '{{inviterName}} vous a invité à rejoindre le groupe "{{groupName}}".',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>{{inviterName}} vous a invité à rejoindre le groupe communautaire :</p>
      <div style="background:#f0f7ff;border-left:4px solid #003087;padding:16px;margin:16px 0;border-radius:4px;">
        <strong style="color:#003087;">{{groupName}}</strong><br>
        {{groupDescription}}<br>
        <span style="color:#6b7280;">{{memberCount}} membres</span>
      </div>
    `,
  },
];
