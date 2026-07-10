import { CURRENCY } from '../config/currency';

const AVATAR_COLORS = ['#7c5cff', '#ff4d8d', '#00e0b8', '#ffcf4d', '#12b8ff'];

export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ name, id }: { name: string; id: string }) {
  return (
    <div className="avatar" style={{ background: avatarColor(id) }}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

/** A currency amount rendered with the (swappable) Bids icon + label. */
export function Bids({
  amount,
  showLabel = false,
}: {
  amount: number;
  showLabel?: boolean;
}) {
  return (
    <span className="pill-currency">
      {CURRENCY.icon} {amount}
      {showLabel ? ` ${amount === 1 ? CURRENCY.labelSingular : CURRENCY.label}` : ''}
    </span>
  );
}

/** Filled / empty slot dots. */
export function Slots({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="slots" aria-label={`${filled} of ${total} slots filled`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`slot${i < filled ? ' full' : ''}`} />
      ))}
    </div>
  );
}
