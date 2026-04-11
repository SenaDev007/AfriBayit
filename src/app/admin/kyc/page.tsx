"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface KYCDoc {
  id: string;
  docType: string;
  url: string;
  fileSize: number | null;
  mimeType: string | null;
  isVerified: boolean;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    userType: string;
    kycStatus: string;
    country: string | null;
    createdAt: string;
  };
}

type Filter = "pending" | "verified" | "rejected" | "all";

export default function AdminKYCPage() {
  const [docs, setDocs] = useState<KYCDoc[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchDocs();
  }, [filter]);

  async function fetchDocs() {
    setLoading(true);
    const res = await fetch(`/api/admin/kyc?filter=${filter}`);
    if (!res.ok) {
      toast.error("Accès refusé ou erreur.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDocs(data.docs);
    setLoading(false);
  }

  async function handleAction(id: string, action: "approve" | "reject", reason?: string) {
    setProcessing((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/kyc/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectReason: reason }),
    });
    const data = await res.json();
    setProcessing((p) => ({ ...p, [id]: false }));

    if (!res.ok) {
      toast.error(data.error ?? "Erreur.");
      return;
    }

    toast.success(action === "approve" ? "Document approuvé !" : "Document rejeté.");
    setRejectId(null);
    setRejectReason("");
    await fetchDocs();
  }

  const statusLabel = (doc: KYCDoc) => {
    if (doc.isVerified) return { label: "Approuvé", color: "text-green-600 bg-green-50", icon: <CheckCircle size={13} /> };
    if (doc.rejectedAt) return { label: "Rejeté", color: "text-red-600 bg-red-50", icon: <XCircle size={13} /> };
    return { label: "En attente", color: "text-yellow-600 bg-yellow-50", icon: <Clock size={13} /> };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <div className="bg-white border-b">
        <div className="container-app py-6">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-[#D4AF37]" />
            <h1 className="text-xl font-bold text-gray-900">Queue KYC — Administration</h1>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["pending", "verified", "rejected", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#D4AF37] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "pending" ? "En attente" : f === "verified" ? "Approuvés" : f === "rejected" ? "Rejetés" : "Tous"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Shield size={40} className="mx-auto mb-3 opacity-40" />
            <p>Aucun document dans cette catégorie.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {docs.map((doc) => {
              const st = statusLabel(doc);
              return (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* User info */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                          {doc.user.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{doc.user.name ?? "Sans nom"}</p>
                          <p className="text-xs text-gray-400">{doc.user.email} · {doc.user.userType} · {doc.user.country ?? "—"}</p>
                        </div>
                      </div>

                      {/* Doc info */}
                      <div className="flex items-center gap-3 flex-wrap mt-3">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {doc.docType}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          Soumis le {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        {doc.fileSize && (
                          <span className="text-xs text-gray-400">
                            {(doc.fileSize / 1024).toFixed(0)} Ko
                          </span>
                        )}
                      </div>

                      {doc.rejectReason && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded">
                          Raison du rejet : {doc.rejectReason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye size={14} /> Voir
                      </a>

                      {!doc.isVerified && !doc.rejectedAt && (
                        <>
                          <button
                            onClick={() => handleAction(doc.id, "approve")}
                            disabled={processing[doc.id]}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle size={14} />
                            {processing[doc.id] ? "..." : "Approuver"}
                          </button>
                          <button
                            onClick={() => setRejectId(doc.id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle size={14} /> Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reject modal inline */}
                  {rejectId === doc.id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm font-medium text-red-800 mb-2">Raison du rejet (obligatoire)</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex: Document illisible, image floue, document expiré..."
                        className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAction(doc.id, "reject", rejectReason)}
                          disabled={!rejectReason.trim() || processing[doc.id]}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Confirmer le rejet
                        </button>
                        <button
                          onClick={() => { setRejectId(null); setRejectReason(""); }}
                          className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
