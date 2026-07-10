// -----------------------------------------------------------------------------
// Currency configuration.
//
// The in-game currency is labelled "Bids" today, but is intentionally defined in
// ONE place so it can later be swapped for / integrated with the external VERSE
// token system. Change these constants only — do not hard-code "Bids" anywhere
// else in the UI.
// -----------------------------------------------------------------------------

export const CURRENCY = {
  /** Machine name, used for future token-system integration (e.g. VERSE). */
  name: 'BIDS',
  /** Human-facing label shown throughout the UI. */
  label: 'Bids',
  /** Singular label for "1 Bid". */
  labelSingular: 'Bid',
  /** Icon/emoji rendered next to amounts. Swap for a VERSE glyph later. */
  icon: '🪙',
} as const;

export function formatCurrency(amount: number): string {
  return `${CURRENCY.icon} ${amount}`;
}
