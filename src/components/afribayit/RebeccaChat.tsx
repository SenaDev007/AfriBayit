'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateConversation } from '@/hooks/useChat';
import { apiPost } from '@/lib/api';

interface RebeccaChatProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp?: Date;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Quick actions — CDC §8.2.1 tool calling
const quickActions = [
  { id: 'search', label: 'Rechercher un bien', icon: '🔍', message: 'Je souhaite rechercher un bien immobilier' },
  { id: 'escrow', label: 'Suivi escrow', icon: '🔒', message: 'Je veux suivre l\'état de ma transaction escrow' },
  { id: 'agent', label: 'Contacter un agent', icon: '👤', message: 'Je souhaite contacter un agent immobilier' },
  { id: 'artisan', label: 'Devis artisan', icon: '🔨', message: 'Je souhaite obtenir un devis d\'artisan' },
  { id: 'market', label: 'Prix du marché', icon: '📊', message: 'Quels sont les prix du marché immobilier ?' },
];

const welcomeMessage: Message = {
  id: 'welcome',
  sender: 'bot',
  text: 'Bonjour ! 👋 Je suis Rebecca, votre assistante immobilière IA. Je peux vous aider à rechercher des biens, suivre vos transactions escrow, contacter des agents, obtenir des devis artisans, et bien plus encore. Comment puis-je vous aider aujourd\'hui ?',
  timestamp: new Date(),
};

export default function RebeccaChat({ isOpen, onClose, userId }: RebeccaChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const createConversationMutation = useCreateConversation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (activeConversationId) return activeConversationId;
    if (!userId) return null;

    try {
      const result = await createConversationMutation.mutateAsync({
        participantIds: [userId, 'rebecca-bot'],
        type: 'rebecca',
        title: 'Chat avec Rebecca IA',
      });
      const convId = (result as { id: string }).id;
      setActiveConversationId(convId);
      return convId;
    } catch {
      return null;
    }
  }, [activeConversationId, userId, createConversationMutation]);

  const sendMessage = async (text: string) => {
    if (isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setShowQuickActions(false);
    setIsSending(true);

    try {
      const convId = await ensureConversation();
      if (!convId) {
        setIsTyping(false);
        setIsSending(false);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'Désolée, je n\'ai pas pu établir de connexion. Veuillez réessayer dans un instant.',
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // Call POST /api/chat/conversations/[id]/messages
      // The server handles 'rebecca' type conversations by calling z-ai-web-dev-sdk for AI responses
      const response = await apiPost<{
        userMessage?: unknown;
        rebeccaMessage?: { id: string; content: string; senderId: string; createdAt: string };
      }>(`/api/chat/conversations/${convId}/messages`, {
        content: text,
        messageType: 'text',
      });

      setIsTyping(false);

      // The server returns { userMessage, rebeccaMessage } for rebecca-type conversations
      if (response?.rebeccaMessage) {
        const botMsg: Message = {
          id: response.rebeccaMessage.id || (Date.now() + 1).toString(),
          sender: 'bot',
          text: response.rebeccaMessage.content,
          timestamp: new Date(response.rebeccaMessage.createdAt),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Fallback if AI didn't respond
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'Merci pour votre message ! J\'analyse votre demande et je vous reviens rapidement. N\'hésitez pas à utiliser les actions rapides pour accéder à nos services. 🏠',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Rebecca chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Désolée, une erreur s\'est produite. Veuillez réessayer. 🙏',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    sendMessage(action.message);
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Chat Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-96 h-[520px] sm:h-[620px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-[#003087] p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">R</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Rebecca IA</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#00A651] rounded-full" />
                    <span className="text-white/70 text-[10px]">
                      {isSending ? 'Réflexion...' : 'En ligne · CDC §8.2.1'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Fermer le chat">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Actions Panel — CDC §8.2.1 Tool Calling */}
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pt-3 pb-2 border-b bg-[#003087]/5"
              >
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions rapides</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction(action)}
                      disabled={isSending}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#003087]/10 rounded-xl text-xs font-medium text-[#003087] hover:bg-[#003087]/5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    {/* Bot avatar for left-aligned messages */}
                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">R</span>
                        </div>
                        <span className="text-[10px] text-gray-400">Rebecca · {formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#003087] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-700 rounded-bl-md'
                    }`}>
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* User timestamp */}
                    {msg.sender === 'user' && msg.timestamp && (
                      <p className="text-[10px] text-gray-400 text-right mt-0.5 mr-1">{formatTime(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">R</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Rebecca écrit...</span>
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-md">
                      <div className="flex gap-1.5 items-center h-4">
                        <motion.span
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0, ease: 'easeInOut' }}
                        />
                        <motion.span
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.15, ease: 'easeInOut' }}
                        />
                        <motion.span
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Show Quick Actions Toggle */}
            {!showQuickActions && (
              <div className="px-4 pt-2">
                <button
                  onClick={() => setShowQuickActions(true)}
                  className="text-[10px] text-[#003087] font-medium hover:underline"
                >
                  ⚡ Afficher les actions rapides
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0" aria-label="Joindre un fichier">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && input.trim() && !isSending) sendMessage(input.trim()); }}
                  placeholder="Écrivez votre message..."
                  disabled={isSending}
                  className="flex-1 text-sm outline-none bg-transparent disabled:opacity-50"
                />
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0" aria-label="Commande vocale">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (input.trim() && !isSending) sendMessage(input.trim()); }}
                  disabled={isSending || !input.trim()}
                  className="w-10 h-10 bg-[#003087] rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Envoyer le message"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
