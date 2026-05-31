'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Footer() {
  return (
    <footer className="bg-[#001f5c] text-white pb-20 lg:pb-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="AfriBayit" className="h-9 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Où l&apos;Afrique trouve sa maison. Où les rêves deviennent adresses.
            </p>
            <div className="flex gap-3 mt-4">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <a key={social} href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                  <span className="text-xs text-white/70">{social[0].toUpperCase()}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Acheter */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#D4AF37]">Acheter</h4>
            <ul className="space-y-2.5">
              {['Villas', 'Appartements', 'Terrains', 'Bureaux', 'Commerces'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#D4AF37]">Services</h4>
            <ul className="space-y-2.5">
              {['Escrow Sécurisé', 'GeoTrust', 'ProMatch Artisans', 'Rebecca IA', 'Académie'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#D4AF37]">Entreprise</h4>
            <ul className="space-y-2.5">
              {['À propos', 'Carrières', 'Presse', 'Partenaires', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#D4AF37]">Légal</h4>
            <ul className="space-y-2.5">
              {['CGU', 'Confidentialité', 'Cookies', 'Mentions légales', 'Signaler'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">
            © 2025 AfriBayit. Tous droits réservés. Plateforme agréée par les autorités immobilières.
          </p>
          <div className="flex items-center gap-4">
            {['MTN', 'Orange', 'Moov', 'Visa', 'Mastercard'].map((provider) => (
              <span key={provider} className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/40 font-medium">
                {provider}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
