import { useItemImage } from '../hooks/useItemImage';
import type { Item } from '../types';

// Emoji shown in the placeholder while (or if) no image resolves, chosen from
// the item's category so the card still feels themed.
function placeholderGlyph(category: string): string {
  const c = category.toLowerCase();
  if (/song|album|music|track/.test(c)) return '🎵';
  if (/movie|film|show|tv/.test(c)) return '🎬';
  if (/sneaker|shoe/.test(c)) return '👟';
  if (/dish|food|drink/.test(c)) return '🍽️';
  if (/place|landmark|city|country/.test(c)) return '🗺️';
  if (/game/.test(c)) return '🎮';
  if (/art/.test(c)) return '🎨';
  return '🏷️';
}

/**
 * Item artwork with graceful states: a shimmer while loading, the real image
 * when found, or a themed emoji placeholder when there's no image.
 */
export function ItemImage({ item, size = 'lg' }: { item: Item; size?: 'lg' | 'sm' }) {
  const url = useItemImage(item);
  const cls = `item-image item-image-${size}`;

  if (url === undefined) {
    // loading
    return <div className={`${cls} item-image-loading`} aria-hidden />;
  }
  if (url === null) {
    return (
      <div className={`${cls} item-image-placeholder`} aria-hidden>
        <span>{placeholderGlyph(item.category)}</span>
      </div>
    );
  }
  return (
    <div className={cls}>
      <img
        src={url}
        alt={item.name}
        loading="eager"
        onError={(e) => {
          (e.currentTarget.parentElement as HTMLElement).classList.add(
            'item-image-broken'
          );
        }}
      />
    </div>
  );
}
