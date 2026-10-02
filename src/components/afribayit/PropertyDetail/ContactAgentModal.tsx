'use client';

/**
 * ContactAgentModal — contacter l'agent d'un bien via la messagerie interne.
 *
 * RETOUR CLIENT 02/10 : « Contacter l'agent ouvre la page de login alors que
 * l'utilisateur est déjà connecté » — le bouton redirigeait vers /auth/login
 * sans aucune logique. Cette modale ouvre un VRAI canal de contact :
 *   1. Crée (ou réutilise) une conversation user_to_user avec l'agent via
 *      POST /api/chat/conversations (metadata.propertyId pour le contexte).
 *   2. Envoie le premier message via POST /api/chat/conversations/[id]/messages.
 *   3. Propose le WhatsApp de l'agent en parallèle (canal direct, usuel en
 *      Afrique de l'Ouest).
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Loader2, CheckCircle2, Phone } from 'lucide-react';
import { apiFetch, apiPost } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n/use-translate';

interface ContactAgentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  agent: { id?: string; name?: string; phone?: string } | undefined;
}

interface ConversationResponse {
  id: string;
  conversation?: { id: string };
}

export default function ContactAgentModal({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  agent,
}: ContactAgentModalProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const agentId = agent?.id;
  const waLink = agent?.phone
    ? `https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Bonjour, je suis intéressé(e) par « ${propertyTitle} » sur AfriBayit.`,
      )}`
    : null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Écrivez un message avant d’envoyer');
      return;
    }
    if (!agentId) {
      setError('Agent indisponible pour ce bien — utilisez le WhatsApp ci-dessous');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 1. Conversation avec l'agent (l'API ajoute l'utilisateur courant
      //    automatiquement comme participant)
      const conv = await apiPost<ConversationResponse>('/api/chat/conversations', {
        participantIds: [agentId],
        type: 'user_to_user',
        metadata: {
          propertyId,
          propertyTitle,
          origin: 'property_detail_contact_agent',
        },
      });
      const conversationId = conv?.id || conv?.conversation?.id;
      if (!conversationId) throw new Error('Conversation non créée');

      // 2. Premier message
      await apiPost(`/api/chat/conversations/${conversationId}/messages`, {
        content: message.trim().slice(0, 2000),
        messageType: 'text',
      });

      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’envoi du message');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setMessage('');
    setError('');
    setSent(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-3xl bg-white border border-primary-pale">
        <DialogTitle className="sr-only">
          {t('propertyDetail.contact.title', 'Contacter l’agent')} — {propertyTitle}
        </DialogTitle>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-serif text-xl font-bold text-primary-deep mb-2">
              Message envoyé à {agent?.name || 'l’agent'}
            </h3>
            <p className="text-sm text-gray-text mb-6">
              Vous retrouverez la conversation dans votre espace Communauté → Messages.
              L’agent vous répond directement depuis sa messagerie AfriBayit.
            </p>
            <button
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="px-8 py-3 rounded-full bg-primary-green text-white text-sm font-bold hover:bg-primary-deep transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-accent-yellow/15 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-accent-dark" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-primary-deep leading-tight">
                  Contacter {agent?.name || 'l’agent'}
                </h3>
                <p className="text-xs text-gray-text truncate">Au sujet de « {propertyTitle} »</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 text-center mb-4">
                {error}
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              rows={5}
              autoFocus
              placeholder={`Bonjour ${agent?.name || ''}, je suis intéressé(e) par « ${propertyTitle} ». Est-il toujours disponible ? Serait-il possible d’avoir plus d’informations (visite, documents, prix négociable) ?`}
              className="w-full px-4 py-3 rounded-xl border border-primary-pale bg-white text-sm text-gray-text outline-none focus:ring-2 focus:ring-primary-green/40 resize-none placeholder:text-gray-400"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || !message.trim() || !agentId}
              className="w-full mt-4 py-3.5 rounded-full bg-primary-green hover:bg-primary-deep text-white font-bold text-sm shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Envoi…' : 'Envoyer le message'}
            </button>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 py-3 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C4A] font-bold text-sm border border-[#25D366]/30 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp direct — {agent?.phone}
              </a>
            )}

            <p className="text-[11px] text-gray-text/70 text-center mt-3">
              Message privé via la messagerie sécurisée AfriBayit — votre numéro
              n’est jamais divulgué.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
