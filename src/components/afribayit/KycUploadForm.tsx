'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileText,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DocTypeOption =
  | 'id_card'
  | 'passport'
  | 'selfie'
  | 'proof_address'
  | 'income_source'
  | 'rccm'
  | 'company_statutes';

interface KycUploadFormProps {
  /** Types de documents que l'utilisateur peut soumettre */
  allowedDocTypes: DocTypeOption[];
  /** Callback quand un document est soumis avec succès */
  onSubmitted?: () => void;
  /** Token d'accès pour l'API */
  accessToken?: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const DOC_TYPE_OPTIONS: { value: DocTypeOption; label: string; icon: React.ReactNode; hint?: string }[] = [
  {
    value: 'id_card',
    label: 'Carte d\'identité nationale',
    icon: <FileText className="w-4 h-4" />,
    hint: 'Recto et verso de votre CNI en cours de validité',
  },
  {
    value: 'passport',
    label: 'Passeport',
    icon: <FileText className="w-4 h-4" />,
    hint: 'Page d\'identité de votre passeport en cours de validité',
  },
  {
    value: 'selfie',
    label: 'Selfie de vérification',
    icon: <Camera className="w-4 h-4" />,
    hint: 'Prenez un selfie en face de la caméra. Notre IA comparera votre visage avec votre pièce d\'identité.',
  },
  {
    value: 'proof_address',
    label: 'Justificatif de domicile',
    icon: <FileText className="w-4 h-4" />,
    hint: 'Facture d\'eau, d\'électricité ou attestation de résidence de moins de 3 mois',
  },
  {
    value: 'income_source',
    label: 'Justificatif de revenus',
    icon: <FileText className="w-4 h-4" />,
    hint: 'Bulletin de salaire, avis d\'imposition ou relevé bancaire des 3 derniers mois',
  },
  {
    value: 'rccm',
    label: 'RCCM',
    icon: <FileText className="w-4 h-4" />,
    hint: 'Extrait du Registre du Commerce et du Crédit Mobilier',
  },
  {
    value: 'company_statutes',
    label: 'Statuts de la société',
    icon: <FileText className="w-4 h-4" />,
    hint: 'Copie certifiée des statuts de votre entreprise',
  },
];

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_MB = 10;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function KycUploadForm({ allowedDocTypes, onSubmitted, accessToken }: KycUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocTypeOption | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredOptions = DOC_TYPE_OPTIONS.filter((o) => allowedDocTypes.includes(o.value));

  /* ---- File handling ---- */

  const validateAndSetFile = useCallback((f: File) => {
    setError(null);
    setSuccess(false);

    if (!ALLOWED_MIME_TYPES.includes(f.type)) {
      setError(`Type de fichier non supporté (${f.type}). Formats acceptés : JPEG, PNG, WebP, HEIC/HEIF.`);
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Le fichier dépasse la limite de ${MAX_FILE_SIZE_MB} Mo.`);
      return;
    }

    setFile(f);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) validateAndSetFile(droppedFile);
    },
    [validateAndSetFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndSetFile(selected);
    },
    [validateAndSetFile],
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ---- Submit ---- */

  const handleSubmit = async () => {
    if (!selectedDocType || !file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Round 3 — Gap 24 fix: the backend has no `/kyc/ocr` endpoint.
      // The closest equivalent is `POST /kyc/submit` which expects
      // `{ documentType, docUrl, country? }` (a URL, not a file upload).
      // We convert the File to a base64 data URL client-side and post
      // that as `docUrl` so the backend can persist the document.
      // TODO: once a proper `/storage/signed-url` endpoint exists, upload
      // the file there first and pass the resulting URL here instead.
      const docUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });

      const data = await apiFetch<any>('/kyc/submit', {
        method: 'POST',
        body: {
          documentType: selectedDocType,
          docUrl,
        },
      });

      if (data?.error) {
        setError(data.error || 'Erreur lors du téléversement du document.');
        return;
      }

      setSuccess(true);
      clearFile();
      setSelectedDocType('');
      onSubmitted?.();
    } catch (err: any) {
      // apiFetch throws an ApiError with a `message` field on non-2xx.
      setError(err?.message || 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.');
      console.error('[KycUploadForm] Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  /* ---- Selected doc type info ---- */
  const selectedDocInfo = DOC_TYPE_OPTIONS.find((o) => o.value === selectedDocType);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Soumettre un document</h3>
      <p className="text-sm text-gray-500 mb-5">
        Téléversez vos documents pour la vérification KYC. Notre IA analysera automatiquement chaque document.
      </p>

      {/* Sélecteur de type de document */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Type de document <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setSelectedDocType(opt.value);
                setError(null);
                setSuccess(false);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-left text-sm transition-all ${
                selectedDocType === opt.value
                  ? 'border-[#003087] bg-[#003087]/5 text-[#003087] font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={selectedDocType === opt.value ? 'text-[#003087]' : 'text-gray-400'}>
                {opt.icon}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
        {selectedDocInfo?.hint && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-amber-600 flex items-start gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {selectedDocInfo.hint}
          </motion.p>
        )}

        {/* Instructions spéciales selfie */}
        {selectedDocType === 'selfie' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200"
          >
            <p className="text-xs font-semibold text-blue-800 mb-1.5">
              Instructions pour le selfie de vérification
            </p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              <li>Regardez directement la caméra, visage dégagé</li>
              <li>Éclairage suffisant, pas de lunettes de soleil</li>
              <li>Notre IA comparera ce selfie avec votre pièce d&apos;identité</li>
              <li>Format JPEG ou PNG recommandé</li>
            </ul>
          </motion.div>
        )}
      </div>

      {/* Zone de drop */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Fichier <span className="text-red-500">*</span>
        </label>

        <AnimatePresence mode="wait">
          {file && preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50"
            >
              <div className="relative aspect-video max-h-64 flex items-center justify-center bg-gray-100">
                <img
                  src={preview}
                  alt="Aperçu du document"
                  className="max-h-64 max-w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Supprimer le fichier"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#003087] bg-[#003087]/5'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }`}
            >
              <Upload
                className={`w-10 h-10 mx-auto mb-3 ${
                  isDragging ? 'text-[#003087]' : 'text-gray-400'
                }`}
              />
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {isDragging
                  ? 'Déposez le fichier ici'
                  : 'Glissez-déposez un fichier ou cliquez pour parcourir'}
              </p>
              <p className="text-xs text-gray-400">
                JPEG, PNG, WebP ou HEIC — Max {MAX_FILE_SIZE_MB} Mo
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Sélectionner un fichier"
        />
      </div>

      {/* Message d'erreur */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message de succès */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">
              Document soumis avec succès ! Notre IA l&apos;analyse en cours. Vous serez notifié du résultat.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de soumission */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedDocType || !file || isUploading}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          !selectedDocType || !file || isUploading
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#003087] text-white hover:bg-[#002060] active:scale-[0.98] shadow-md hover:shadow-lg'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Soumettre le document
          </>
        )}
      </button>
    </div>
  );
}
