// AfriBayit — Notification Template Registry
// Central registry for all notification templates

import type { NotificationTemplate, NotificationCategory, NotificationChannel } from '../types';
import { propertyTemplates } from './property';
import { escrowTemplates } from './escrow';
import { authTemplates } from './auth';
import { communityTemplates } from './community';

const allTemplates: NotificationTemplate[] = [
  ...propertyTemplates,
  ...escrowTemplates,
  ...authTemplates,
  ...communityTemplates,
];

// Index by template ID for fast lookup
const templateById = new Map<string, NotificationTemplate>();
allTemplates.forEach(t => templateById.set(t.id, t));

// Index by (category, channel) for channel-based lookup
const templatesByCategoryChannel = new Map<string, NotificationTemplate[]>();
allTemplates.forEach(t => {
  const key = `${t.category}:${t.channel}`;
  const existing = templatesByCategoryChannel.get(key) || [];
  existing.push(t);
  templatesByCategoryChannel.set(key, existing);
});

/**
 * Get a template by its ID
 */
export function getTemplate(templateId: string): NotificationTemplate | undefined {
  return templateById.get(templateId);
}

/**
 * Get templates for a specific category and channel
 */
export function getTemplatesForChannel(
  category: NotificationCategory,
  channel: NotificationChannel
): NotificationTemplate[] {
  return templatesByCategoryChannel.get(`${category}:${channel}`) || [];
}

/**
 * Resolve a template with variable substitution
 */
export function resolveTemplate(
  template: NotificationTemplate,
  variables: Record<string, string>
): NotificationTemplate {
  const resolve = (str: string): string => {
    let result = str;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  return {
    ...template,
    title: resolve(template.title),
    body: resolve(template.body),
    subject: template.subject ? resolve(template.subject) : undefined,
    htmlBody: template.htmlBody ? resolve(template.htmlBody) : undefined,
  };
}

/**
 * Get all templates for a category
 */
export function getTemplatesForCategory(category: NotificationCategory): NotificationTemplate[] {
  return allTemplates.filter(t => t.category === category);
}

export { allTemplates };
