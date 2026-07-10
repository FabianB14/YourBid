import { useEffect, useState } from 'react';
import type { Item } from '../types';
import { resolveItemImage } from '../services/images';
import { loadImageConfig } from '../services/imageConfig';

// Module-level cache so an item's image is fetched at most once per session,
// even across re-renders, repeated items, or revisiting screens.
const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function keyFor(item: Item): string {
  return `${item.category}::${item.name}`.toLowerCase();
}

/**
 * Resolve an item's image lazily. If the item already carries an `imageUrl`
 * (e.g. supplied by generation), that wins. Otherwise it's looked up once from
 * the free image sources and cached. Returns `undefined` while loading.
 */
export function useItemImage(item: Item): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(() => {
    if (item.imageUrl) return item.imageUrl;
    return cache.get(keyFor(item));
  });

  useEffect(() => {
    if (item.imageUrl) {
      setUrl(item.imageUrl);
      return;
    }
    const key = keyFor(item);
    if (cache.has(key)) {
      setUrl(cache.get(key));
      return;
    }
    let active = true;
    let promise = inflight.get(key);
    if (!promise) {
      promise = resolveItemImage(item, loadImageConfig().pexelsKey).catch(
        () => null
      );
      inflight.set(key, promise);
    }
    setUrl(undefined);
    promise.then((resolved) => {
      cache.set(key, resolved);
      inflight.delete(key);
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [item.id, item.name, item.category, item.imageUrl]);

  return url;
}
