/*
 * BLACKTRIBE FASHION — IMAGE UPLOADER
 *
 * Uploads images directly to Supabase Storage (products bucket).
 * Uses the frontend Supabase client with the user's JWT for auth.
 *
 * Features:
 *   - Drag-and-drop (desktop)
 *   - Tap to browse (mobile: iOS/Android show Photo Library, Camera, Files)
 *   - In-browser shrinking: files over 5MB are resized/re-encoded until
 *     they fit. Files over 15MB are rejected before any processing.
 *   - Preview grid with reorder (up/down), delete
 *   - Uploads immediately on selection
 *   - Tells the admin which files were skipped and why
 *   - Returns array of public URLs
 *   - Max 8 images per product
 *
 * Note: no `capture` attribute on the input. On iOS, `capture` forces the
 * camera and hides the photo library. The explicit ACCEPTED list makes iOS
 * convert HEIC photos to JPEG before handing them over.
 *
 * Props:
 *   images: string[] — current image URLs
 *   onChange: (urls: string[]) => void
 *   folder: string — storage folder path (e.g., 'products/crystal-trucker')
 *   bucket?: string — storage bucket (default 'products'; editorial uses 'editorial')
 *   max?: number — max images (default 8; editorial image fields use 1)
 *   maxEdge?: number — long edge after shrinking (default 3000; editorial
 *                      print pages use 3600 for ~300dpi on full-bleed A4)
 */

import { useState, useRef } from 'react';
import { supabase } from '../../utils/supabase';

const MAX_IMAGES = 8;
const TARGET_SIZE_MB = 5;   /* Upload ceiling. Bigger files get shrunk. */
const MAX_INPUT_MB = 15;    /* Hard reject above this. Never decoded. */
/* Long edge after shrinking. Sized from the storefront:
   - Desktop gallery stack on retina: ~2300px tall at 1x
   - Lightbox on iPhone Pro Max (DPR 3): ~1600px at 1x, zooms to 3x
   3000px keeps the desktop stack sharp and gives real detail up to
   ~2x lightbox zoom, while staying well under 5MB and iOS canvas limits. */
const MAX_EDGE_PX = 3000;
const ACCEPTED = 'image/jpeg,image/png,image/webp';
const BUCKET = 'products';

const MB = 1024 * 1024;

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/* ---------- Shrinking helpers ---------- */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/*
 * Resize + re-encode until under TARGET_SIZE_MB.
 * JPEG stays JPEG. PNG/WebP go to WebP (keeps transparency); if the browser
 * can't encode WebP (older iOS Safari), PNG falls back to PNG.
 * Browsers apply EXIF orientation when decoding, so rotated phone photos
 * come out the right way up.
 */
async function shrinkImage(file, maxEdge = MAX_EDGE_PX) {
  const img = await loadImage(file);
  const wantType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';

  let scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const qualities = [0.86, 0.78, 0.7];

  for (let pass = 0; pass < 4; pass++) {
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    for (const q of qualities) {
      let blob = await canvasToBlob(canvas, wantType, q);
      /* WebP unsupported: browser silently returns PNG */
      if (blob && blob.type !== wantType && wantType === 'image/webp') {
        blob = await canvasToBlob(canvas, 'image/png');
      }
      if (blob && blob.size <= TARGET_SIZE_MB * MB) {
        canvas.width = canvas.height = 0; /* free memory on iOS */
        return blob;
      }
    }

    canvas.width = canvas.height = 0;
    scale *= 0.8; /* still too big: go smaller and retry */
  }

  throw new Error('Could not shrink below limit');
}

/* ---------- Component ---------- */

export default function ImageUploader({
  images = [],
  onChange,
  folder = 'uploads',
  bucket = BUCKET,
  max = MAX_IMAGES,
  maxEdge = MAX_EDGE_PX,
}) {
  const [status, setStatus] = useState(null); /* null | 'optimising' | 'uploading' */
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);

  const busy = status !== null;
  const remaining = max - images.length;

  async function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) return;

    setNotice('');
    const newUrls = [];
    const skipped = [];

    for (const file of files) {
      /* Validate */
      if (!file.type.startsWith('image/')) {
        skipped.push(`${file.name} (not an image)`);
        continue;
      }
      if (file.size > MAX_INPUT_MB * MB) {
        skipped.push(`${file.name} (over ${MAX_INPUT_MB}MB)`);
        continue;
      }

      /* Shrink if needed */
      let blob = file;
      if (file.size > TARGET_SIZE_MB * MB) {
        setStatus('optimising');
        try {
          blob = await shrinkImage(file, maxEdge);
        } catch (err) {
          console.error('[upload] shrink failed:', err);
          skipped.push(`${file.name} (couldn't optimise)`);
          continue;
        }
      }

      setStatus('uploading');

      /* Generate unique filename. Extension comes from the MIME type,
         since iOS can hand over converted files whose name doesn't match. */
      const type = blob.type || 'image/jpeg';
      const ext = EXT_BY_TYPE[type] || 'jpg';
      const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      try {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(name, blob, {
            cacheControl: '31536000',
            contentType: type,
            upsert: false,
          });

        if (error) {
          console.error('[upload] error:', error.message);
          skipped.push(`${file.name} (upload failed)`);
          continue;
        }

        /* Get public URL */
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(name);

        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }
      } catch (err) {
        console.error('[upload] exception:', err);
        skipped.push(`${file.name} (upload failed)`);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    if (skipped.length > 0) {
      setNotice(`Skipped: ${skipped.join(', ')}`);
    }
    setStatus(null);
    /* Reset input so same file can be re-selected */
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (remaining <= 0 || busy) return;
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
        className={`img-uploader__zone ${dragOver ? 'img-uploader__zone--drag' : ''} ${busy ? 'img-uploader__zone--busy' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => remaining > 0 && !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple={max > 1}
          onChange={(e) => handleFiles(e.target.files)}
          className="img-uploader__input"
          tabIndex={-1}
        />

        {busy ? (
          <div className="img-uploader__status">
            <span className="img-uploader__spinner" />
            <span>{status === 'optimising' ? 'Optimising...' : 'Uploading...'}</span>
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
              JPG, PNG, WebP. Up to {MAX_INPUT_MB}MB, large photos are optimised automatically. {remaining} {remaining === 1 ? 'slot' : 'slots'} remaining.
            </span>
          </div>
        ) : (
          <div className="img-uploader__prompt">
            <span className="img-uploader__prompt-text">
              {max === 1 ? 'Remove the image below to replace it' : `Maximum ${max} images reached`}
            </span>
          </div>
        )}
      </div>

      {/* Skipped files notice */}
      <p className="img-uploader__prompt-hint" role="status" aria-live="polite">
        {notice}
      </p>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="img-uploader__grid">
          {images.map((url, i) => (
            <div key={url} className={`img-uploader__item ${i === 0 && max > 1 ? 'img-uploader__item--primary' : ''}`}>
              <img src={url} alt={`Product image ${i + 1}`} className="img-uploader__preview" />
              {i === 0 && max > 1 && <span className="img-uploader__badge">Primary</span>}
              <div className="img-uploader__controls">
                {max > 1 && <button
                  type="button"
                  className="img-uploader__ctrl-btn"
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  aria-label="Move left"
                  title="Move left"
                >
                  ‹
                </button>}
                <button
                  type="button"
                  className="img-uploader__ctrl-btn img-uploader__ctrl-btn--delete"
                  onClick={() => handleRemove(i)}
                  aria-label="Remove"
                  title="Remove"
                >
                  ×
                </button>
                {max > 1 && <button
                  type="button"
                  className="img-uploader__ctrl-btn"
                  onClick={() => handleMove(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move right"
                  title="Move right"
                >
                  ›
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
