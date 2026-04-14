'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function KycPage() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [documentType, setDocumentType] = useState('CNI')
  const [documentNumber, setDocumentNumber] = useState('')
  const [status, setStatus] = useState('Chargement...')
  const [message, setMessage] = useState('')

  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      : null

  const loadStatus = async () => {
    const token = getToken()
    if (!token) {
      setStatus('Non connecte')
      return
    }

    const res = await fetch('/api/kyc/status', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setStatus(data.kyc?.status || 'NOT_SUBMITTED')
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const submitKyc = async () => {
    const token = getToken()
    if (!token) {
      setMessage('Session invalide, reconnecte-toi.')
      return
    }

    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName,
        documentType,
        documentNumber
      })
    })
    const data = await res.json()
    setMessage(data.message || 'Demande envoyee')
    await loadStatus()
  }

  const verifyKycDev = async () => {
    if (!user?.id) {
      setMessage('Connecte-toi pour valider le KYC.')
      return
    }

    const res = await fetch('/api/kyc/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
    const data = await res.json()
    setMessage(data.message || 'KYC valide')
    await loadStatus()
  }

  return (
    <main className="min-h-screen pt-28 pb-12 bg-neutral-50 dark:bg-neutral-900">
      <div className="container-custom max-w-2xl">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Verification KYC</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">Statut actuel: <strong>{status}</strong></p>

          <div className="space-y-4">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom complet"
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 bg-white dark:bg-neutral-700"
            />
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 bg-white dark:bg-neutral-700"
            >
              <option value="CNI">CNI</option>
              <option value="PASSPORT">Passeport</option>
              <option value="PERMIS">Permis</option>
            </select>
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Numero du document"
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 bg-white dark:bg-neutral-700"
            />
            <button
              onClick={submitKyc}
              className="w-full bg-primary-600 text-white rounded-lg py-3 hover:bg-primary-700 transition-colors"
            >
              Soumettre mon KYC
            </button>
            <button
              onClick={verifyKycDev}
              className="w-full bg-emerald-600 text-white rounded-lg py-3 hover:bg-emerald-700 transition-colors"
            >
              Valider KYC (mode dev)
            </button>
          </div>

          {message && <p className="mt-4 text-sm text-primary-600">{message}</p>}
        </div>
      </div>
    </main>
  )
}
