'use client'

import Link from 'next/link'
import { BarChart3, Building2, Bell, User2, ShieldCheck, Landmark } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pt-28 pb-12">
      <div className="container-custom">
        <section className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/70 dark:border-neutral-700 p-8 mb-8">
          <p className="text-sm text-primary-600 font-medium mb-2">Tableau de bord</p>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Bienvenue{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 mt-3">
            Cette page centralise vos actions clefs: profil, annonces, alertes et suivi d'activite.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link href="/profile" className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/70 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow">
            <User2 className="w-6 h-6 text-primary-600 mb-3" />
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Mon profil</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Mettre a jour vos informations personnelles.</p>
          </Link>

          <Link href="/properties" className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/70 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow">
            <Building2 className="w-6 h-6 text-primary-600 mb-3" />
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Mes proprietes</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Consulter vos annonces et disponibilites.</p>
          </Link>

          <Link href="/settings" className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/70 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow">
            <Bell className="w-6 h-6 text-primary-600 mb-3" />
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Parametres</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Gerer notifications, securite et preferences.</p>
          </Link>

          <Link href="/kyc" className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/70 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow">
            <ShieldCheck className="w-6 h-6 text-primary-600 mb-3" />
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">KYC</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Soumettre et suivre ta verification identite.</p>
          </Link>

          <Link href="/transactions" className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/70 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow">
            <Landmark className="w-6 h-6 text-primary-600 mb-3" />
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Escrow</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Suivre les transactions et etats escrow.</p>
          </Link>
        </section>

        <section className="mt-8 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200/70 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold mb-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Resume activite
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Les KPIs dynamiques seront relies aux APIs dashboard pendant la phase M5/M6.
          </p>
        </section>
      </div>
    </main>
  )
}
