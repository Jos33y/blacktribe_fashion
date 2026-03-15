import { useState, useRef } from 'react';
import '../../styles/product/VideoPlayer.css';

export default function VideoPlayer({ src, poster }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  if (!src) return null;

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="video-player">
      <div className="video-player-wrapper">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={isPlaying}
          playsInline
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
          className="video-player-element"
        >
          <p>Your browser does not support HTML5 video.</p>
        </video>
        {!isPlaying && (
          <button className="video-play-btn" onClick={handlePlay} aria-label="Play video" type="button">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1" opacity="0.8" />
              <path d="M19 16l14 8-14 8V16z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
