'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useSpring, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
  match: string;
}

/**
 * Pilule de navigation 3D adaptative — portage du composant signature
 * de Win-Agro (components/ui/3d-adaptive-navigation-bar.tsx) sur la
 * palette AfriBayit : dégradé navy, arête supérieure or, texte actif or,
 * texte inactif bleu pâle AfriBayit (#E6EEF9).
 *
 * Comportement Win-Agro conservé :
 *   - Collapsée : affiche la section active (transition blur + slide)
 *   - Survol ou auto-expansion toutes les 15 s : révèle tous les liens
 *   - Springs framer-motion sur la largeur (140px ↔ 620px)
 *   - Relief 3D complet : arête lumineuse, gloss, ombres internes
 */
export const PillNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [isAutoExpanded, setIsAutoExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSectionRef = useRef('');

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

  // Springs pour le mouvement fluide (identiques Win-Agro)
  const pillWidth = useSpring(140, { stiffness: 220, damping: 25, mass: 1 });
  const pillShift = useSpring(0, { stiffness: 220, damping: 25, mass: 1 });

  const isPillExpanded = expanded || isAutoExpanded;

  // Expansion au survol — logique portée dans les handlers (pas d'effet)
  const handleMouseEnter = () => {
    setHovering(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setExpanded(true);
    setIsAutoExpanded(false);
    pillWidth.set(620);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setExpanded(false);
      if (!isAutoExpanded) {
        pillWidth.set(140);
      }
    }, 600);
  };

  // Nettoyage du timer de survol au démontage
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Auto-expansion périodique toutes les 15 secondes (Win-Agro)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hovering) {
        setIsAutoExpanded(true);
        pillWidth.set(620);

        setTimeout(() => {
          setIsAutoExpanded(false);
          if (!hovering) {
            pillWidth.set(140);
          }
        }, 3000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [hovering, pillWidth]);

  useEffect(() => {
    prevSectionRef.current = activeSection;
  }, [activeSection]);

  const handleSectionClick = (item: NavItem) => {
    setIsTransitioning(true);
    setHovering(false);
    setIsAutoExpanded(false);
    router.push(item.href);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const activeItem = navItems.find((item) => item.match === activeSection);

  return (
    <motion.nav
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
      className="relative rounded-full"
      style={{
        width: pillWidth,
        height: '56px',
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
        boxShadow: isPillExpanded
          ? `
            0 2px 4px rgba(0, 0, 0, 0.12),
            0 6px 12px rgba(0, 48, 135, 0.2),
            0 12px 24px rgba(0, 48, 135, 0.25),
            0 24px 48px rgba(0, 0, 0, 0.15),
            inset 0 2px 2px rgba(255, 255, 255, 0.2),
            inset 0 -3px 8px rgba(0, 0, 0, 0.25),
            inset 3px 3px 8px rgba(0, 0, 0, 0.2),
            inset -3px 3px 8px rgba(0, 0, 0, 0.18),
            inset 0 -1px 2px rgba(0, 0, 0, 0.15)
          `
          : isTransitioning
          ? `
            0 3px 6px rgba(0, 0, 0, 0.15),
            0 8px 16px rgba(0, 48, 135, 0.15),
            0 16px 32px rgba(0, 48, 135, 0.12),
            0 1px 2px rgba(0, 0, 0, 0.15),
            inset 0 2px 1px rgba(255, 255, 255, 0.25),
            inset 0 -2px 6px rgba(0, 0, 0, 0.2),
            inset 2px 2px 8px rgba(0, 0, 0, 0.15),
            inset -2px 2px 8px rgba(0, 0, 0, 0.12),
            inset 0 0 1px rgba(0, 0, 0, 0.25)
          `
          : `
            0 3px 6px rgba(0, 0, 0, 0.18),
            0 8px 16px rgba(0, 48, 135, 0.18),
            0 16px 32px rgba(0, 48, 135, 0.15),
            0 1px 2px rgba(0, 0, 0, 0.18),
            inset 0 2px 1px rgba(255, 255, 255, 0.25),
            inset 0 -2px 6px rgba(0, 0, 0, 0.22),
            inset 2px 2px 8px rgba(0, 0, 0, 0.18),
            inset -2px 2px 8px rgba(0, 0, 0, 0.15),
            inset 0 0 1px rgba(0, 0, 0, 0.25)
          `,
        x: pillShift,
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease-out',
      }}
    >
      {/* Arête supérieure — or AfriBayit (jaune Win-Agro) */}
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
          left: isPillExpanded ? '18%' : '15%',
          top: '16%',
          width: isPillExpanded ? '140px' : '60px',
          height: '14px',
          background:
            'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.18) 40%, rgba(255, 255, 255, 0.05) 70%, rgba(255, 255, 255, 0) 100%)',
          filter: 'blur(4px)',
          transform: 'rotate(-12deg)',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Reflet glossy secondaire — état étendu uniquement */}
      {isPillExpanded && (
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
      )}

      {/* Illumination du bord gauche — état étendu */}
      {isPillExpanded && (
        <div
          className="absolute inset-y-0 left-0 rounded-l-full pointer-events-none"
          style={{
            width: '35%',
            background:
              'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.01) 70%, rgba(255, 255, 255, 0) 100%)',
          }}
        />
      )}

      {/* Ombre du bord droit — état étendu */}
      {isPillExpanded && (
        <div
          className="absolute inset-y-0 right-0 rounded-r-full pointer-events-none"
          style={{
            width: '35%',
            background:
              'linear-gradient(270deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 40%, rgba(0, 0, 0, 0.05) 70%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      )}

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

      {/* Conteneur des éléments de navigation */}
      <div
        className="relative z-10 h-full flex items-center justify-center px-6"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro", Poppins, sans-serif',
        }}
      >
        {/* État collapsé — section active uniquement avec transitions douces */}
        {!isPillExpanded && (
          <div className="flex items-center relative">
            <AnimatePresence mode="wait">
              {activeItem && (
                <motion.span
                  key={activeItem.match}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{
                    duration: 0.35,
                    ease: [0.4, 0.0, 0.2, 1],
                  }}
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 680,
                    color: '#E6C247', // Or clair AfriBayit (jaune Win-Agro)
                    letterSpacing: '0.45px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    textShadow: `
                      0 1px 0 rgba(0, 0, 0, 0.5),
                      0 -1px 0 rgba(0, 0, 0, 0.3),
                      1px 1px 0 rgba(0, 0, 0, 0.2)
                    `,
                  } as React.CSSProperties}
                >
                  {activeItem.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* État étendu — toutes les sections en cascade */}
        {isPillExpanded && (
          <div className="flex items-center justify-evenly w-full gap-2">
            {navItems.map((item, index) => {
              const isActive = item.match === activeSection;

              return (
                <motion.button
                  key={item.match}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.25,
                    ease: 'easeOut',
                  }}
                  onClick={() => handleSectionClick(item)}
                  className="relative cursor-pointer transition-all duration-200"
                  style={{
                    fontSize: isActive ? '15px' : '14.5px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#E6C247' : '#E6EEF9', // Or actif / bleu pâle inactif
                    textDecoration: 'none',
                    letterSpacing: '0.45px',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    outline: 'none',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    transform: isActive ? 'translateY(-1.5px)' : 'translateY(0)',
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
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(-0.5px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#E6EEF9';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default PillNav;
