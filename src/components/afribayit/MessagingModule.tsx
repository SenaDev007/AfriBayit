'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch, apiPost } from '@/lib/api';
import { timeAgo } from '@/lib/afribayit-utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

interface MessagingModuleProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipientId?: string;
}

interface ConversationParticipant {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
  };
}

interface Conversation {
  id: string;
  type: string;
  status: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: Message[];
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  metadata?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function MessagingModule({ isOpen, onClose, initialRecipientId }: MessagingModuleProps) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await apiFetch<{ conversations: Conversation[] }>(
        `/api/messages?search=${encodeURIComponent(search)}`
      );
      setConversations(result.conversations);
    } catch {
      // silently fail
    }
  }, [userId, search]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      const result = await apiFetch<{ messages: Message[] }>(
        `/api/messages/${selectedConversation.id}`
      );
      setMessages(result.messages);
    } catch {
      // silently fail
    }
  }, [selectedConversation]);

  // Initial load when module opens
  useEffect(() => {
    if (isOpen) {
      apiFetch<{ conversations: Conversation[] }>(
        `/api/messages?search=${encodeURIComponent(search)}`
      )
        .then((result) => setConversations(result.conversations))
        .catch(() => {});
    }
  }, [isOpen, search]);

  // Polling for new messages (5s interval)
  useEffect(() => {
    if (isOpen && selectedConversation) {
      apiFetch<{ messages: Message[] }>(
        `/api/messages/${selectedConversation.id}`
      )
        .then((result) => setMessages(result.messages))
        .catch(() => {});

      pollingRef.current = setInterval(() => {
        apiFetch<{ messages: Message[] }>(
          `/api/messages/${selectedConversation.id}`
        )
          .then((result) => setMessages(result.messages))
          .catch(() => {});
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !userId) return;
    setSendingMessage(true);
    try {
      const payload: Record<string, unknown> = {
        content: messageInput.trim(),
        messageType: 'text',
      };

      if (selectedConversation) {
        payload.conversationId = selectedConversation.id;
      } else if (initialRecipientId) {
        payload.recipientId = initialRecipientId;
      }

      await apiPost('/api/messages', payload);

      if (!selectedConversation) {
        // New conversation was created, refresh list
        const result = await apiFetch<{ conversations: Conversation[] }>('/api/messages?search=');
        setConversations(result.conversations);
      }

      setMessageInput('');

      // Refresh messages
      if (selectedConversation) {
        const result = await apiFetch<{ messages: Message[] }>(
          `/api/messages/${selectedConversation.id}`
        );
        setMessages(result.messages);
      }
    } catch {
      // silently fail
    }
    setSendingMessage(false);
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p.userId !== userId)?.user;
  };

  const getRecipientName = (conv: Conversation) => {
    if (conv.type === 'rebecca') return 'Rebecca (IA)';
    const other = getOtherParticipant(conv);
    return other?.name || 'Conversation';
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.messageType) {
      case 'property_card':
        try {
          const property = msg.metadata ? JSON.parse(msg.metadata) : null;
          return (
            <div className="bg-[#003087]/5 border border-[#003087]/20 rounded-lg p-3 max-w-[250px]">
              <p className="text-xs font-semibold text-[#003087]">{property?.title || 'Propriété'}</p>
              <p className="text-[10px] text-gray-500">{property?.city}, {property?.price}</p>
            </div>
          );
        } catch {
          return <p className="text-sm">{msg.content}</p>;
        }
      case 'system':
        return (
          <div className="text-center">
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {msg.content}
            </span>
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Panel — Conversations List */}
          <div className="w-80 border-r flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[#2C2E2F] font-display">Messages</h2>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm h-9"
              />
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="text-3xl block mb-2">💬</span>
                  <p className="text-sm text-gray-500">Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                        isSelected ? 'bg-[#003087]/5 border-r-2 border-[#003087]' : ''
                      }`}
                    >
                      <div className="relative">
                        {conv.type === 'rebecca' ? (
                          <div className="w-10 h-10 rounded-full bg-[#9333ea]/10 flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                          </div>
                        ) : (
                          <ImageWithFallback
                            src={other?.avatar || ''}
                            alt={other?.name || 'Avatar'}
                            className="w-10 h-10 rounded-full object-cover"
                            fallbackType="avatar"
                          />
                        )}
                        {other?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A651] border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#2C2E2F] truncate">
                            {getRecipientName(conv)}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                            {conv.messages?.[0] ? timeAgo(conv.messages[0].createdAt) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {conv.messages?.[0]?.content || 'Aucun message'}
                        </p>
                      </div>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <Badge className="bg-[#003087] text-white text-[9px] h-5 min-w-[20px] flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </div>

          {/* Right Panel — Chat Thread */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3 bg-white">
                  {(() => {
                    const other = getOtherParticipant(selectedConversation);
                    return (
                      <>
                        {selectedConversation.type === 'rebecca' ? (
                          <div className="w-8 h-8 rounded-full bg-[#9333ea]/10 flex items-center justify-center">
                            <span className="text-sm">🤖</span>
                          </div>
                        ) : (
                          <ImageWithFallback
                            src={other?.avatar || ''}
                            alt={other?.name || 'Avatar'}
                            className="w-8 h-8 rounded-full object-cover"
                            fallbackType="avatar"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#2C2E2F]">
                            {getRecipientName(selectedConversation)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {other?.isOnline ? 'En ligne' : selectedConversation.type === 'rebecca' ? 'IA disponible' : 'Hors ligne'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === userId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                            msg.messageType === 'system' ? 'justify-center' : ''
                          }`}
                        >
                          {msg.messageType !== 'system' && (
                            <div
                              className={`max-w-[70%] ${
                                isOwn
                                  ? 'bg-[#003087] text-white rounded-2xl rounded-br-sm'
                                  : 'bg-gray-100 text-[#2C2E2F] rounded-2xl rounded-bl-sm'
                              } px-4 py-2.5`}
                            >
                              {renderMessageContent(msg)}
                              <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {timeAgo(msg.createdAt)}
                              </p>
                            </div>
                          )}
                          {msg.messageType === 'system' && renderMessageContent(msg)}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Écrire un message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={sendingMessage}
                      className="flex-1 h-10"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sendingMessage || !messageInput.trim()}
                      className="p-2.5 bg-[#003087] text-white rounded-lg hover:bg-[#002266] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl block mb-4">💬</span>
                  <h3 className="text-lg font-semibold text-[#2C2E2F]">Vos messages</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs">
                    Sélectionnez une conversation ou contactez un agent immobilier pour commencer.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
