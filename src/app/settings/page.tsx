'use client'

import { Shield, Bell, Globe } from 'lucide-react'

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pt-28 pb-12">
      <div className="container-custom max-w-3xl">
        <section className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/70 dark:border-neutral-700 p-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Parametres du compte
          </h1>

          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                <Shield className="w-5 h-5 text-primary-600" />
                Securite
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                Gestion mot de passe, 2FA et sessions actives.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                <Bell className="w-5 h-5 text-primary-600" />
                Notifications
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                Reglages email, SMS et alertes immobiliere.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                <Globe className="w-5 h-5 text-primary-600" />
                Region et langue
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                Preferences localisation/pays (multitenant phase ulterieure).
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
