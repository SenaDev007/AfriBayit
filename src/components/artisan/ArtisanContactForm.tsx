"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface ArtisanContactFormProps {
  artisanUserId: string;
}

export default function ArtisanContactForm({ artisanUserId }: ArtisanContactFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !message.trim()) {
      setError("Veuillez remplir votre nom et votre message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: artisanUserId,
          content: `[${name}${phone ? ` — ${phone}` : ""}] ${message}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de l'envoi du message.");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center py-6 px-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-800 text-sm mb-1">Message envoyé !</p>
        <p className="text-xs text-gray-500">
          L&apos;artisan vous répondra dans les meilleurs délais.
        </p>
        <button
          onClick={() => { setSent(false); setName(""); setPhone(""); setMessage(""); }}
          className="mt-4 text-xs text-[#0070BA] hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-[#D93025] text-xs rounded-xl px-3 py-2 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="contact-name" className="block text-xs font-medium text-gray-600">
          Votre nom <span className="text-[#D93025]">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom"
          required
          className="input-afri text-sm py-2.5"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-phone" className="block text-xs font-medium text-gray-600">
          Téléphone
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+229 XX XX XX XX"
          className="input-afri text-sm py-2.5"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-message" className="block text-xs font-medium text-gray-600">
          Décrivez votre projet <span className="text-[#D93025]">*</span>
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex : J'ai besoin d'un électricien pour l'installation électrique d'une villa à Cotonou..."
          rows={4}
          required
          className="input-afri text-sm resize-none"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        size="md"
      >
        {loading ? "Envoi en cours…" : "Envoyer le message"}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Réponse habituelle sous 2h en heures ouvrées
      </p>
    </form>
  );
}
