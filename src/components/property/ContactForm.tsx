"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface ContactFormProps {
  ownerId: string;
  propertyId: string;
}

export default function ContactForm({ ownerId, propertyId }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Je suis intéressé(e) par cette propriété...");
  const [visitDate, setVisitDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: ownerId,
          content: message + (visitDate ? `\n\nDate de visite souhaitée : ${visitDate}` : ""),
        }),
      });
      setSent(true);
    } catch {
      // silent fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 mb-5 text-center py-4">
        <div className="text-4xl mb-2">✅</div>
        <p className="font-semibold text-[#003087]">Message envoyé !</p>
        <p className="text-sm text-gray-500">Le propriétaire vous répondra dans les plus brefs délais.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-5">
      <input
        type="text"
        placeholder="Votre nom"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-afri"
      />
      <input
        type="email"
        placeholder="Email ou téléphone"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-afri"
      />
      <textarea
        rows={3}
        placeholder="Je suis intéressé(e) par cette propriété..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="input-afri resize-none"
      />
      <input
        type="date"
        placeholder="Date de visite souhaitée"
        value={visitDate}
        onChange={(e) => setVisitDate(e.target.value)}
        className="input-afri"
      />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        disabled={loading}
      >
        {loading ? "Envoi en cours..." : "Envoyer un message"}
      </Button>
    </form>
  );
}
