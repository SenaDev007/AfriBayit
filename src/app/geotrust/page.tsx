"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─── Types ───────────────────────────────────────
type CertLevel = "STANDARD" | "EXPERT" | "ELITE";

interface Geometer {
  id: string;
  name: string;
  city: string;
  country: string;
  level: CertLevel;
  specialties: string[];
  missions: number;
  rating: number;
  reviews: number;
  responseTime: string;
  priceFrom: number;
}

// ─── Per CDC Section 7C ───────────────────────────
const SERVICES = [
  {
    code: "GEO_SURF",
    icon: "📐",
    title: "Vérification de superficie",
    desc: "Mesure précise de la superficie réelle vs superficie déclarée. Écart toléré ≤ 2%. Indispensable pour éviter les ventes trompeuses.",
    delivrable: "Attestation de superficie certifiée + plan côté",
    price: "75 000 FCFA",
    days: "3-5 jours",
    popular: false,
  },
  {
    code: "GEO_GPS",
    icon: "📍",
    title: "Géolocalisation GPS précise",
    desc: "Relevé coordonnées GPS avec précision <50cm via GNSS RTK. Géocodage exact de l'adresse pour vérifier la localisation réelle du bien.",
    delivrable: "Coordonnées WGS84 + pin GeoJSON Mapbox",
    price: "45 000 FCFA",
    days: "1-2 jours",
    popular: true,
  },
  {
    code: "GEO_BORN",
    icon: "🗺️",
    title: "Bornage et délimitation",
    desc: "Pose physique ou vérification des bornes. Délimitation légale contradictoire avec voisins si requis. Procès-verbal officiel.",
    delivrable: "PV de bornage signé + plan de bornage officiel",
    price: "120 000 FCFA",
    days: "5-10 jours",
    popular: false,
  },
  {
    code: "GEO_INSP",
    icon: "🔍",
    title: "Inspection terrain pré-achat",
    desc: "Visite complète : état physique, accès, viabilisation, risques naturels, environnement immédiat. 25+ critères vérifiés avec photos géolocalisées.",
    delivrable: "Rapport d'inspection structuré (25+ critères) + photos",
    price: "95 000 FCFA",
    days: "2-4 jours",
    popular: true,
  },
  {
    code: "GEO_TOPO",
    icon: "🏔️",
    title: "Levé topographique complet",
    desc: "Relevé planimétrique et altimétrique du terrain — coordonnées GPS de tous les points caractéristiques. Obligatoire pour les superficies > 500m².",
    delivrable: "Plan topographique PDF + fichier DXF/SHP géoréférencé",
    price: "150 000 FCFA",
    days: "5-7 jours",
    popular: false,
  },
  {
    code: "GEO_CONF",
    icon: "⚠️",
    title: "Détection conflits fonciers",
    desc: "Analyse des chevauchements avec parcelles voisines via overlay cadastral. Identification des litiges potentiels avant votre achat.",
    delivrable: "Rapport de conflits avec cartographie des zones litigieuses",
    price: "85 000 FCFA",
    days: "3-5 jours",
    popular: false,
  },
  {
    code: "GEO_DRON",
    icon: "🚁",
    title: "Drone mapping aérien",
    desc: "Acquisition images aériennes par drone — orthophotographie — modèle numérique de terrain (MNT). Vue aérienne haute résolution de votre parcelle.",
    delivrable: "Orthophotoplan haute résolution + MNT + nuage de points 3D",
    price: "280 000 FCFA",
    days: "7-10 jours",
    popular: false,
  },
  {
    code: "GEO_CERT",
    icon: "📜",
    title: "Certificat GeoTrust",
    desc: "Synthèse officielle de toutes les validations terrain. Document signé électroniquement + empreinte blockchain immuable. La certification ultime.",
    delivrable: "Certificat PDF signé + empreinte blockchain",
    price: "200 000 FCFA",
    days: "10-14 jours",
    popular: true,
  },
];

const PACKS = [
  {
    name: "Pack Inspection Standard",
    services: ["GEO_GPS", "GEO_SURF", "Rapport structuré"],
    price: "75 000 FCFA",
    savings: "Économisez 65 000 FCFA",
    badge: null,
    color: "border-gray-200",
    headerBg: "bg-gray-50 text-gray-800",
  },
  {
    name: "Pack Certification GeoTrust",
    services: ["GEO_TOPO", "GEO_BORN", "GEO_CERT", "Badge Platinum", "Escrow activé"],
    price: "150 000 FCFA",
    savings: "Économisez 195 000 FCFA",
    badge: "Recommandé",
    color: "border-[#003087]",
    headerBg: "bg-[#003087] text-white",
  },
  {
    name: "Pack Premium Drone",
    services: ["GEO_DRON", "Modélisation 3D", "GEO_CERT", "Visite VR intégrée", "Rapport complet"],
    price: "350 000 FCFA",
    savings: "Économisez 310 000 FCFA",
    badge: "Phase 2",
    color: "border-purple-200",
    headerBg: "bg-gradient-to-br from-purple-700 to-[#003087] text-white",
  },
];

const GEOMETERS: Geometer[] = [
  {
    id: "1",
    name: "Mensah Koffi Agboville",
    city: "Cotonou",
    country: "Bénin",
    level: "ELITE",
    specialties: ["Bornage", "Levé topo", "GeoTrust", "Drone"],
    missions: 87,
    rating: 4.9,
    reviews: 81,
    responseTime: "< 2h",
    priceFrom: 75000,
  },
  {
    id: "2",
    name: "Yao Kouadio Celestin",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    level: "EXPERT",
    specialties: ["Superficie", "GPS RTK", "Inspection"],
    missions: 34,
    rating: 4.7,
    reviews: 29,
    responseTime: "< 4h",
    priceFrom: 45000,
  },
  {
    id: "3",
    name: "Ouédraogo Dramane",
    city: "Ouagadougou",
    country: "Burkina Faso",
    level: "STANDARD",
    specialties: ["Bornage", "GPS", "Cadastre"],
    missions: 12,
    rating: 4.5,
    reviews: 10,
    responseTime: "< 24h",
    priceFrom: 55000,
  },
  {
    id: "4",
    name: "Amégah Sénam Kekeli",
    city: "Lomé",
    country: "Togo",
    level: "EXPERT",
    specialties: ["Levé topo", "Conflits fonciers", "GeoTrust"],
    missions: 41,
    rating: 4.8,
    reviews: 38,
    responseTime: "< 3h",
    priceFrom: 65000,
  },
];

const LEVEL_CONFIG: Record<CertLevel, { label: string; badge: string; bg: string; text: string }> = {
  STANDARD: { label: "GeoTrust Standard", badge: "⭐", bg: "bg-gray-100", text: "text-gray-700" },
  EXPERT: { label: "GeoTrust Expert", badge: "⭐⭐", bg: "bg-blue-100", text: "text-blue-700" },
  ELITE: { label: "GeoTrust Elite", badge: "⭐⭐⭐", bg: "bg-amber-100", text: "text-amber-700" },
};

const TRUST_STATS = [
  { value: "50+", label: "Géomètres certifiés", sub: "4 pays pilotes" },
  { value: "200+", label: "Missions réalisées", sub: "Taux satisfaction 97%" },
  { value: "-70%", label: "Litiges fonciers", sub: "Vs transactions sans GeoTrust" },
  { value: "⛓️", label: "Blockchain", sub: "Certificats on-chain" },
];

export default function GeoTrustPage() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [orderingService, setOrderingService] = useState<string | null>(null);
  const router = useRouter();

  async function orderService(serviceCode: string) {
    setOrderingService(serviceCode);
    try {
      const res = await fetch("/api/geotrust/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: serviceCode.replace("GEO_", ""),
          country: "BJ",
          city: "Cotonou",
        }),
      });
      if (res.status === 401) {
        router.push("/login?redirect=/geotrust");
        return;
      }
      if (res.ok) {
        router.push("/dashboard?geotrust=1");
      }
    } catch {
      // Silent
    } finally {
      setOrderingService(null);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003087] via-emerald-900 to-[#0070BA] pt-[88px] pb-16">
        <div className="container-app text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            AfriBayit GeoTrust™
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Validation Terrain<br />
            <span className="text-emerald-300">Certifiée & Opposable</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            La première plateforme immobilière africaine à intégrer la validation physique du terrain
            dans le cœur du processus transactionnel. Géomètres certifiés, rapports blockchain, zéro fraude foncière.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#services"
              className="bg-white text-[#003087] font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
            >
              Voir les services
            </a>
            <a
              href="#geometers"
              className="border border-white/40 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Trouver un géomètre
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-app">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {TRUST_STATS.map((s) => (
              <div key={s.label} className="py-7 text-center">
                <div className="text-2xl font-extrabold text-[#003087] mb-1">{s.value}</div>
                <div className="text-sm text-gray-700 font-medium">{s.label}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why GeoTrust */}
      <section className="py-14 bg-amber-50 border-b border-amber-100">
        <div className="container-app">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl font-bold text-[#003087] mb-3">Pourquoi GeoTrust ?</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Selon la Banque Mondiale, <strong>90% des terres en Afrique subsaharienne</strong> ne sont pas enregistrées formellement.
              Les litiges fonciers représentent <strong>60-80% des affaires civiles</strong> dans certains pays d'Afrique de l'Ouest.
              AfriBayit GeoTrust est la réponse systémique.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: "📏", title: "Superficie falsifiée", desc: "Comparaison automatique superficie déclarée vs mesurée. Alerte si écart > 5%, blocage si > 15%." },
              { icon: "🔄", title: "Ventes multiples", desc: "Détection PostGIS ST_Intersects : une parcelle vendue deux fois est détectée avant la transaction." },
              { icon: "📍", title: "Localisation falsifiée", desc: "Comparaison adresse déclarée vs coordonnées GPS mesurées. Alerte si distance > 100m en zone urbaine." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-amber-200 rounded-2xl p-5">
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h4 className="font-bold text-gray-900 mb-2 text-[14px]">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services catalogue */}
      <section id="services" className="py-14 scroll-mt-20">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#003087] mb-2">Catalogue des Services GeoTrust</h2>
            <p className="text-gray-500 text-sm">Sélectionnez le service adapté à votre besoin ou choisissez un pack</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {SERVICES.map((svc) => (
              <div
                key={svc.code}
                className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  activeService === svc.code
                    ? "border-[#003087] ring-2 ring-[#003087]/20 shadow-md"
                    : "border-gray-200"
                }`}
                onClick={() => setActiveService(activeService === svc.code ? null : svc.code)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{svc.icon}</span>
                  <div className="flex items-center gap-1">
                    {svc.popular && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                        Populaire
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-[14px] mb-1">{svc.title}</h4>
                <p className="text-[12px] text-gray-500 mb-3 leading-relaxed line-clamp-2">{svc.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#003087]">{svc.price}</span>
                  <span className="text-[11px] text-gray-400">{svc.days}</span>
                </div>
                {activeService === svc.code && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] text-gray-600 font-semibold mb-1">Livrable :</p>
                    <p className="text-[11px] text-gray-500">{svc.delivrable}</p>
                    <button
                      type="button"
                      onClick={() => orderService(svc.code)}
                      disabled={orderingService === svc.code}
                      className="mt-3 block w-full text-center bg-[#003087] text-white text-[12px] font-semibold py-2 rounded-xl hover:bg-[#002070] transition-colors disabled:opacity-60"
                    >
                      {orderingService === svc.code ? "Commande en cours…" : "Commander ce service"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Packs */}
          <h3 className="text-xl font-bold text-[#003087] mb-6 text-center">Packs Tout-Inclus</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {PACKS.map((pack) => (
              <div
                key={pack.name}
                className={`border-2 ${pack.color} rounded-2xl overflow-hidden ${
                  pack.badge === "Recommandé" ? "ring-2 ring-[#003087] shadow-xl" : ""
                }`}
              >
                <div className={`${pack.headerBg} px-6 py-6`}>
                  {pack.badge && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 inline-block ${
                      pack.badge === "Recommandé"
                        ? "bg-amber-400 text-[#003087]"
                        : pack.badge === "Phase 2"
                        ? "bg-white/20 text-white"
                        : "bg-white/20 text-white"
                    }`}>
                      {pack.badge}
                    </span>
                  )}
                  <h4 className={`font-bold text-[16px] mb-2 ${pack.badge === null ? "text-gray-800" : "text-white"}`}>
                    {pack.name}
                  </h4>
                  <p className={`text-2xl font-extrabold ${pack.badge === null ? "text-[#003087]" : "text-white"}`}>
                    {pack.price}
                  </p>
                  <p className={`text-xs mt-0.5 ${pack.badge === null ? "text-emerald-600 font-medium" : "text-emerald-300 font-medium"}`}>
                    {pack.savings}
                  </p>
                </div>
                <div className="p-5">
                  <ul className="space-y-2 mb-5">
                    {pack.services.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-[13px] text-gray-700">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pack.badge === "Phase 2" ? "/contact" : "/register"}
                    className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      pack.badge === "Recommandé"
                        ? "bg-[#003087] text-white hover:bg-[#002070]"
                        : pack.badge === "Phase 2"
                        ? "bg-purple-700 text-white hover:bg-purple-800"
                        : "border border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                    }`}
                  >
                    {pack.badge === "Phase 2" ? "M'inscrire sur la liste" : "Choisir ce pack"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Geometers listing */}
      <section id="geometers" className="py-14 bg-gray-50 border-t border-gray-100 scroll-mt-20">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#003087] mb-2">Géomètres Certifiés GeoTrust</h2>
            <p className="text-gray-500 text-sm">
              Chaque géomètre est vérifié par notre équipe : agréments ONGE, diplômes, missions test.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GEOMETERS.map((g) => {
              const lvl = LEVEL_CONFIG[g.level];
              return (
                <div
                  key={g.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-[#003087]/10 flex items-center justify-center mb-3">
                    <span className="text-[#003087] font-bold text-lg">{g.name[0]}</span>
                  </div>

                  {/* Level badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${lvl.bg} ${lvl.text} mb-2 inline-block`}>
                    {lvl.badge} {lvl.label}
                  </span>

                  <h4 className="font-bold text-gray-900 text-[14px] leading-snug mb-1">{g.name}</h4>
                  <p className="text-xs text-gray-500 mb-3">📍 {g.city}, {g.country}</p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {g.specialties.slice(0, 2).map((s) => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                    {g.specialties.length > 2 && (
                      <span className="text-[10px] text-gray-400">+{g.specialties.length - 2}</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>✅ {g.missions} missions</span>
                    <span className="flex items-center gap-0.5">
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {g.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400">À partir de</p>
                      <p className="text-[13px] font-bold text-[#003087]">{g.priceFrom.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <Link
                      href={`/geotrust/${g.id}`}
                      className="text-[12px] bg-[#003087] text-white px-3 py-1.5 rounded-xl hover:bg-[#002070] transition-colors font-semibold"
                    >
                      Contacter
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 mb-3">
              Vous êtes géomètre ? Rejoignez le réseau GeoTrust AfriBayit.
            </p>
            <Link
              href="/register?role=geometer"
              className="inline-flex items-center gap-2 border border-[#003087] text-[#003087] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#003087] hover:text-white transition-colors text-sm"
            >
              Demander ma certification GeoTrust
            </Link>
          </div>
        </div>
      </section>

      {/* Certification process */}
      <section className="py-14 border-t border-gray-100">
        <div className="container-app max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#003087] mb-2">Processus de Certification GeoTrust</h2>
            <p className="text-gray-500 text-sm">Comment devenir géomètre certifié AfriBayit en 6 étapes</p>
          </div>
          <div className="space-y-4">
            {[
              { step: "01", title: "Inscription", desc: "Création d'un compte professionnel avec rôle GEOMETER — formulaire dédié avec champs spécifiques métier." },
              { step: "02", title: "KYC identité", desc: "CNI/Passeport + selfie biométrique IA — vérification standard niveau KYC 1 sous 4 heures." },
              { step: "03", title: "Diplômes & agréments", desc: "Upload : diplôme géomètre-expert, agrément Ordre National des Géomètres-Experts (ONGE) du pays, carte professionnelle en cours de validité." },
              { step: "04", title: "Vérification équipe pays", desc: "L'équipe AfriBayit du pays vérifie l'agrément directement auprès de l'ONGE. Délai : 48-72h ouvrées." },
              { step: "05", title: "Validation terrain", desc: "Pour les 10 premiers géomètres par pays : mission test supervisée sur bien pilote AfriBayit." },
              { step: "06", title: "Attribution du badge", desc: "Badge 'Géomètre Certifié AfriBayit GeoTrust' attribué + activation du profil public + indexation ProMatch." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#003087]/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{item.step}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
