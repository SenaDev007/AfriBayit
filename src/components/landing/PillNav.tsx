'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  match: string;
}

/**
 * Pilule de navigation 3D — version STABLE (sans animation).
 *
 * Portage du design signature de Win-Agro (dégradé navy, arête supérieure
 * or, relief 3D, gloss) sur la palette AfriBayit, mais figée :
 *   - Aucun spring framer-motion, aucun timer, aucune auto-expansion
 *   - La pilule est TOUJOURS étendue et affiche tous les liens
 *   - Simple survol CSS (changement de couleur uniquement)
 *
 * Demandé explicitement : le menu doit rester stable, sans animation,
 * tout en respectant le design Win-Agro.
 */
export const PillNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Accueil', href: '/', match: '/' },
    { label: 'Acheter', href: '/acheter', match: '/acheter' },
    { label: 'Louer', href: '/louer', match: '/louer' },
    { label: 'Séjours', href: '/sejours', match: '/sejours' },
    { label: 'Services', href: '/artisans', match: '/artisans' },
  ];

  // Détection de la section active selon la route courante
  const activeSection = (() => {
    if (pathname === '/') return navItems[0].match;
    const found = [...navItems]
      .slice(1)
      .sort((a, b) => b.match.length - a.match.length)
      .find((item) => pathname.startsWith(item.match));
    return found?.match ?? navItems[0].match;
  })();

  const handleSectionClick = (item: NavItem) => {
    router.push(item.href);
  };

  return (
    <nav
      className="relative rounded-full h-[56px] flex items-center px-2"
      style={{
        width: 620,
        // Dégradé navy AfriBayit — équivalent du dégradé vert Win-Agro
        background: `
          linear-gradient(135deg,
            #00256E 0%,
            #002A75 15%,
            #003087 30%,
            #002A75 45%,
            #00256E 60%,
            #001F5C 75%,
            #001A4D 90%,
            #00256E 100%
          )
        `,
        // Relief 3D statique (état étendu Win-Agro)
        boxShadow: `
          0 2px 4px rgba(0, 0, 0, 0.12),
          0 6px 12px rgba(0, 48, 135, 0.2),
          0 12px 24px rgba(0, 48, 135, 0.25),
          0 24px 48px rgba(0, 0, 0, 0.15),
          inset 0 2px 2px rgba(255, 255, 255, 0.2),
          inset 0 -3px 8px rgba(0, 0, 0, 0.25),
          inset 3px 3px 8px rgba(0, 0, 0, 0.2),
          inset -3px 3px 8px rgba(0, 0, 0, 0.18),
          inset 0 -1px 2px rgba(0, 0, 0, 0.15)
        `,
        overflow: 'hidden',
      }}
    >
      {/* Arête supérieure — or AfriBayet (jaune Win-Agro) */}
      <div
        className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"
        style={{
          height: '2px',
          background:
            'linear-gradient(90deg, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0.95) 5%, rgba(230, 194, 71, 1) 15%, rgba(230, 194, 71, 1) 85%, rgba(212, 175, 55, 0.95) 95%, rgba(212, 175, 55, 0) 100%)',
          filter: 'blur(0.3px)',
        }}
      />

      {/* Attrape-lumière hémisphère supérieur */}
      <div
        className="absolute inset-x-0 top-0 rounded-full pointer-events-none"
        style={{
          height: '55%',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 30%, rgba(255, 255, 255, 0.05) 60%, rgba(255, 255, 255, 0) 100%)',
        }}
      />

      {/* Lumière directionnelle — haut gauche */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 20%, rgba(255, 255, 255, 0.03) 40%, rgba(255, 255, 255, 0) 65%)',
        }}
      />

      {/* Reflet glossy premium principal */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: '18%',
          top: '16%',
          width: '140px',
          height: '14px',
          background:
            'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.18) 40%, rgba(255, 255, 255, 0.05) 70%, rgba(255, 255, 255, 0) 100%)',
          filter: 'blur(4px)',
          transform: 'rotate(-12deg)',
        }}
      />

      {/* Reflet glossy secondaire */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          right: '22%',
          top: '20%',
          width: '80px',
          height: '10px',
          background:
            'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0) 100%)',
          filter: 'blur(3px)',
          transform: 'rotate(8deg)',
        }}
      />

      {/* Illumination du bord gauche */}
      <div
        className="absolute inset-y-0 left-0 rounded-l-full pointer-events-none"
        style={{
          width: '35%',
          background:
            'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.01) 70%, rgba(255, 255, 255, 0) 100%)',
        }}
      />

      {/* Ombre du bord droit */}
      <div
        className="absolute inset-y-0 right-0 rounded-r-full pointer-events-none"
        style={{
          width: '35%',
          background:
            'linear-gradient(270deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 40%, rgba(0, 0, 0, 0.05) 70%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Courbure inférieure — ombre profonde */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"
        style={{
          height: '50%',
          background:
            'linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 25%, rgba(0, 0, 0, 0.05) 50%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Ombre de contact du bord inférieur */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"
        style={{
          height: '20%',
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Halo diffus interne */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.15)',
          opacity: 0.7,
        }}
      />

      {/* Définition micro du bord */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 0.5px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Liens de navigation — stables, simples survols CSS */}
      <div
        className="relative z-10 h-full flex items-center justify-evenly w-full gap-2"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro", Poppins, sans-serif',
        }}
      >
        {navItems.map((item) => {
          const isActive = item.match === activeSection;

          return (
            <button
              key={item.match}
              onClick={() => handleSectionClick(item)}
              className={`relative cursor-pointer bg-transparent border-none outline-none whitespace-nowrap ${
                isActive
                  ? 'text-[#E6C247]' // Or actif AfriBayit
                  : 'text-[#E6EEF9] hover:text-white' // Bleu pâle → blanc au survol (CSS pur)
              }`}
              style={{
                fontSize: isActive ? '15px' : '14.5px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.45px',
                padding: '8px 12px',
                transform: isActive ? 'translateY(-1.5px)' : 'translateY(0)',
                WebkitFontSmoothing: 'antialiased',
                textShadow: isActive
                  ? `
                    0 1px 0 rgba(0, 0, 0, 0.6),
                    0 -1px 0 rgba(0, 0, 0, 0.3),
                    1px 1px 0 rgba(0, 0, 0, 0.2)
                  `
                  : `
                    0 1px 0 rgba(0, 0, 0, 0.4),
                    0 -1px 0 rgba(0, 0, 0, 0.2)
                  `,
              } as React.CSSProperties}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default PillNav;
