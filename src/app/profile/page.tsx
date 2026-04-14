'use client'

import { Mail, Phone, User } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pt-28 pb-12">
      <div className="container-custom max-w-3xl">
        <section className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/70 dark:border-neutral-700 p-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Profil utilisateur
          </h1>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-200">
              <User className="w-5 h-5 text-primary-600" />
              <span>{user?.firstName || '-'} {user?.lastName || ''}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-200">
              <Mail className="w-5 h-5 text-primary-600" />
              <span>{user?.email || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-200">
              <Phone className="w-5 h-5 text-primary-600" />
              <span>{user?.phone || '-'}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
