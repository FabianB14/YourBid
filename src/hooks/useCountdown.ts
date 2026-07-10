import { useEffect, useState } from 'react';

/**
 * Counts down to an epoch-ms deadline. Returns remaining ms (>= 0). Ticks on a
 * short interval for smooth animation. When `deadline` is null, returns null.
 */
export function useCountdown(deadline: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(
    deadline == null ? null : Math.max(0, deadline - Date.now())
  );

  useEffect(() => {
    if (deadline == null) {
      setRemaining(null);
      return;
    }
    let raf = 0;
    const update = () => {
      setRemaining(Math.max(0, deadline - Date.now()));
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [deadline]);

  return remaining;
}
