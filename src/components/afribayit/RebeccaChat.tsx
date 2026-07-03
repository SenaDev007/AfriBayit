'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '@/lib/api-client';
import { BarChart3, Bot, ClipboardList, Coins, FileText, Hammer, HelpCircle, Home, Landmark, Lock, MessageCircle, HandHeart, Scale, Search, Zap } from 'lucide-react';

interface RebeccaChatProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface SourceInfo {
  type: string;
  source: string;
  score: number;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp?: Date;
  sources?: SourceInfo[];
  functionsCalled?: string[];
  isStreaming?: boolean;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Quick actions — enhanced with more options
const quickActions = [
  { id: 'search', label: 'Rechercher un bien', icon: <Search className="w-3.5 h-3.5" />, message: 'Je souhaite rechercher un bien immobilier' },
  { id: 'escrow', label: 'Suivi escrow', icon: <Lock className="w-3.5 h-3.5" />, message: 'Je veux suivre l\'état de ma transaction escrow' },
  { id: 'avm', label: 'Estimer valeur', icon: <Coins className="w-3.5 h-3.5" />, message: 'Je souhaite estimer la valeur d\'un bien immobilier' },
  { id: 'artisan', label: 'Trouver artisan', icon: <Hammer className="w-3.5 h-3.5" />, message: 'Je cherche un artisan certifié pour des travaux' },
  { id: 'market', label: 'Prix du marché', icon: <BarChart3 className="w-3.5 h-3.5" />, message: 'Quels sont les prix du marché immobilier ?' },
  { id: 'legal', label: 'Conseil légal', icon: <Scale className="w-3.5 h-3.5" />, message: 'Quels documents sont nécessaires pour une transaction ?' },
  { id: 'finance', label: 'Financement', icon: <Landmark className="w-3.5 h-3.5" />, message: 'Je souhaite simuler un financement immobilier' },
  { id: 'docs', label: 'Analyser doc', icon: <FileText className="w-3.5 h-3.5" />, message: 'Je veux analyser un document immobilier' },
];

const welcomeMessage: Message = {
  id: 'welcome',
  sender: 'bot',
  text: 'Bonjour ! Je suis **Rebecca**, votre assistante immobilière IA d\'AfriBayit.\n\nJe peux vous aider à :\n<Search className="w-4 h-4" /> Rechercher des biens immobiliers\n<Lock className="w-4 h-4" /> Suivre vos transactions escrow\n<Coins className="w-4 h-4" /> Estimer la valeur d\'un bien\n<Hammer className="w-4 h-4" /> Trouver des artisans certifiés\n<BarChart3 className="w-4 h-4" /> Analyser le marché immobilier\n<Scale className="w-4 h-4" /> Conseils sur les procédures légales\n Simuler un financement\n\nComment puis-je vous aider aujourd\'hui ?',
  timestamp: new Date(),
};

export default function RebeccaChat({ isOpen, onClose, userId }: RebeccaChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (activeConversationId) return activeConversationId;
    if (!userId) return null;

    try {
      const result = await apiPost<{ id: string }>('/api/chat/conversations', {
        participantIds: [userId, 'rebecca-bot'],
        type: 'rebecca',
        title: 'Chat avec Rebecca IA',
      });
      const convId = result.id;
      setActiveConversationId(convId);
      return convId;
    } catch {
      return null;
    }
  }, [activeConversationId, userId]);

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

      // Build messages array for API
      const chatMessages = messages
        .filter((m) => m.id !== 'welcome')
        .concat(userMsg)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      // Call the dedicated Rebecca chat endpoint
      const response = await fetch('/api/rebecca/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          sessionId: convId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Rebecca API error');
      }

      const data = await response.json();

      setIsTyping(false);

      // Create bot message with sources
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.message || 'Je suis désolée, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date(),
        sources: data.sources || [],
        functionsCalled: data.functionsCalled || [],
      };
      setMessages((prev) => [...prev, botMsg]);

      // Update conversation ID if returned
      if (data.sessionId && !activeConversationId) {
        setActiveConversationId(data.sessionId);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Rebecca chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Désolée, une erreur s\'est produite. Veuillez réessayer. <HandHeart className="w-4 h-4" />',
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

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) newSet.delete(messageId);
      else newSet.add(messageId);
      return newSet;
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Simple markdown-like rendering
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold
      const boldRendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: boldRendered }} />
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const getSourceIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      property: <Home className="w-3 h-3" />,
      legal_doc: <FileText className="w-3 h-3" />,
      faq: <HelpCircle className="w-3 h-3" />,
      market_data: <BarChart3 className="w-3 h-3" />,
      artisan: <Hammer className="w-3 h-3" />,
    };
    return icons[type] || <ClipboardList className="w-3 h-3" />;
  };

  const getFunctionLabel = (fn: string) => {
    const labels: Record<string, string> = {
      search_properties: 'Recherche biens',
      check_escrow: 'Vérification escrow',
      get_market_stats: 'Statistiques marché',
      find_artisans: 'Recherche artisans',
      calculate_financing: 'Simulation financement',
      get_property_details: 'Détails bien',
    };
    return labels[fn] || fn;
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="rebecca-chat-title"
            aria-label="Chat Rebecca IA"
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-[420px] h-[560px] sm:h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#003087] to-[#002266] p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">R</span>
                </div>
                <div>
                  <h3 id="rebecca-chat-title" className="text-white font-semibold text-sm">Rebecca IA</h3>
                  <div className="flex items-center gap-1">
                    <motion.span
                      className="w-2 h-2 bg-[#00A651] rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-white/70 text-[10px]">
                      {isSending ? 'Réflexion...' : 'En ligne · IA + RAG + AVM'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Actions rapides"
                  title="Actions rapides"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Fermer le chat">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pt-3 pb-2 border-b bg-gradient-to-b from-[#003087]/5 to-transparent overflow-hidden"
                >
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions rapides</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickActions.map((action) => (
                      <motion.button
                        key={action.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action)}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-2.5 py-2 bg-white border border-[#003087]/10 rounded-xl text-[11px] font-medium text-[#003087] hover:bg-[#003087]/5 transition-colors disabled:opacity-50 text-left"
                      >
                        {action.icon}
                        <span className="truncate">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[88%]">
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
                        : 'bg-gray-50 text-gray-700 rounded-bl-md border border-gray-100'
                    }`}>
                      {renderText(msg.text)}
                    </div>

                    {/* Function call indicators */}
                    {msg.functionsCalled && msg.functionsCalled.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {msg.functionsCalled.map((fn) => (
                          <span key={fn} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#009CDE]/10 text-[#009CDE] rounded-md text-[9px] font-medium">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {getFunctionLabel(fn)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1 text-[10px] text-[#003087]/60 hover:text-[#003087] font-medium transition-colors"
                        >
                          <svg className={`w-3 h-3 transition-transform ${expandedSources.has(msg.id) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                        </button>
                        <AnimatePresence>
                          {expandedSources.has(msg.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1 space-y-1 overflow-hidden"
                            >
                              {msg.sources.map((source, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg text-[10px]">
                                  {getSourceIcon(source.type)}
                                  <span className="text-gray-600 truncate">{source.source}</span>
                                  <span className="text-gray-400 ml-auto shrink-0">{Math.round(source.score * 100)}%</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

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
                      <span className="text-[10px] text-gray-400">Rebecca analyse...</span>
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 rounded-bl-md border border-gray-100">
                      <div className="flex gap-1.5 items-center h-4">
                        <motion.span
                          className="w-2 h-2 bg-[#003087]/40 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0, ease: 'easeInOut' }}
                        />
                        <motion.span
                          className="w-2 h-2 bg-[#003087]/40 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.15, ease: 'easeInOut' }}
                        />
                        <motion.span
                          className="w-2 h-2 bg-[#003087]/40 rounded-full"
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

            {/* Input Bar */}
            <div className="p-3 border-t shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                  aria-label="Joindre un document"
                  title="Analyser un document"
                >
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
                  aria-label="Posez votre question à Rebecca"
                  placeholder="Posez votre question à Rebecca..."
                  disabled={isSending}
                  className="flex-1 text-sm outline-none bg-transparent disabled:opacity-50 placeholder:text-gray-400"
                />
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                  aria-label="Commande vocale"
                  title="Recherche vocale"
                  onClick={() => {
                    // Trigger voice search
                    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      if (SpeechRecognitionCtor) {
                        const recognition = new SpeechRecognitionCtor();
                        recognition.lang = 'fr-FR';
                        recognition.continuous = false;
                        recognition.interimResults = false;
                        recognition.onresult = (event: any) => {
                          const transcript = event.results?.[0]?.[0]?.transcript;
                          if (transcript) {
                            setInput(transcript);
                            if (transcript.trim()) sendMessage(transcript.trim());
                          }
                        };
                        recognition.start();
                      }
                    }
                  }}
                >
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
              <div className="flex items-center justify-between mt-1 px-1">
                <p className="text-[9px] text-gray-400">Propulsé par IA · RAG · AVM</p>
                {!showQuickActions && (
                  <button
                    onClick={() => setShowQuickActions(true)}
                    className="text-[9px] text-[#003087] font-medium hover:underline flex items-center gap-0.5"
                  >
                    <Zap className="w-2.5 h-2.5" /> Actions
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
