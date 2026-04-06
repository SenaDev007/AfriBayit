"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type LoginTab = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSendOTP = async () => {
    if (!form.phone) {
      setError("Veuillez saisir votre numéro de téléphone");
      return;
    }
    setLoading(true);
    // TODO: appel API OTP
    await new Promise((r) => setTimeout(r, 1000));
    setOtpSent(true);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: appel signIn depuis next-auth
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/dashboard");
    } catch {
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    // TODO: signIn(provider)
    console.log("OAuth:", provider);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#0070BA] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-bold text-2xl text-[#003087]">
              Afri<span className="text-[#0070BA]">Bayit</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-[#003087] mb-2">Connexion</h1>
          <p className="text-gray-500 mb-8">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-[#0070BA] font-medium hover:underline">
              Créer un compte
            </Link>
          </p>

          {/* OAuth Providers */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth("facebook")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Tabs: Email / Phone */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            {[
              { key: "email", label: "📧 Email" },
              { key: "phone", label: "📱 Téléphone" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as LoginTab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key
                    ? "bg-white text-[#003087] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "email" ? (
              <>
                <Input
                  label="Email"
                  type="email"
                  placeholder="vous@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <div>
                  <Input
                    label="Mot de passe"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />
                  <div className="flex justify-end mt-1">
                    <Link href="/forgot-password" className="text-sm text-[#0070BA] hover:underline">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Numéro de téléphone
                  </label>
                  <div className="flex gap-2">
                    <select className="input-afri w-28 flex-shrink-0">
                      <option value="+229">🇧🇯 +229</option>
                      <option value="+225">🇨🇮 +225</option>
                      <option value="+226">🇧🇫 +226</option>
                      <option value="+228">🇹🇬 +228</option>
                      <option value="+221">🇸🇳 +221</option>
                      <option value="+233">🇬🇭 +233</option>
                      <option value="+234">🇳🇬 +234</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="97 00 00 00"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="input-afri flex-1"
                    />
                  </div>
                </div>
                {!otpSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={handleSendOTP}
                    loading={loading}
                  >
                    Envoyer le code OTP
                  </Button>
                ) : (
                  <Input
                    label="Code OTP (6 chiffres)"
                    type="text"
                    placeholder="123456"
                    value={form.otp}
                    onChange={(e) => handleChange("otp", e.target.value)}
                    maxLength={6}
                    hint="Code envoyé par SMS"
                  />
                )}
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-[#D93025] flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={
                tab === "phone" && !otpSent
                  ? true
                  : false
              }
            >
              {tab === "phone" && otpSent ? "Vérifier le code" : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/terms" className="text-[#0070BA] hover:underline">CGU</Link>{" "}
            et notre{" "}
            <Link href="/privacy" className="text-[#0070BA] hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-hero items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <div className="text-8xl mb-6 float">🏡</div>
          <h2 className="text-4xl font-bold mb-4">
            Bienvenue sur
            <br />
            <span className="text-[#FFB900]">AfriBayit</span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            La première super-app immobilière africaine.
            Où les rêves deviennent adresses.
          </p>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🔒", label: "Transactions sécurisées" },
              { icon: "✅", label: "KYC vérifié" },
              { icon: "🌍", label: "4 pays couverts" },
              { icon: "💳", label: "Mobile Money intégré" },
            ].map((item) => (
              <div
                key={item.label}
                className="glass rounded-xl p-3 text-center"
              >
                <span className="text-2xl block mb-1">{item.icon}</span>
                <span className="text-sm text-white/90">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
