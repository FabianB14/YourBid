// Lightweight sound effects synthesized with the Web Audio API — no audio files
// and no dependency, so it works anywhere (including static hosting). Each cue
// is a few short oscillator tones. A mute preference persists in localStorage.

let ctx: AudioContext | null = null;
let muted = loadMuted();

function loadMuted(): boolean {
  try {
    return localStorage.getItem('yourbid.muted') === '1';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem('yourbid.muted', value ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (!value) resume();
}

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Resume the audio context (call from a user gesture to satisfy autoplay). */
export function resume(): void {
  getCtx();
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  release?: number;
  slideTo?: number;
}

function tone(
  freq: number,
  startAt: number,
  dur: number,
  opts: ToneOpts = {}
): void {
  const c = getCtx();
  if (!c) return;
  const { type = 'sine', gain = 0.18, attack = 0.006, release = 0.08, slideTo } =
    opts;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, startAt + dur);
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(gain, startAt + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur + release);
  osc.connect(g).connect(c.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + release + 0.02);
}

function now(): number {
  return ctx ? ctx.currentTime : 0;
}

export const sfx = {
  /** You placed a bid — bright confirming blip. */
  bid() {
    const t = now();
    tone(660, t, 0.09, { type: 'triangle', gain: 0.2 });
    tone(990, t + 0.05, 0.08, { type: 'triangle', gain: 0.16 });
  },
  /** Someone else raised. */
  raise() {
    const t = now();
    tone(520, t, 0.09, { type: 'sine', gain: 0.14 });
  },
  /** You got outbid — descending "uh-oh". */
  outbid() {
    const t = now();
    tone(440, t, 0.14, { type: 'sawtooth', gain: 0.14, slideTo: 300 });
  },
  /** Someone won the item. */
  win() {
    const t = now();
    tone(523, t, 0.1, { type: 'triangle', gain: 0.14 });
    tone(659, t + 0.09, 0.12, { type: 'triangle', gain: 0.14 });
  },
  /** You won the item — little rising arpeggio. */
  winBig() {
    const t = now();
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, t + i * 0.08, 0.12, { type: 'triangle', gain: 0.18 })
    );
  },
  /** Countdown tick in the final seconds. */
  tick() {
    const t = now();
    tone(880, t, 0.04, { type: 'square', gain: 0.08, release: 0.03 });
  },
  /** An item was passed / discarded. */
  pass() {
    const t = now();
    tone(300, t, 0.12, { type: 'sine', gain: 0.1, slideTo: 200 });
  },
  /** Game started. */
  start() {
    const t = now();
    [392, 523, 659].forEach((f, i) =>
      tone(f, t + i * 0.1, 0.14, { type: 'triangle', gain: 0.18 })
    );
  },
  /** Results / fanfare. */
  results() {
    const t = now();
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(f, t + i * 0.12, 0.2, { type: 'triangle', gain: 0.16 })
    );
  },
  /** Generic UI click. */
  click() {
    const t = now();
    tone(600, t, 0.03, { type: 'square', gain: 0.06, release: 0.02 });
  },
};
