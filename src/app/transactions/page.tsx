'use client'

import { useEffect, useState } from 'react'

type Tx = {
  id: string
  amount: number
  currency: string
  type: string
  status: string
  createdAt: string
  escrowState?: string | null
  auditTrail?: Array<{ action: string; createdAt: string }>
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'error'>('info')

  const loadTransactions = async () => {
    setLoading(true)
    const res = await fetch('/api/transactions')
    const data = await res.json()
    setTransactions(data.transactions || [])
    setLoading(false)
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const moveToEscrow = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}/escrow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ESCROW' })
    })
    const data = await res.json()
    setMessageType(res.ok ? 'info' : 'error')
    setMessage(data.message || `Transaction ${id} -> ESCROW`)
    await loadTransactions()
  }

  const markCompleted = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}/escrow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RELEASED' })
    })
    const data = await res.json()
    setMessageType(res.ok ? 'info' : 'error')
    setMessage(data.message || `Transaction ${id} -> RELEASED`)
    await loadTransactions()
  }

  const markDeedSigned = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}/deed`, {
      method: 'PATCH'
    })
    const data = await res.json()
    setMessageType(res.ok ? 'info' : 'error')
    setMessage(data.message || `Transaction ${id} -> DEED_SIGNED`)
    await loadTransactions()
  }

  const getTimeline = (tx: Tx) => {
    if (tx.escrowState === 'RELEASED' || tx.status === 'RELEASED') {
      return 'PENDING -> ESCROW(FUNDED) -> RELEASED'
    }
    if (tx.escrowState === 'FUNDED' || tx.status === 'ESCROW') {
      return 'PENDING -> ESCROW(FUNDED)'
    }
    return 'PENDING'
  }

  const renderStep = (active: boolean, label: string) => (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
      <span className={`text-xs ${active ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
        {label}
      </span>
    </div>
  )

  return (
    <main className="min-h-screen pt-28 pb-12 bg-neutral-50 dark:bg-neutral-900">
      <div className="container-custom">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Transactions & Escrow</h1>

          {loading ? (
            <p className="text-neutral-600 dark:text-neutral-300">Chargement...</p>
          ) : transactions.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-300">Aucune transaction pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{tx.type}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {tx.amount} {tx.currency} • {tx.status}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {renderStep(true, 'PENDING')}
                        {renderStep(tx.status === 'ESCROW' || tx.escrowState === 'FUNDED' || tx.status === 'RELEASED' || tx.escrowState === 'RELEASED', 'ESCROW')}
                        {renderStep(tx.status === 'RELEASED' || tx.escrowState === 'RELEASED', 'RELEASED')}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Timeline: {getTimeline(tx)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToEscrow(tx.id)}
                        className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Escrow
                      </button>
                      <button
                        onClick={() => markDeedSigned(tx.id)}
                        className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                      >
                        Acte signe
                      </button>
                      <button
                        onClick={() => markCompleted(tx.id)}
                        className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Audit: {(tx.auditTrail || []).slice(0, 3).map((a) => a.action).join(' -> ') || 'Aucun evenement'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <p className={`mt-4 text-sm ${messageType === 'error' ? 'text-red-600' : 'text-primary-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
