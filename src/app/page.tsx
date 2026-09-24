'use client';

import React from 'react';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import Services from '@/components/landing/Services';
import Catalog from '@/components/landing/Catalog';
import About from '@/components/landing/About';
import WhyUs from '@/components/landing/WhyUs';
import Testimonials from '@/components/landing/Testimonials';
import LeadForm from '@/components/landing/LeadForm';

/**
 * Page d'accueil AfriBayit — design Win-Agro appliqué de A à Z
 * (structure, styles, animations) sur la palette AfriBayit.
 *
 * Flux stratégique identique Win-Agro :
 *   Attirer (Hero) → Prouver (Stats) → Persuader (Services, Catalogue)
 *   → Assurer (About, WhyUs, Témoignages) → Convertir (Contact)
 *
 * La navigation (header) et le pied de page sont fournis par AppShell.
 */
export default function HomePage() {
  return (
    <main>
      {/* Section 01 — Hero (focus problème-solution + recherche) */}
      <Hero />

      {/* Section 02 — Statistiques (preuve et autorité) */}
      <Stats />

      {/* Section 03 — Services (packs de valeur détaillés) */}
      <Services />

      {/* Section 04 — Catalogue (annonces vérifiées + biens en vedette) */}
      <Catalog />

      {/* Section 05 — À propos (mission & vision panafricaine) */}
      <About />

      {/* Section 06 — Objection killer (Pourquoi choisir AfriBayit) */}
      <WhyUs />

      {/* Section 07 — Témoignages (preuve sociale) */}
      <Testimonials />

      {/* Section 08 — Contact / formulaire de conversion */}
      <LeadForm />
    </main>
  );
}
