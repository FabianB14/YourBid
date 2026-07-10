import { useEffect, useRef } from 'react';

// Embeds Google's Programmable Search Element (cse.js) in image-search mode and
// runs the given query. Free, no API key — just a Search Engine ID (cx). The cx
// is public by design, so it's safe to embed on every client.

declare global {
  interface Window {
    __gcse?: { parsetags?: string; callback?: () => void };
    google?: {
      search?: {
        cse?: {
          element?: {
            render: (opts: {
              div: HTMLElement | string;
              tag: string;
              gname?: string;
              attributes?: Record<string, unknown>;
            }) => void;
            getElement: (gname: string) => { execute: (q: string) => void } | null;
          };
        };
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;
let loadedCx = '';
let counter = 0;

function loadCse(cx: string): Promise<void> {
  // cse.js binds to a single cx per page load. A given host uses one cx, so we
  // load once; if a different cx is requested later, a reload would be needed.
  if (loadPromise && loadedCx === cx) return loadPromise;
  if (loadPromise) return loadPromise; // already loading/loaded with some cx
  loadedCx = cx;
  loadPromise = new Promise<void>((resolve) => {
    window.__gcse = { parsetags: 'explicit', callback: () => resolve() };
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://cse.google.com/cse.js?cx=${encodeURIComponent(cx)}`;
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
  return loadPromise;
}

export function GoogleImageWidget({ cx, query }: { cx: string; query: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const gname = useRef(`yb-img-${++counter}`);

  useEffect(() => {
    let cancelled = false;
    loadCse(cx).then(() => {
      if (cancelled || !ref.current) return;
      const el = window.google?.search?.cse?.element;
      if (!el) return;
      let elem = el.getElement(gname.current);
      if (!elem) {
        el.render({
          div: ref.current,
          tag: 'searchresults-only',
          gname: gname.current,
          attributes: {
            enableImageSearch: true,
            defaultToImageSearch: true,
            image_defaultView: 'grid',
            gaCategoryParameter: '',
            noResultsString: 'No images found.',
          },
        });
        elem = el.getElement(gname.current);
      }
      elem?.execute(query);
    });
    return () => {
      cancelled = true;
    };
  }, [cx, query]);

  return <div ref={ref} className="gcse-host" />;
}
