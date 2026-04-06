"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Veuillez saisir votre email"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else setError("Aucun compte trouvé avec cet email.");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0070BA] flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="font-bold text-2xl text-[#003087]">Afri<span className="text-[#0070BA]">Bayit</span></span>
        </Link>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-[#003087] mb-2">Mot de passe oublié</h1>
            <p className="text-gray-500 text-sm mb-6">
              Saisissez votre email. Nous vous enverrons un lien de réinitialisation.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                error={error}
              />
              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                Envoyer le lien de réinitialisation
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email envoyé !</h2>
            <p className="text-gray-500 text-sm mb-6">
              Vérifiez votre boîte mail. Le lien est valable 1 heure.
            </p>
            <Button variant="outline" fullWidth onClick={() => setSent(false)}>
              Renvoyer un email
            </Button>
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/login" className="text-sm text-[#0070BA] hover:underline flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
