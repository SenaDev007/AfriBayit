// AfriBayit — Rebecca WhatsApp Channel
// POST /api/rebecca/whatsapp — Webhook for WhatsApp Business API

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { applyGuardrails } from '@/lib/rebecca/guardrails';
import { shouldHandoffToHuman } from '@/lib/rebecca/handoff';
import { RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

// WhatsApp Business API verification
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'afribayit-whatsapp-verify';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// WhatsApp message webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify WhatsApp signature (production)
    const signature = request.headers.get('x-hub-signature-256');
    if (process.env.NODE_ENV === 'production' && !verifyWhatsAppSignature(body, signature)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    // Parse WhatsApp webhook payload
    const entries = body?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        if (change?.field !== 'messages') continue;

        const value = change?.value;
        const messages = value?.messages || [];

        for (const message of messages) {
          const from = message?.from; // Phone number
          const messageId = message?.id;
          const timestamp = message?.timestamp;
          const type = message?.type; // text, document, location, image, etc.

          if (!from || !messageId) continue;

          let userMessage = '';
          let messageContext: Record<string, unknown> = {};

          switch (type) {
            case 'text':
              userMessage = message.text?.body || '';
              break;

            case 'document':
              userMessage = `[Document reçu: ${message.document?.filename || 'sans nom'}] ${message.document?.caption || ''}`;
              messageContext = {
                documentUrl: message.document?.link,
                documentFilename: message.document?.filename,
                documentMimetype: message.document?.mime_type,
              };
              break;

            case 'location':
              userMessage = `[Position partagée] Lat: ${message.location?.latitude}, Lng: ${message.location?.longitude}`;
              messageContext = {
                latitude: message.location?.latitude,
                longitude: message.location?.longitude,
                address: message.location?.address,
                name: message.location?.name,
              };
              break;

            case 'image':
              userMessage = `[Image reçue] ${message.image?.caption || ''}`;
              messageContext = {
                imageUrl: message.image?.link,
                imageMimetype: message.image?.mime_type,
              };
              break;

            case 'interactive':
              if (message.interactive?.button_reply) {
                userMessage = message.interactive.button_reply.title || '';
              } else if (message.interactive?.list_reply) {
                userMessage = message.interactive.list_reply.title || '';
              }
              break;

            default:
              userMessage = `[Message de type ${type} non supporté]`;
          }

          if (!userMessage) continue;

          // Apply guardrails
          const guardResult = applyGuardrails(userMessage);
          if (!guardResult.allowed) {
            await sendWhatsAppMessage(from, 'Je suis désolée, je ne peux pas traiter ce type de message. Pourriez-vous reformuler votre demande ?');
            continue;
          }

          // Check for human handoff
          const handoffResult = shouldHandoffToHuman({
            message: userMessage,
            sentiment: 'neutral',
            consecutiveFailures: 0,
          });

          if (handoffResult.shouldHandoff) {
            await sendWhatsAppMessage(from, 'Je vais vous mettre en contact avec un de nos conseillers. Un instant svp... <RefreshCw className="w-4 h-4" />');
            // TODO: Create handoff ticket in DB and notify support team
            continue;
          }

          // Process through Rebecca chat
          try {
            const rebeccaResponse = await processWhatsAppMessage(
              guardResult.sanitized || userMessage,
              from,
              messageContext
            );

            await sendWhatsAppMessage(from, rebeccaResponse);
          } catch (chatError) {
            console.error('Rebecca WhatsApp chat error:', chatError);
            await sendWhatsAppMessage(from, 'Je rencontre une difficulté technique. Veuillez réessayer dans quelques instants ou contactez-nous à support@afribayit.com.');
          }
        }
      }
    }

    // Always return 200 quickly to acknowledge receipt (WhatsApp requirement)
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'ok' }); // Still return 200
  }
}

/**
 * Process a WhatsApp message through Rebecca AI
 */
async function processWhatsAppMessage(
  message: string,
  from: string,
  context: Record<string, unknown>
): Promise<string> {
  try {
    const { default: ZAI } = await import('z-ai-web-dev-sdk');
    const zai = new ZAI();

    const systemPrompt = `Tu es Rebecca, l'assistante IA immobilière d'AfriBayit. Tu réponds via WhatsApp, donc tes réponses doivent être:
- Concises (max 300 caractères si possible)
- En français
- Sans markdown (pas de ** ou ##)
- Avec des emojis modérés

Tu es experte en immobilier en Afrique de l'Ouest (Bénin, Côte d'Ivoire, Burkina Faso, Togo).

${context.latitude ? `L'utilisateur a partagé sa position: Lat ${context.latitude}, Lng ${context.longitude}${context.address ? `, Adresse: ${context.address}` : ''}` : ''}`;

    const response = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return response.choices?.[0]?.message?.content || 'Je suis désolée, je n\'ai pas pu traiter votre demande. Réessayez svp.';
  } catch {
    return 'Service temporairement indisponible. Contactez-nous à support@afribayit.com';
  }
}

/**
 * Send a WhatsApp message back to the user
 */
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.log('[WhatsApp] Would send to:', to, 'Message:', text.substring(0, 50) + '...');
    return; // In dev, just log
  }

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
  }
}

/**
 * Verify WhatsApp webhook signature
 */
function verifyWhatsAppSignature(body: unknown, signature: string | null): boolean {
  if (!signature || !process.env.WHATSAPP_APP_SECRET) return true; // Skip in dev

  try {
    const expected = createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    return signature === `sha256=${expected}`;
  } catch {
    return false;
  }
}
