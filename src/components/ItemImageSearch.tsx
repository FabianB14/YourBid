import { useState } from 'react';
import type { Item } from '../types';
import { searchImages, looksLikeAnime } from '../services/images';
import { loadImageConfig } from '../services/imageConfig';

/**
 * "See images" — opens an in-page gallery of real images for the item, using
 * the topic as context and the best source for the content (anime art, Wikipedia,
 * Pexels, Openverse). A prominent "Open in Google Images" button covers exact
 * matches that free libraries can't hold (copyrighted art, specific products).
 */
export function ItemImageSearch({
  item,
  context = '',
}: {
  item: Item;
  context?: string;
}) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState<string[] | null>(null); // null = loading

  const query = [item.name, context].filter(Boolean).join(' ').trim();
  const anime = looksLikeAnime(`${context} ${item.category} ${item.name}`);
  const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
    query
  )}`;

  const openGallery = () => {
    setOpen(true);
    setUrls(null);
    searchImages({
      name: item.name,
      query,
      pexelsKey: loadImageConfig().pexelsKey,
      anime,
      limit: 9,
    })
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

            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-accent btn-sm btn-block"
              style={{ marginBottom: 10 }}
            >
              🔎 Open exact results in Google Images ↗
            </a>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {urls === null && (
                <div className="stack center" style={{ padding: 24, gap: 12 }}>
                  <div className="spinner" />
                  <span className="faint tiny">Finding images…</span>
                </div>
              )}
              {urls !== null && urls.length === 0 && (
                <div className="stack center" style={{ padding: 20, gap: 8 }}>
                  <div style={{ fontSize: 40 }}>🖼️</div>
                  <span className="faint tiny" style={{ textAlign: 'center' }}>
                    No inline images found — use Google Images above for the
                    exact match.
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
          </div>
        </div>
      )}
    </>
  );
}
