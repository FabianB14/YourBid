import { useCountdown } from '../hooks/useCountdown';
import { RAISE_SECONDS } from '../config/gameConfig';

/** Animated 5-second raise countdown bar synced to an epoch-ms deadline. */
export function TimerBar({ deadline }: { deadline: number | null }) {
  const remaining = useCountdown(deadline);
  if (deadline == null || remaining == null) return null;

  const total = RAISE_SECONDS * 1000;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const seconds = Math.ceil(remaining / 1000);
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
