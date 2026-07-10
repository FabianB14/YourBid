// Small pure utilities.

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

/** Generate a 6-character room join code. */
export function makeRoomCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

let idCounter = 0;
/** Reasonably-unique id for local (non-Firebase) use. */
export function makeId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.floor(
    Math.random() * 1e6
  ).toString(36)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Round to one decimal place. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
