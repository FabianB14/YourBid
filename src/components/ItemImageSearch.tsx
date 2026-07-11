import type { Item } from '../types';

/**
 * "See images" — opens a real Google Images search for the exact item in a new
 * tab. No API key, no widget, no setup; works everywhere. The inline auto-image
 * (iTunes/Wikipedia/Pexels/Openverse) stays as the at-a-glance picture; this is
 * the reliable way to see the exact thing before bidding.
 */
export function ItemImageSearch({ item }: { item: Item }) {
  const query = encodeURIComponent(item.name);
  const url = `https://www.google.com/search?tbm=isch&q=${query}`;
  return (
    <a
      className="btn btn-ghost btn-sm"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      🔍 See images
    </a>
  );
}
