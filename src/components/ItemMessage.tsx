import { useState } from 'react';
import type { Item } from '../types';

/** "💌 Read" button that opens the item's long-form message (the love poem). */
export function ItemMessage({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  if (!item.message) return null;

  return (
    <>
      <button className="btn btn-gold btn-sm" onClick={() => setOpen(true)}>
        💌 Read
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 10 }}>
              <span className="brand-sub">💛 A note for you</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
              >
                ✕ Close
              </button>
            </div>
            <div
              style={{
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
                fontSize: 16,
                overflowY: 'auto',
                padding: '4px 2px',
              }}
            >
              {item.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
