/*
 * BLACKTRIBE FASHION — IMAGE UPLOADER
 *
 * Uploads images directly to Supabase Storage (products bucket).
 * Uses the frontend Supabase client with the user's JWT for auth.
 *
 * Features:
 *   - Drag-and-drop (desktop)
 *   - Tap to browse / camera capture (mobile)
 *   - Preview grid with reorder (up/down), delete
 *   - Uploads immediately on selection
 *   - Returns array of public URLs
 *   - Max 8 images per product
 *
 * Props:
 *   images: string[] — current image URLs
 *   onChange: (urls: string[]) => void
 *   folder: string — storage folder path (e.g., 'products/crystal-trucker')
 */

import { useState, useRef } from 'react';
import { supabase } from '../../utils/supabase';

const MAX_IMAGES = 8;
const MAX_SIZE_MB = 5;
const ACCEPTED = 'image/jpeg,image/png,image/webp';
const BUCKET = 'products';

export default function ImageUploader({ images = [], onChange, folder = 'uploads' }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) return;

    setUploading(true);
    const newUrls = [];

    for (const file of files) {
      /* Validate */
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) continue;

      /* Generate unique filename */
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      try {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(name, file, {
            cacheControl: '31536000',
            upsert: false,
          });

        if (error) {
          console.error('[upload] error:', error.message);
          continue;
        }

        /* Get public URL */
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(name);

        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }
      } catch (err) {
        console.error('[upload] exception:', err);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setUploading(false);
    /* Reset input so same file can be re-selected */
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (remaining <= 0) return;
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (remaining > 0) setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleRemove(index) {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleMove(index, direction) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="img-uploader">
      {/* Drop zone */}
      <div
        className={`img-uploader__zone ${dragOver ? 'img-uploader__zone--drag' : ''} ${uploading ? 'img-uploader__zone--busy' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => remaining > 0 && !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          className="img-uploader__input"
          tabIndex={-1}
        />

        {uploading ? (
          <div className="img-uploader__status">
            <span className="img-uploader__spinner" />
            <span>Uploading...</span>
          </div>
        ) : remaining > 0 ? (
          <div className="img-uploader__prompt">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="img-uploader__prompt-text">
              Drop images here or tap to {images.length > 0 ? 'add more' : 'upload'}
            </span>
            <span className="img-uploader__prompt-hint">
              JPG, PNG, WebP. Max {MAX_SIZE_MB}MB. {remaining} {remaining === 1 ? 'slot' : 'slots'} remaining.
            </span>
          </div>
        ) : (
          <div className="img-uploader__prompt">
            <span className="img-uploader__prompt-text">Maximum {MAX_IMAGES} images reached</span>
          </div>
        )}
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="img-uploader__grid">
          {images.map((url, i) => (
            <div key={url} className={`img-uploader__item ${i === 0 ? 'img-uploader__item--primary' : ''}`}>
              <img src={url} alt={`Product image ${i + 1}`} className="img-uploader__preview" />
              {i === 0 && <span className="img-uploader__badge">Primary</span>}
              <div className="img-uploader__controls">
                <button
                  className="img-uploader__ctrl-btn"
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  aria-label="Move left"
                  title="Move left"
                >
                  ‹
                </button>
                <button
                  className="img-uploader__ctrl-btn img-uploader__ctrl-btn--delete"
                  onClick={() => handleRemove(i)}
                  aria-label="Remove"
                  title="Remove"
                >
                  ×
                </button>
                <button
                  className="img-uploader__ctrl-btn"
                  onClick={() => handleMove(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move right"
                  title="Move right"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
