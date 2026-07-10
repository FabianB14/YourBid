import { useEffect, useRef } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { RAISE_SECONDS } from '../config/gameConfig';
import { sfx } from '../services/sfx';

/** Animated 5-second raise countdown bar synced to an epoch-ms deadline. */
export function TimerBar({ deadline }: { deadline: number | null }) {
  const remaining = useCountdown(deadline);
  const lastTick = useRef<number>(-1);

  const seconds = remaining == null ? 0 : Math.ceil(remaining / 1000);

  // Tick on each whole second in the final stretch of the countdown.
  useEffect(() => {
    if (remaining == null) {
      lastTick.current = -1;
      return;
    }
    if (seconds > 0 && seconds <= 3 && seconds !== lastTick.current) {
      lastTick.current = seconds;
      sfx.tick();
    }
  }, [seconds, remaining]);

  if (deadline == null || remaining == null) return null;

  const total = RAISE_SECONDS * 1000;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const warn = remaining <= 2000;

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row spread">
        <span className="muted tiny">Going once…</span>
        <span className="timer-num" style={{ color: warn ? 'var(--danger)' : 'var(--text)' }}>
          {seconds}s
        </span>
      </div>
      <div className={`timerbar${warn ? ' warn' : ''}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
