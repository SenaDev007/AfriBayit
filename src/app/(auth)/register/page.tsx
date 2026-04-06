"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const USER_TYPES = [
  { value: "BUYER", label: "Acheteur / Locataire", icon: "🏠", desc: "Je cherche un bien immobilier" },
  { value: "SELLER", label: "Propriétaire / Vendeur", icon: "🔑", desc: "Je veux publier des annonces" },
  { value: "INVESTOR", label: "Investisseur", icon: "📈", desc: "Je cherche des opportunités" },
  { value: "TOURIST", label: "Voyageur / Touriste", icon: "✈️", desc: "Je cherche un logement de courte durée" },
  { value: "ARTISAN", label: "Artisan BTP", icon: "🔧", desc: "Je propose mes services" },
  { value: "AGENCY", label: "Agence Immobilière", icon: "🏢", desc: "Je gère un portefeuille d'annonces" },
  { value: "GUESTHOUSE_OWNER", label: "Propriétaire Guesthouse", icon: "🛏️", desc: "Je loue des chambres" },
];

const COUNTRIES = [
  { value: "BJ", label: "🇧🇯 Bénin" },
  { value: "CI", label: "🇨🇮 Côte d'Ivoire" },
  { value: "BF", label: "🇧🇫 Burkina Faso" },
  { value: "TG", label: "🇹🇬 Togo" },
  { value: "SN", label: "🇸🇳 Sénégal" },
  { value: "GH", label: "🇬🇭 Ghana" },
  { value: "NG", label: "🇳🇬 Nigeria" },
  { value: "OTHER", label: "Autre pays" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phonePrefix: "+229",
    password: "",
    confirmPassword: "",
    userType: "",
    country: "",
    acceptTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName) { setError("Veuillez saisir votre nom complet"); return false; }
    if (!form.email) { setError("Veuillez saisir votre email"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Email invalide"); return false; }
    if (!form.password || form.password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return false; }
    if (form.password !== form.confirmPassword) { setError("Les mots de passe ne correspondent pas"); return false; }
    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !form.userType) { setError("Veuillez sélectionner votre type de compte"); return; }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!form.country) { setError("Veuillez sélectionner votre pays"); return; }
    if (!form.acceptTerms) { setError("Veuillez accepter les conditions d'utilisation"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone ? form.phonePrefix + form.phone : undefined,
          password: form.password,
          userType: form.userType,
          country: form.country,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur s'est produite");
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const loginResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginResult?.error) {
        router.push("/login?message=account_created");
      } else {
        router.push("/dashboard?onboarding=true");
        router.refresh();
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#0070BA] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-bold text-2xl text-[#003087]">
              Afri<span className="text-[#0070BA]">Bayit</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-[#003087] mb-2">Créer un compte</h1>
          <p className="text-gray-500 mb-6">
            Déjà membre ?{" "}
            <Link href="/login" className="text-[#0070BA] font-medium hover:underline">Se connecter</Link>
          </p>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-[#0070BA] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {step > s ? "✓" : s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? "text-[#0070BA]" : "text-gray-400"}`}>
                  {s === 1 ? "Infos" : s === 2 ? "Profil" : "Pays"}
                </span>
                {s < 3 && <div className={`h-0.5 w-8 ${step > s ? "bg-[#0070BA]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" placeholder="Jean" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} required />
                <Input label="Nom" placeholder="Kouamé" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} required />
              </div>
              <Input label="Email" type="email" placeholder="vous@example.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <div className="flex gap-2">
                  <select value={form.phonePrefix} onChange={(e) => handleChange("phonePrefix", e.target.value)} className="input-afri w-28 flex-shrink-0">
                    <option value="+229">🇧🇯 +229</option>
                    <option value="+225">🇨🇮 +225</option>
                    <option value="+226">🇧🇫 +226</option>
                    <option value="+228">🇹🇬 +228</option>
                    <option value="+221">🇸🇳 +221</option>
                  </select>
                  <input type="tel" placeholder="97 00 00 00" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="input-afri flex-1" />
                </div>
              </div>
              <Input label="Mot de passe" type="password" placeholder="Minimum 8 caractères" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required hint="Utilisez des lettres, chiffres et symboles" />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
                error={form.confirmPassword && form.password !== form.confirmPassword ? "Les mots de passe ne correspondent pas" : ""}
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">Sélectionnez votre profil pour personnaliser votre expérience</p>
              {USER_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleChange("userType", type.value)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${form.userType === type.value ? "border-[#0070BA] bg-blue-50" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${form.userType === type.value ? "text-[#003087]" : "text-gray-700"}`}>{type.label}</p>
                    <p className="text-xs text-gray-400">{type.desc}</p>
                  </div>
                  {form.userType === type.value && (
                    <div className="w-5 h-5 rounded-full bg-[#0070BA] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre pays <span className="text-[#D93025]">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleChange("country", c.value)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${form.country === c.value ? "border-[#0070BA] bg-blue-50 text-[#003087]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                <p className="font-medium text-gray-700">Récapitulatif</p>
                <p className="text-gray-500">👤 {form.firstName} {form.lastName}</p>
                <p className="text-gray-500">📧 {form.email}</p>
                <p className="text-gray-500">🎯 {USER_TYPES.find((t) => t.value === form.userType)?.label}</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.acceptTerms} onChange={(e) => handleChange("acceptTerms", e.target.checked)} className="mt-0.5 rounded text-[#0070BA]" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  J&apos;accepte les{" "}
                  <Link href="/terms" className="text-[#0070BA] hover:underline">Conditions Générales d&apos;Utilisation</Link>{" "}
                  et la{" "}
                  <Link href="/privacy" className="text-[#0070BA] hover:underline">Politique de confidentialité</Link>
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-[#D93025] flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="flex-1">Retour</Button>}
            {step < 3 ? (
              <Button variant="primary" size="lg" onClick={handleNextStep} className={step > 1 ? "flex-1" : "w-full"}>
                Continuer
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={handleSubmit} loading={loading} className="flex-1">
                Créer mon compte
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="hidden lg:flex w-96 bg-hero items-center justify-center p-10">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 float">{step === 1 ? "👋" : step === 2 ? "🎯" : "🌍"}</div>
          <h2 className="text-2xl font-bold mb-3">{step === 1 ? "Rejoignez AfriBayit" : step === 2 ? "Votre profil" : "Presque prêt !"}</h2>
          <p className="text-white/75 text-sm leading-relaxed mb-8">
            {step === 1 ? "Créez votre compte gratuit et accédez à l'immobilier africain en toute confiance."
              : step === 2 ? "Personnalisez votre expérience selon vos besoins immobiliers."
              : "Plus que quelques instants avant d'explorer AfriBayit !"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[{ icon: "🏠", value: "10K+", label: "Annonces" }, { icon: "🌍", value: "4", label: "Pays" }, { icon: "⭐", value: "4.9/5", label: "Note" }, { icon: "👥", value: "50K+", label: "Membres" }].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-3 text-center">
                <p className="text-lg">{stat.icon}</p>
                <p className="font-bold text-[#FFB900] text-lg">{stat.value}</p>
                <p className="text-white/70 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
