import React, { useEffect, useRef } from 'react';

/**
 * AfriBayit 3D Animation Hero Component.
 *
 * Renders a 3D rotating cube with real-estate messaging on its faces,
 * a background image, and an optional overlay image. The cube reflects
 * below for a polished visual effect.
 *
 * FULLSCREEN — takes 100% of parent, no border-radius, no fixed size constraint.
 * Adapted for AfriBayit's brand palette (navy #003087, gold #D4AF37).
 */
export const PoemAnimation = ({
  poemHTML,
  backgroundImageUrl,
  overlayImageUrl,
}: {
  poemHTML: string;
  backgroundImageUrl: string;
  overlayImageUrl?: string;
}) => {
  const sectionRef = useRef<HTMLElement>(null);

  // No need for responsive scaling — CSS handles fullscreen via 100vw/100vh
  useEffect(() => {
    // Empty — fullscreen CSS takes care of layout
  }, []);

  return (
    <section ref={sectionRef} className="hero-3d-section hero-3d-fullscreen">
      <div className="hero-3d-outer hero-3d-fullscreen-outer">
        <div className="hero-3d-container-full hero-3d-fullscreen-container">
          <div className="animated hue" />
          <img
            className="hero-3d-backgroundImage"
            src={backgroundImageUrl}
            alt="Villa de luxe africaine"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {overlayImageUrl && (
            <img
              className="hero-3d-overlayImage"
              src={overlayImageUrl}
              alt="AfriBayit"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}

          <div className="hero-3d-cube-wrapper">
            <div className="cube">
              <div className="face top" />
              <div className="face bottom" />
              <div
                className="face left text"
                dangerouslySetInnerHTML={{ __html: poemHTML }}
              />
              <div
                className="face right text"
                dangerouslySetInnerHTML={{ __html: poemHTML }}
              />
              <div className="face front" />
              <div
                className="face back text"
                dangerouslySetInnerHTML={{ __html: poemHTML }}
              />
            </div>
          </div>

          <div className="hero-3d-cube-wrapper-reflect">
            <div className="cube">
              <div className="face top" />
              <div className="face bottom" />
              <div
                className="face left text"
                dangerouslySetInnerHTML={{ __html: poemHTML }}
              />
              <div
                className="face right text"
                dangerouslySetInnerHTML={{ __html: poemHTML }}
              />
              <div className="face front" />
              <div
                className="face back text"
                dangerouslySetInnerHTML={{ __html: poemHTML }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
