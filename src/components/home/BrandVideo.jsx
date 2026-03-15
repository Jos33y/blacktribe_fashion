import { useState, useRef } from 'react';

export default function BrandVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSound, setShowSound] = useState(false);
  const videoRef = useRef(null);

  const handlePlaySound = () => {
    if (videoRef.current) {
      if (videoRef.current.muted) {
        videoRef.current.muted = false;
        setShowSound(true);
      } else {
        videoRef.current.muted = true;
        setShowSound(false);
      }
    }
  };

  return (
    <section className="home-brand">
      <div className="home-brand__inner">
        {/* Editorial quote — left side */}
        <div className="home-brand__content">
          <span className="home-brand__eyebrow">The Culture</span>
          <blockquote className="home-brand__quote">
            <p>Not just clothing. A statement of where you come from and where you are going.</p>
          </blockquote>
          <span className="home-brand__attr">Redefining Luxury Since 2018</span>
        </div>

        {/* Video — right side / below on mobile */}
        <div className="home-brand__video-wrap">
          <video
            ref={videoRef}
            src="/video/black_tribe_hero_vid.mp4"
            className="home-brand__video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
          />

          {/* Sound toggle */}
          <button
            className="home-brand__sound"
            onClick={handlePlaySound}
            type="button"
            aria-label={showSound ? 'Mute video' : 'Play with sound'}
          >
            {showSound ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
