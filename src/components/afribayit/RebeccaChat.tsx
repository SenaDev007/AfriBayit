'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RebeccaChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  quickReplies?: string[];
  propertyCard?: { title: string; price: string; city: string; image: string };
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Bonjour ! 👋 Je suis Rebecca, votre assistante immobilière IA. Comment puis-je vous aider aujourd\'hui ?',
    quickReplies: ['Chercher un bien', 'Estimer mon bien', 'Info escrow', 'Contacter un agent'],
  },
];

export default function RebeccaChat({ isOpen, onClose }: RebeccaChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botReplies: Record<string, Partial<Message>> = {
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
          text: 'L\'escrow AfriBayit protège vos fonds pendant toute la transaction. Voici comment ça fonctionne :\n\n1️⃣ Acheteur dépose les fonds\n2️⃣ Fonds bloqués en escrow sécurisé\n3️⃣ Vérification des documents\n4️⃣ Signature notariale\n5️⃣ Libération des fonds au vendeur\n\nToute la procédure est sécurisée et transparente ! 🛡️',
          quickReplies: ['Démarrer une transaction', 'Frais escrow', 'Contacter un notaire'],
        },
        'Contacter un agent': {
          text: 'Je vais vous mettre en contact avec un agent certifié dans votre zone. Dans quelle ville se trouve votre recherche ?',
          quickReplies: ['Cotonou', 'Abidjan', 'Lomé', 'Ouagadougou'],
        },
      };

      const reply = botReplies[text] || {
        text: 'Merci pour votre message ! Je analyse votre demande et je vous reviens rapidement. En attendant, n\'hésitez pas à explorer nos biens disponibles.',
        quickReplies: ['Chercher un bien', 'Estimer mon bien', 'Info escrow'],
      };

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply.text || '',
        quickReplies: reply.quickReplies,
        propertyCard: reply.propertyCard,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1500);
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
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-96 h-[500px] sm:h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border"
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
                    <span className="text-white/70 text-[10px]">En ligne</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.sender === 'user' ? '' : ''}`}>
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

                    {/* Property Card */}
                    {msg.propertyCard && (
                      <div className="mt-2 bg-white rounded-2xl border shadow-sm overflow-hidden max-w-full">
                        <img src={msg.propertyCard.image} alt="" className="w-full h-28 object-cover" />
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
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-md">
                    <div className="flex gap-1.5">
                      <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                      <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                      <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) sendMessage(input.trim()); }}
                  placeholder="Écrivez votre message..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (input.trim()) sendMessage(input.trim()); }}
                  className="w-10 h-10 bg-[#003087] rounded-full flex items-center justify-center shrink-0"
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
