import React, { useEffect, useRef } from 'react';

/**
 * AfriBayit 3D Poem Animation Hero Component — Futuristic Room Edition.
 *
 * Renders a 3D rotating cube with real-estate messaging on its faces,
 * a background image, an overlay image, plus futuristic room effects:
 * - Neon ceiling light strips (blue #009CDE)
 * - Dark room with perspective lines
 * - Floor reflection gradient
 * - Vignette overlay darkening edges
 * - Floating gold (#D4AF37) particles
 * - Warm golden ambient light contrasting with cool blue neon
 *
 * Adapted for AfriBayit's brand palette (navy #003087, gold #D4AF37).
 */
export const PoemAnimation = ({ poemHTML, backgroundImageUrl, boyImageUrl }: {
  poemHTML: string;
  backgroundImageUrl: string;
  boyImageUrl?: string;
}) => {
    const contentRef = useRef(null);

    // This effect handles the responsive scaling of the animation container.
    useEffect(() => {
        function adjustContentSize() {
            if (contentRef.current) {
                const viewportWidth = window.innerWidth;
                const baseWidth = 1000;
                const scaleFactor = viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.9 : 1;
                (contentRef.current as HTMLElement).style.transform = `scale(${scaleFactor})`;
            }
        }

        adjustContentSize();
        window.addEventListener("resize", adjustContentSize);
        return () => window.removeEventListener("resize", adjustContentSize);
    }, []);

    return (
        <header className="hero-section">
            <div className="container">
                <div
                    ref={contentRef}
                    className="content"
                    style={{ display: 'block', width: '1000px', height: '562px' }}
                >
                    <div className="container-full">
                        <div className="animated hue"></div>
                        <img className="backgroundImage" src={backgroundImageUrl} alt="Villa de luxe africaine" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        {boyImageUrl && (
                          <img className="boyImage" src={boyImageUrl} alt="AfriBayit" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}

                        {/* ═══ Futuristic Room Overlays ═══ */}

                        {/* Neon ceiling light strip — primary */}
                        <div className="neon-strip-primary" style={{
                          position: 'absolute', top: '6%', left: '8%', right: '8%', height: '2px',
                          background: 'linear-gradient(90deg, transparent 0%, #009CDE 20%, #009CDE 80%, transparent 100%)',
                          boxShadow: '0 0 20px rgba(0, 156, 222, 0.5), 0 0 40px rgba(0, 156, 222, 0.2), 0 2px 8px rgba(0, 156, 222, 0.3)',
                          zIndex: 5,
                        }} />

                        {/* Neon ceiling light strip — secondary (thinner, offset) */}
                        <div className="neon-strip-secondary" style={{
                          position: 'absolute', top: '10%', left: '12%', right: '12%', height: '1px',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 156, 222, 0.6) 25%, rgba(0, 156, 222, 0.8) 50%, rgba(0, 156, 222, 0.6) 75%, transparent 100%)',
                          boxShadow: '0 0 10px rgba(0, 156, 222, 0.3), 0 1px 4px rgba(0, 156, 222, 0.2)',
                          zIndex: 5,
                        }} />

                        {/* Neon ceiling light strip — tertiary (widest, subtle) */}
                        <div className="neon-strip-tertiary" style={{
                          position: 'absolute', top: '14%', left: '5%', right: '5%', height: '1px',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 156, 222, 0.3) 15%, rgba(0, 156, 222, 0.5) 50%, rgba(0, 156, 222, 0.3) 85%, transparent 100%)',
                          boxShadow: '0 0 8px rgba(0, 156, 222, 0.2)',
                          zIndex: 5,
                        }} />

                        {/* Neon light reflection on ceiling area */}
                        <div style={{
                          position: 'absolute', top: 0, left: '10%', right: '10%', height: '18%',
                          background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 156, 222, 0.08) 0%, transparent 70%)',
                          zIndex: 4,
                          pointerEvents: 'none',
                        }} />

                        {/* Room perspective lines — left wall */}
                        <div className="room-perspective-line" style={{
                          position: 'absolute', top: 0, left: 0, width: '3px', height: '100%',
                          background: 'linear-gradient(to bottom, rgba(0, 156, 222, 0.15) 0%, rgba(0, 156, 222, 0.05) 50%, transparent 100%)',
                          zIndex: 4,
                          pointerEvents: 'none',
                        }} />

                        {/* Room perspective lines — right wall */}
                        <div className="room-perspective-line" style={{
                          position: 'absolute', top: 0, right: 0, width: '3px', height: '100%',
                          background: 'linear-gradient(to bottom, rgba(0, 156, 222, 0.15) 0%, rgba(0, 156, 222, 0.05) 50%, transparent 100%)',
                          zIndex: 4,
                          pointerEvents: 'none',
                          animationDelay: '3s',
                        }} />

                        {/* Room perspective diagonal — top-left corner */}
                        <div className="room-perspective-line" style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '200px', height: '2px',
                          background: 'linear-gradient(90deg, rgba(0, 156, 222, 0.2), transparent)',
                          transformOrigin: 'left center',
                          transform: 'rotate(30deg)',
                          zIndex: 4,
                          pointerEvents: 'none',
                        }} />

                        {/* Room perspective diagonal — top-right corner */}
                        <div className="room-perspective-line" style={{
                          position: 'absolute', top: 0, right: 0,
                          width: '200px', height: '2px',
                          background: 'linear-gradient(270deg, rgba(0, 156, 222, 0.2), transparent)',
                          transformOrigin: 'right center',
                          transform: 'rotate(-30deg)',
                          zIndex: 4,
                          pointerEvents: 'none',
                          animationDelay: '2s',
                        }} />

                        {/* Warm golden ambient light — left side */}
                        <div className="warm-ambient-glow" style={{
                          position: 'absolute', bottom: '10%', left: '-5%',
                          width: '40%', height: '50%',
                          background: 'radial-gradient(ellipse at 20% 80%, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.04) 40%, transparent 70%)',
                          zIndex: 4,
                          pointerEvents: 'none',
                        }} />

                        {/* Warm golden ambient light — right side (stronger, near silhouette) */}
                        <div className="warm-ambient-glow" style={{
                          position: 'absolute', bottom: '5%', right: '5%',
                          width: '35%', height: '45%',
                          background: 'radial-gradient(ellipse at 70% 70%, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 40%, transparent 70%)',
                          zIndex: 4,
                          pointerEvents: 'none',
                          animationDelay: '3s',
                        }} />

                        {/* Floor reflection gradient */}
                        <div className="floor-reflection" style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
                          zIndex: 4,
                          pointerEvents: 'none',
                        }} />

                        {/* Floor reflection shine line */}
                        <div style={{
                          position: 'absolute', bottom: '22%', left: '15%', right: '15%', height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(0, 156, 222, 0.15), rgba(255, 255, 255, 0.08), rgba(0, 156, 222, 0.15), transparent)',
                          zIndex: 4,
                          pointerEvents: 'none',
                        }} />

                        {/* Vignette overlay — darkens edges for room feel */}
                        <div className="vignette-overlay" style={{
                          position: 'absolute', inset: 0,
                          background: 'radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0, 20, 64, 0.4) 60%, rgba(0, 10, 32, 0.85) 100%)',
                          zIndex: 6,
                          pointerEvents: 'none',
                        }} />

                        {/* Floating gold particles */}
                        <div className="particle-gold particle-gold-1" style={{ position: 'absolute', bottom: '25%', left: '15%', width: '4px', height: '4px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-2" style={{ position: 'absolute', bottom: '30%', left: '35%', width: '3px', height: '3px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-3" style={{ position: 'absolute', bottom: '20%', left: '55%', width: '5px', height: '5px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-4" style={{ position: 'absolute', bottom: '35%', left: '70%', width: '3px', height: '3px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-5" style={{ position: 'absolute', bottom: '15%', left: '80%', width: '4px', height: '4px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-6" style={{ position: 'absolute', bottom: '40%', left: '25%', width: '2px', height: '2px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-7" style={{ position: 'absolute', bottom: '28%', left: '45%', width: '3px', height: '3px', zIndex: 7, pointerEvents: 'none' }} />
                        <div className="particle-gold particle-gold-8" style={{ position: 'absolute', bottom: '18%', left: '62%', width: '4px', height: '4px', zIndex: 7, pointerEvents: 'none' }} />

                        {/* ═══ End Futuristic Room Overlays ═══ */}

                        <div className="container">
                            <div className="cube">
                                <div className="face top"></div>
                                <div className="face bottom"></div>
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face front"></div>
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                            </div>
                        </div>

                        <div className="container-reflect">
                            <div className="cube">
                                <div className="face top"></div>
                                <div className="face bottom"></div>
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face front"></div>
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
