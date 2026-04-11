"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "rebecca";
  text: string;
  time: string;
}

const WELCOME: Message = {
  id: "0",
  role: "rebecca",
  text: "Bonjour ! Je suis Rebecca, votre assistante immobilière AfriBayit. Je peux vous aider à trouver un bien, comprendre une transaction escrow, contacter un artisan ou répondre à toutes vos questions sur nos services. Comment puis-je vous aider aujourd'hui ?",
  time: now(),
};

const SUGGESTIONS = [
  "Trouver un appartement à Cotonou",
  "Comment fonctionne l'escrow ?",
  "Contacter un artisan BTP",
  "Investir depuis la diaspora",
];

function now() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// Static demo responses per CDC Section 8.2 scenarios
function getRebeccaReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("escrow") || t.includes("paiement") || t.includes("transaction")) {
    return "L'escrow AfriBayit sécurise 100% de vos transactions immobilières. Les fonds sont bloqués dès que l'acheteur paie, puis libérés uniquement lorsque toutes les conditions sont remplies (documents validés, inspection terrain GeoTrust si requise, confirmation des deux parties). Aucune transaction hors escrow n'est autorisée sur notre plateforme.";
  }
  if (t.includes("artisan") || t.includes("btp") || t.includes("plombier") || t.includes("électricien")) {
    return "Notre marketplace artisans référence des professionnels BTP certifiés AfriBayit au Bénin, Côte d'Ivoire, Burkina Faso et Togo. Chaque artisan est vérifié avec KYC, assurance professionnelle, et noté par ses clients. Voulez-vous que je vous aide à trouver un artisan pour un type de travaux spécifique ?";
  }
  if (t.includes("diaspora") || t.includes("investir") || t.includes("investissement")) {
    return "Pour les investisseurs de la diaspora, nous proposons le Package Investisseur : réservation d'un hôtel partenaire + visites terrain planifiées avec un agent certifié AfriBayit + sécurisation par escrow en EUR via Stripe avec paiement Mobile Money vers le vendeur. Souhaitez-vous en savoir plus ?";
  }
  if (t.includes("cotonou") || t.includes("abidjan") || t.includes("ouaga") || t.includes("lomé")) {
    const city = t.includes("cotonou") ? "Cotonou" : t.includes("abidjan") ? "Abidjan" : t.includes("lomé") ? "Lomé" : "Ouagadougou";
    return `Excellente destination ! J'ai accès aux annonces actualisées à ${city}. Pour affiner ma recherche, pouvez-vous me préciser : (1) type de bien recherché (appartement, villa, terrain…) ? (2) votre budget approximatif ? (3) vous achetez ou vous louez ?`;
  }
  if (t.includes("geotrust") || t.includes("géomètre") || t.includes("terrain")) {
    return "Le module GeoTrust AfriBayit permet de faire valider physiquement un terrain par un géomètre certifié. Services disponibles : levé topographique, bornage, vérification de superficie, géolocalisation GPS précise, inspection pré-achat et détection de conflits fonciers. Un rapport officiel est généré et ancré blockchain pour preuve opposable.";
  }
  if (t.includes("hôtel") || t.includes("hotel") || t.includes("chambre") || t.includes("réservation")) {
    return "AfriBayit Hospitality intègre 630+ hôtels en phase 1 (Bénin, CI, BF, Togo), dont des établissements hors-réseau numérisés via notre PMS léger. Réservation directe avec Mobile Money (FedaPay) ou carte (Stripe), et notifications WhatsApp. Voulez-vous que je vous aide à trouver un hébergement ?";
  }
  if (t.includes("formation") || t.includes("cours") || t.includes("academy")) {
    return "AfriBayit Academy propose des formations certifiantes sur l'investissement immobilier africain, la vente, la location courte durée, le droit OHADA et la gestion de portefeuille. Les prix vont de 9 500 à 35 000 FCFA par cours. Quel domaine vous intéresse ?";
  }
  if (t.includes("bonjour") || t.includes("salut") || t.includes("hello")) {
    return "Bonjour ! Ravi de vous retrouver. Comment puis-je vous aider aujourd'hui ? Je peux vous accompagner pour trouver un bien, sécuriser une transaction, contacter un artisan ou répondre à vos questions juridiques générales sur l'immobilier en Afrique de l'Ouest.";
  }
  return "Merci pour votre question. Pour vous donner la réponse la plus précise, pourriez-vous me donner plus de détails ? Je peux vous aider sur : la recherche de biens immobiliers, les transactions escrow, les artisans BTP, les formations, les géomètres GeoTrust, ou les réservations d'hôtels en Afrique de l'Ouest.";
}

export default function RebeccaWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized, messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = res.ok ? await res.json() : null;
      const reply = data?.reply ?? getRebeccaReply(text);

      const rebeccaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "rebecca",
        text: reply,
        time: now(),
      };
      setMessages((prev) => [...prev, rebeccaMsg]);
    } catch {
      const rebeccaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "rebecca",
        text: getRebeccaReply(text),
        time: now(),
      };
      setMessages((prev) => [...prev, rebeccaMsg]);
    } finally {
      setTyping(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function useSuggestion(s: string) {
    setInput(s);
    setTimeout(() => send(), 10);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#003087] hover:bg-[#002070] text-white pl-4 pr-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,48,135,0.35)] transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Ouvrir le chat Rebecca"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">R</div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#003087]" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold leading-none">Rebecca</p>
            <p className="text-[11px] text-white/70 leading-none mt-0.5">Assistante IA • En ligne</p>
          </div>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            "fixed right-6 z-50 flex flex-col bg-white rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.18)] border border-slate-100 transition-all duration-300 overflow-hidden",
            minimized
              ? "bottom-6 w-[280px] h-[56px]"
              : "bottom-6 w-[360px] h-[520px] sm:w-[400px]"
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#003087] to-[#0070BA] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">R</div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#003087]" />
              </div>
              <div>
                <p className="text-white font-semibold text-[14px] leading-none">Rebecca</p>
                <p className="text-white/70 text-[11px] leading-none mt-0.5">Assistante IA AfriBayit</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label={minimized ? "Agrandir" : "Réduire"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={minimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#F8FAFC]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                        msg.role === "user"
                          ? "bg-[#003087] text-white rounded-br-sm"
                          : "bg-white text-[#374151] border border-slate-100 shadow-sm rounded-bl-sm"
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {typing && (
                  <div className="flex items-start">
                    <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-[#0070BA] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick suggestions — show only at start */}
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => useSuggestion(s)}
                        className="text-[12px] bg-white border border-[#0070BA]/30 text-[#003087] rounded-full px-3 py-1 hover:bg-[#003087] hover:text-white transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Legal disclaimer */}
              <div className="bg-amber-50 border-t border-amber-100 px-4 py-1.5">
                <p className="text-[10px] text-amber-700 leading-snug">
                  Rebecca fournit des informations générales. Pour tout conseil juridique ou financier, consultez un professionnel agréé.
                </p>
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Posez votre question…"
                  className="flex-1 text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#0070BA]/30 focus:border-[#0070BA] placeholder-gray-400 transition"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || typing}
                  className="w-9 h-9 bg-[#003087] hover:bg-[#002070] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                  aria-label="Envoyer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
