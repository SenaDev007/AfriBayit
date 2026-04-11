"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Upload, CheckCircle, XCircle, Clock, FileText, User, Camera } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const DOC_TYPES = [
  { code: "CNI", label: "Carte Nationale d'Identité (CNI)", icon: <User size={18} />, required: true },
  { code: "PASSPORT", label: "Passeport", icon: <FileText size={18} />, required: false },
  { code: "SELFIE", label: "Selfie de vérification", icon: <Camera size={18} />, required: true },
  { code: "UTILITY_BILL", label: "Facture de domicile (eau/électricité)", icon: <FileText size={18} />, required: false },
  { code: "RCCM", label: "RCCM (artisans/agences)", icon: <FileText size={18} />, required: false },
  { code: "PATENTE", label: "Patente professionnelle", icon: <FileText size={18} />, required: false },
];

interface KYCDoc {
  id: string;
  docType: string;
  isVerified: boolean;
  createdAt: string;
}

interface KYCState {
  kycStatus: string;
  kycLevel: string;
  monthlyLimit: number;
  documents: KYCDoc[];
}

const KYC_LEVEL_INFO = {
  KYC0: { label: "Non vérifié", color: "text-gray-500", bg: "bg-gray-100", limit: "Navigation uniquement" },
  KYC1: { label: "KYC Niveau 1", color: "text-blue-600", bg: "bg-blue-50", limit: "500 000 FCFA/mois" },
  KYC2: { label: "KYC Niveau 2", color: "text-purple-600", bg: "bg-purple-50", limit: "5 000 000 FCFA/mois" },
  KYC3: { label: "KYC Niveau 3", color: "text-[#D4AF37]", bg: "bg-yellow-50", limit: "Illimité" },
};

export default function KYCPage() {
  const router = useRouter();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [kycState, setKycState] = useState<KYCState | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKYCState();
  }, []);

  async function fetchKYCState() {
    setLoading(true);
    const res = await fetch("/api/kyc");
    if (res.status === 401) {
      router.push("/login?redirect=/kyc");
      return;
    }
    const data = await res.json();
    setKycState(data);
    setLoading(false);
  }

  async function handleUpload(docType: string) {
    const input = fileRefs.current[docType];
    const file = input?.files?.[0];

    if (!file) {
      toast.error("Sélectionnez un fichier d'abord.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo).");
      return;
    }

    setUploading((u) => ({ ...u, [docType]: true }));

    const form = new FormData();
    form.append("file", file);
    form.append("docType", docType);

    const res = await fetch("/api/kyc/upload", { method: "POST", body: form });
    const data = await res.json();

    setUploading((u) => ({ ...u, [docType]: false }));

    if (!res.ok) {
      toast.error(data.error ?? "Erreur lors de l'upload.");
      return;
    }

    toast.success("Document soumis ! En attente de validation (24-72h).");
    // Reset input
    if (input) input.value = "";
    await fetchKYCState();
  }

  function getDocStatus(docType: string): KYCDoc | undefined {
    return kycState?.documents.find((d) => d.docType === docType);
  }

  const levelInfo = KYC_LEVEL_INFO[(kycState?.kycLevel ?? "KYC0") as keyof typeof KYC_LEVEL_INFO];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-app py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} className="text-[#D4AF37]" />
            <h1 className="text-2xl font-bold text-gray-900">Vérification d'identité (KYC)</h1>
          </div>
          <p className="text-gray-500 max-w-2xl">
            Vérifiez votre identité pour débloquer les transactions et augmenter vos limites mensuelles.
            Vos documents sont traités sous 24 à 72h ouvrables.
          </p>
        </div>
      </div>

      <div className="container-app py-8 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Level Card */}
            <div className={`rounded-2xl border-2 p-6 mb-8 ${levelInfo.bg}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Votre niveau actuel</p>
                  <p className={`text-2xl font-bold ${levelInfo.color}`}>{levelInfo.label}</p>
                  <p className="text-gray-600 mt-1">Limite mensuelle : <strong>{levelInfo.limit}</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Statut KYC</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      kycState?.kycStatus === "VERIFIED"
                        ? "bg-green-100 text-green-700"
                        : kycState?.kycStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {kycState?.kycStatus === "VERIFIED" ? (
                      <><CheckCircle size={14} /> Vérifié</>
                    ) : kycState?.kycStatus === "PENDING" ? (
                      <><Clock size={14} /> En attente</>
                    ) : (
                      "Non soumis"
                    )}
                  </span>
                </div>
              </div>

              {/* Progress steps */}
              <div className="mt-6 grid grid-cols-4 gap-3">
                {["KYC0", "KYC1", "KYC2", "KYC3"].map((level, i) => (
                  <div key={level} className="text-center">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${
                        kycState?.kycLevel === level
                          ? "bg-[#D4AF37] text-white"
                          : i < ["KYC0", "KYC1", "KYC2", "KYC3"].indexOf(kycState?.kycLevel ?? "KYC0")
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {i}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{level}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Upload Cards */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Documents à soumettre</h2>
            <div className="space-y-4">
              {DOC_TYPES.map((dt) => {
                const existing = getDocStatus(dt.code);
                const isUploading = uploading[dt.code];

                return (
                  <div
                    key={dt.code}
                    className={`bg-white rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap ${
                      existing?.isVerified ? "border-green-200" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        {dt.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {dt.label}
                          {dt.required && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                              Requis
                            </span>
                          )}
                        </p>
                        {existing ? (
                          <p
                            className={`text-sm mt-0.5 flex items-center gap-1 ${
                              existing.isVerified
                                ? "text-green-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {existing.isVerified ? (
                              <><CheckCircle size={13} /> Vérifié</>
                            ) : (
                              <><Clock size={13} /> En attente de validation</>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-0.5">Aucun document soumis</p>
                        )}
                      </div>
                    </div>

                    {!existing?.isVerified && (
                      <div className="flex items-center gap-2">
                        <input
                          ref={(el) => { fileRefs.current[dt.code] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          id={`file-${dt.code}`}
                          onChange={() => {}} // controlled by button click
                        />
                        <label
                          htmlFor={`file-${dt.code}`}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          Choisir un fichier
                        </label>
                        <button
                          onClick={() => handleUpload(dt.code)}
                          disabled={isUploading}
                          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg text-sm font-medium hover:bg-[#b8972f] disabled:opacity-50 transition-colors"
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={14} />
                          )}
                          {isUploading ? "Envoi..." : "Envoyer"}
                        </button>
                      </div>
                    )}

                    {existing?.isVerified && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle size={18} />
                        Validé
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-semibold text-blue-800 mb-2">Comment fonctionne la vérification ?</h3>
              <ul className="space-y-1.5 text-sm text-blue-700">
                <li>• Vos documents sont vérifiés sous <strong>24 à 72h</strong> par notre équipe.</li>
                <li>• <strong>KYC1</strong> : CNI + Selfie → limite 500 000 FCFA/mois</li>
                <li>• <strong>KYC2</strong> : + 2 documents supplémentaires → limite 5 000 000 FCFA/mois</li>
                <li>• <strong>KYC3</strong> : Vérification complète (5 documents) → transactions illimitées</li>
                <li>• Toutes vos données sont <strong>chiffrées</strong> et traitées conformément au RGPD.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
