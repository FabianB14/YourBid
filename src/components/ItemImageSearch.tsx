import { useState } from 'react';
import type { Item } from '../types';
import { GoogleImageWidget } from './GoogleImageWidget';

/**
 * "See real images" button. When a Google Search Engine ID (cx) is configured,
 * shows a button that opens a modal with a live Google image search for the
 * exact item — so players can see the real thing when the auto-image is off.
 */
export function ItemImageSearch({ item, cx }: { item: Item; cx: string }) {
  const [open, setOpen] = useState(false);
  if (!cx) return null;

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        🔍 See real images
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row spread" style={{ marginBottom: 10 }}>
              <div className="stack" style={{ gap: 0, minWidth: 0 }}>
                <span className="brand-sub">Real images</span>
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
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                ✕ Close
              </button>
            </div>
            <div className="gcse-scroll">
              <GoogleImageWidget cx={cx} query={item.name} />
            </div>
            <span className="faint tiny" style={{ marginTop: 8 }}>
              Live Google Images results — powered by your Programmable Search.
            </span>
          </div>
        </div>
      )}
    </>
  );
}
