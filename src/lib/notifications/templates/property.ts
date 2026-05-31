// AfriBayit — Property Notification Templates (French)
import type { NotificationTemplate } from '../types';

export const propertyTemplates: NotificationTemplate[] = [
  {
    id: 'new_listing_match',
    category: 'property',
    channel: 'in_app',
    title: 'Nouvelle propriété correspondant à votre recherche',
    body: 'Une nouvelle propriété correspond à vos critères de recherche : {{propertyTitle}} à {{propertyCity}} pour {{propertyPrice}}.',
  },
  {
    id: 'new_listing_match_email',
    category: 'property',
    channel: 'email',
    subject: '🏡 Nouvelle propriété qui pourrait vous intéresser',
    title: 'Nouvelle propriété correspondant à votre recherche',
    body: 'Une nouvelle propriété correspond à vos critères de recherche : {{propertyTitle}} à {{propertyCity}} pour {{propertyPrice}}.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Une nouvelle propriété correspond à vos critères de recherche :</p>
      <div style="background:#f0f7ff;border-left:4px solid #003087;padding:16px;margin:16px 0;border-radius:4px;">
        <strong style="color:#003087;">{{propertyTitle}}</strong><br>
        📍 {{propertyCity}}, {{propertyCountry}}<br>
        💰 {{propertyPrice}}<br>
        🏠 {{propertyType}} — {{propertySurface}} m²
      </div>
    `,
  },
  {
    id: 'price_drop',
    category: 'property',
    channel: 'in_app',
    title: 'Baisse de prix détectée',
    body: 'Le prix de {{propertyTitle}} a baissé de {{oldPrice}} à {{newPrice}} ({{dropPercent}}% de réduction).',
  },
  {
    id: 'price_drop_email',
    category: 'property',
    channel: 'email',
    subject: '📉 Baisse de prix : {{propertyTitle}}',
    title: 'Baisse de prix détectée',
    body: 'Le prix de {{propertyTitle}} a baissé de {{oldPrice}} à {{newPrice}}.',
    htmlBody: `
      <p>Bonjour {{userName}},</p>
      <p>Bonne nouvelle ! Le prix d'une propriété que vous suivez a baissé :</p>
      <div style="background:#f0fff4;border-left:4px solid #00A651;padding:16px;margin:16px 0;border-radius:4px;">
        <strong style="color:#00A651;">{{propertyTitle}}</strong><br>
        <span style="text-decoration:line-through;color:#999;">{{oldPrice}}</span> → <strong style="color:#00A651;">{{newPrice}}</strong><br>
        <span style="color:#00A651;font-weight:600;">{{dropPercent}}% de réduction</span>
      </div>
    `,
  },
  {
    id: 'property_verified',
    category: 'property',
    channel: 'in_app',
    title: 'Propriété vérifiée',
    body: 'Votre propriété "{{propertyTitle}}" a été vérifiée avec succès par notre équipe.',
  },
  {
    id: 'visit_reminder',
    category: 'property',
    channel: 'in_app',
    title: 'Rappel de visite',
    body: 'Rappel : Vous avez une visite prévue pour "{{propertyTitle}}" {{visitDate}} à {{visitTime}}.',
  },
  {
    id: 'visit_reminder_sms',
    category: 'property',
    channel: 'sms',
    title: 'Rappel visite',
    body: 'AfriBayit: Rappel visite pour {{propertyTitle}} le {{visitDate}} à {{visitTime}}. {{propertyAddress}}',
  },
];
