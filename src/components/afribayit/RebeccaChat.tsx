'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations, useChatMessages, useSendMessage, useCreateConversation } from '@/hooks/useChat';

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
  quickReplies?: string[];
  propertyCard?: { title: string; price: string; city: string; image: string };
  toolCall?: { tool: string; args: Record<string, unknown>; result?: string };
}

interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  messageType: string;
  createdAt: string;
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

// Rebecca's tool definitions — CDC §8.2.1
const rebeccaTools = [
  { name: 'search_properties', description: 'Rechercher des biens immobiliers' },
  { name: 'get_property_details', description: 'Obtenir les détails d\'un bien' },
  { name: 'check_escrow_status', description: 'Vérifier le statut escrow' },
  { name: 'book_hotel', description: 'Réserver un hôtel' },
  { name: 'request_geometer', description: 'Demander un géomètre' },
  { name: 'contact_agent', description: 'Contacter un agent' },
  { name: 'get_market_prices', description: 'Consulter les prix du marché' },
];

const welcomeMessage: Message = {
  id: 'welcome',
  sender: 'bot',
  text: 'Bonjour ! 👋 Je suis Rebecca, votre assistante immobilière IA. Je peux vous aider à rechercher des biens, suivre vos transactions escrow, contacter des agents, obtenir des devis artisans, et bien plus encore. Comment puis-je vous aider aujourd\'hui ?',
  timestamp: new Date(),
};

const botReplies: Record<string, Partial<Message>> = {
  'Je souhaite rechercher un bien immobilier': {
    text: 'Parfait ! Je vais utiliser l\'outil de recherche de biens pour vous aider. 🏠\n\nQuel type de bien recherchez-vous ? Voici quelques suggestions populaires :',
    propertyCard: {
      title: 'Villa Prestige Les Cocotiers',
      price: '85 000 000 FCFA',
      city: 'Cotonou, Bénin',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=150&fit=crop',
    },
    quickReplies: ['Voir plus de villas', 'Appartements', 'Terrains'],
    toolCall: { tool: 'search_properties', args: { query: 'biens populaires', filters: {} } },
  },
  'Je veux suivre l\'état de ma transaction escrow': {
    text: 'Bien sûr ! Je vais vérifier le statut de vos transactions escrow. 🔒\n\nVoici l\'état actuel de votre transaction :\n\n📋 Transaction #TX-2025-001\nÉtat : FUNDED → En attente de validation des documents\nMontant : 85 000 000 FCFA\nProchaine étape : Vérification des documents légaux\n\nVoulez-vous plus de détails ?',
    quickReplies: ['Voir le timeline complet', 'Contacter le notaire', 'Signaler un litige'],
    toolCall: { tool: 'check_escrow_status', args: { transaction_id: 'TX-2025-001' } },
  },
  'Je souhaite contacter un agent immobilier': {
    text: 'Je vais vous mettre en contact avec un agent certifié dans votre zone. 👤\n\nDans quelle ville se trouve votre recherche ?',
    quickReplies: ['Cotonou', 'Abidjan', 'Lomé', 'Ouagadougou'],
    toolCall: { tool: 'contact_agent', args: { agent_id: 'auto' } },
  },
  'Je souhaite obtenir un devis d\'artisan': {
    text: 'Je peux vous aider à obtenir un devis artisan ! 🔨\n\nQuel type de travaux souhaitez-vous réaliser ?',
    quickReplies: ['Maçonnerie', 'Plomberie', 'Électricité', 'Peinture', 'Carrelage'],
    toolCall: { tool: 'request_geometer', args: { property_id: 'auto', service: 'devis_artisan' } },
  },
  'Quels sont les prix du marché immobilier ?': {
    text: 'Voici les tendances du marché immobilier dans la zone UEMOA : 📊\n\n🏠 Villa à Cotonou : 25M - 150M FCFA\n🏢 Appartement Abidjan : 15M - 80M FCFA\n🗺️ Terrain Lomé : 5M - 50M FCFA\n📈 Tendance : +8% par an en moyenne\n\nLes prix varient selon le quartier et la proximité des infrastructures. Voulez-vous une estimation plus précise ?',
    quickReplies: ['Estimer mon bien', 'Voir les tendances par ville', 'Investissement recommandé'],
    toolCall: { tool: 'get_market_prices', args: { city: 'UEMOA', type: 'all' } },
  },
  'Chercher un bien': {
    text: 'Parfait ! Quel type de bien recherchez-vous ? Voici quelques suggestions populaires :',
    propertyCard: {
      title: 'Villa Prestige Les Cocotiers',
      price: '85 000 000 FCFA',
      city: 'Cotonou, Bénin',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=150&fit=crop',
    },
    quickReplies: ['Voir plus de villas', 'Appartements', 'Terrains'],
  },
  'Estimer mon bien': {
    text: 'Je peux vous aider à estimer votre bien ! Pour cela, j\'ai besoin de quelques informations. Quel type de bien possédez-vous ?',
    quickReplies: ['Villa', 'Appartement', 'Terrain'],
  },
  'Info escrow': {
    text: 'L\'escrow AfriBayit protège vos fonds pendant toute la transaction. Voici comment ça fonctionne :\n\n1️⃣ Acheteur dépose les fonds\n2️⃣ Fonds bloqués en escrow sécurisé\n3️⃣ Vérification des documents\n4️⃣ Validation géomatique GeoTrust\n5️⃣ Assignation du notaire\n6️⃣ Signature notariale\n7️⃣ Enregistrement ANDF\n8️⃣ Libération des fonds au vendeur\n\nToute la procédure est sécurisée et transparente ! 🛡️',
    quickReplies: ['Démarrer une transaction', 'Frais escrow', 'Contacter un notaire'],
  },
  'Contacter un agent': {
    text: 'Je vais vous mettre en contact avec un agent certifié dans votre zone. Dans quelle ville se trouve votre recherche ?',
    quickReplies: ['Cotonou', 'Abidjan', 'Lomé', 'Ouagadougou'],
  },
};

export default function RebeccaChat({ isOpen, onClose, userId }: RebeccaChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversationsData } = useConversations(userId);
  const { data: chatMessagesData } = useChatMessages(activeConversationId || '');
  const sendMessageMutation = useSendMessage();
  const createConversationMutation = useCreateConversation();

  const conversations: ChatConversation[] = (conversationsData?.conversations as ChatConversation[]) || [];
  const chatMessages: ChatMessage[] = (chatMessagesData?.messages as ChatMessage[]) || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
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

    // Persist message via API if we have an active conversation
    if (activeConversationId && userId) {
      try {
        await sendMessageMutation.mutateAsync({
          conversationId: activeConversationId,
          senderId: userId,
          content: text,
          messageType: 'text',
        });
      } catch {
        // Silently fail — local state still works
      }
    } else if (userId) {
      try {
        const result = await createConversationMutation.mutateAsync({
          participantIds: [userId, 'rebecca-bot'],
          type: 'ai_assistant',
          title: 'Chat avec Rebecca IA',
        });
        const convId = (result as { id: string }).id;
        setActiveConversationId(convId);
      } catch {
        // Silently fail
      }
    }

    // Simulate bot response with typing delay
    const typingDuration = 1000 + Math.random() * 1500;
    setTimeout(() => {
      setIsTyping(false);
      const reply = botReplies[text] || {
        text: 'Merci pour votre message ! J\'analyse votre demande et je vous reviens rapidement. En attendant, n\'hésitez pas à utiliser les raccourcis ci-dessus pour accéder à nos services : recherche de biens, suivi escrow, devis artisans, prix du marché. 🏠',
        quickReplies: ['Rechercher un bien', 'Suivi escrow', 'Contacter un agent', 'Prix du marché'],
      };

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply.text || '',
        timestamp: new Date(),
        quickReplies: reply.quickReplies,
        propertyCard: reply.propertyCard,
        toolCall: reply.toolCall,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, typingDuration);
  };

  const handleQuickAction = (action: typeof quickActions[number]) => {
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
                    <span className="text-white/70 text-[10px]">En ligne · CDC §8.2.1</span>
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
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#003087]/10 rounded-xl text-xs font-medium text-[#003087] hover:bg-[#003087]/5 transition-colors whitespace-nowrap shrink-0"
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

                    {/* Tool call indicator */}
                    {msg.toolCall && (
                      <div className="mt-1.5 px-3 py-1.5 bg-[#009CDE]/5 rounded-lg flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-[#009CDE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10px] text-[#009CDE] font-medium">
                          Outil : {rebeccaTools.find(t => t.name === msg.toolCall?.tool)?.description || msg.toolCall.tool}
                        </span>
                      </div>
                    )}

                    {/* Property Card */}
                    {msg.propertyCard && (
                      <div className="mt-2 bg-white rounded-2xl border shadow-sm overflow-hidden max-w-full">
                        <img src={msg.propertyCard.image} alt={msg.propertyCard.title} className="w-full h-28 object-cover" />
                        <div className="p-3">
                          <p className="text-xs font-semibold text-[#2C2E2F]">{msg.propertyCard.title}</p>
                          <p className="text-[10px] text-gray-500">{msg.propertyCard.city}</p>
                          <p className="font-mono-data text-sm font-bold text-[#D4AF37] mt-1">{msg.propertyCard.price}</p>
                        </div>
                      </div>
                    )}

                    {/* Quick Replies */}
                    {msg.quickReplies && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => sendMessage(reply)}
                            className="px-3 py-1.5 bg-white border border-[#003087]/20 text-[#003087] text-xs font-medium rounded-full hover:bg-[#003087]/5 transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
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
                  onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) sendMessage(input.trim()); }}
                  placeholder="Écrivez votre message..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0" aria-label="Commande vocale">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (input.trim()) sendMessage(input.trim()); }}
                  className="w-10 h-10 bg-[#003087] rounded-full flex items-center justify-center shrink-0"
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
