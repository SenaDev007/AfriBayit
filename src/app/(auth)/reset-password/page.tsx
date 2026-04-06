"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return; }
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (!token || !email) { setError("Lien invalide ou expiré"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Lien invalide ou expiré");
      }
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

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Mot de passe modifié !</h2>
            <p className="text-gray-500 text-sm">Redirection vers la connexion...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#003087] mb-2">Nouveau mot de passe</h1>
            <p className="text-gray-500 text-sm mb-6">Choisissez un mot de passe sécurisé pour votre compte.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                required
                error={confirmPassword && password !== confirmPassword ? "Les mots de passe ne correspondent pas" : ""}
              />
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-[#D93025]">{error}</p>
                </div>
              )}
              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                Modifier le mot de passe
              </Button>
            </form>
          </>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
