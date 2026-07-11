import { useState } from 'react';
import type { Item } from '../types';
import { searchImages } from '../services/images';
import { loadImageConfig } from '../services/imageConfig';

/**
 * "See images" — opens an in-page gallery of real photos for the item (Pexels
 * if a key is set, plus keyless Openverse). Stays on the page; includes an
 * "Open in Google Images" link as an exact-match fallback.
 */
export function ItemImageSearch({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<string[] | null>(null); // null = loading

  const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
    item.name
  )}`;

  const openGallery = () => {
    setOpen(true);
    setUrls(null);
    searchImages(item.name, loadImageConfig().pexelsKey, 9)
      .then(setUrls)
      .catch(() => setUrls([]));
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={openGallery}>
        🔍 See images
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 10 }}>
              <div className="stack" style={{ gap: 0, minWidth: 0 }}>
                <span className="brand-sub">Images</span>
                <span
                  style={{
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {urls === null && (
                <div className="stack center" style={{ padding: 24, gap: 12 }}>
                  <div className="spinner" />
                  <span className="faint tiny">Finding images…</span>
                </div>
              )}
              {urls !== null && urls.length === 0 && (
                <div className="stack center" style={{ padding: 24, gap: 8 }}>
                  <div style={{ fontSize: 40 }}>🖼️</div>
                  <span className="faint tiny" style={{ textAlign: 'center' }}>
                    No inline images found — try “Open in Google Images” below.
                  </span>
                </div>
              )}
              {urls !== null && urls.length > 0 && (
                <div className="img-grid">
                  {urls.map((u, i) => (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="img-cell"
                    >
                      <img src={u} alt={`${item.name} ${i + 1}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="faint tiny"
              style={{ marginTop: 10, textAlign: 'center' }}
            >
              Not the right one? Open in Google Images ↗
            </a>
          </div>
        </div>
      )}
    </>
  );
}
