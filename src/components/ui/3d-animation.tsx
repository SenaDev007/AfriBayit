import React, { useEffect, useRef } from 'react';

/**
 * AfriBayit 3D Animation Hero Component.
 *
 * Renders a 3D rotating cube with real-estate messaging on its faces,
 * a background image, and an optional overlay image. The cube reflects
 * below for a polished visual effect.
 *
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
  const contentRef = useRef<HTMLDivElement>(null);

  // Responsive scaling of the animation container
  useEffect(() => {
    function adjustContentSize() {
      if (contentRef.current) {
        const viewportWidth = window.innerWidth;
        const baseWidth = 1000;
        const scaleFactor =
          viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.9 : 1;
        contentRef.current.style.transform = `scale(${scaleFactor})`;
      }
    }

    adjustContentSize();
    window.addEventListener('resize', adjustContentSize);
    return () => window.removeEventListener('resize', adjustContentSize);
  }, []);

  return (
    <header className="hero-3d-section">
      <div className="hero-3d-outer">
        <div
          ref={contentRef}
          className="hero-3d-content"
          style={{ display: 'block', width: '1000px', height: '562px' }}
        >
          <div className="hero-3d-container-full">
            <div className="animated hue" />
            <img
              className="hero-3d-backgroundImage"
              src={backgroundImageUrl}
              alt="Paysage urbain africain"
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
      </div>
    </header>
  );
};
