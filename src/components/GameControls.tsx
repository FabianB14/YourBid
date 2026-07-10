import { useState } from 'react';
import type { GameController } from '../store/controller';
import type { GameState } from '../types';
import { useGame } from '../store/GameContext';
import { isMuted, setMuted, sfx } from '../services/sfx';

/** 🔊/🔇 toggle that persists the mute preference. */
export function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());
  return (
    <button
      className="btn btn-ghost btn-sm"
      title={muted ? 'Unmute sound' : 'Mute sound'}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
        if (!next) sfx.click();
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

/**
 * In-game control bar: sound toggle, a host-only Restart (returns everyone to
 * the lobby), and Leave (exit to Home). Both destructive actions confirm inline.
 */
export function GameControls({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const { leave } = useGame();
  const isHost = state.hostId === controller.localPlayerId;
  const [confirm, setConfirm] = useState<'none' | 'leave' | 'restart'>('none');

  if (confirm === 'leave') {
    return (
      <div className="row spread" style={{ gap: 8 }}>
        <span className="tiny muted">Leave the game?</span>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm('none')}>
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" onClick={leave}>
            Leave
          </button>
        </div>
      </div>
    );
  }

  if (confirm === 'restart') {
    return (
      <div className="row spread" style={{ gap: 8 }}>
        <span className="tiny muted">Restart for everyone?</span>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm('none')}>
            Cancel
          </button>
          <button
            className="btn btn-gold btn-sm"
            onClick={() => {
              controller.playAgain();
              setConfirm('none');
            }}
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
      <SoundToggle />
      {isHost && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirm('restart')}
        >
          ↺ Restart
        </button>
      )}
      <button className="btn btn-danger btn-sm" onClick={() => setConfirm('leave')}>
        Leave
      </button>
    </div>
  );
}
