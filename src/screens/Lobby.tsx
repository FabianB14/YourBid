import { useEffect, useState } from 'react';
import type { GameController } from '../store/controller';
import type { GameState } from '../types';
import { useGame } from '../store/GameContext';
import { Avatar, Bids } from '../components/ui';
import { AiKeyPanel } from '../components/AiKeyPanel';
import { computeTotalItems } from '../game/logic';
import {
  BASE_ITEM_RANGE,
  MAX_PLAYERS,
  SLOTS_RANGE,
  STARTING_CURRENCY_RANGE,
} from '../config/gameConfig';

const EXAMPLE_TOPICS = [
  'Drake songs',
  'Horror movies from 2010–2026',
  'Denzel Washington movies',
  'Jordan sneakers under $300',
  'Foods from New Orleans',
  'One-hit wonders of the 80s',
  'Pixar movies',
];

function useCyclingExample() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % EXAMPLE_TOPICS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return EXAMPLE_TOPICS[i];
}

function Stepper({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
  render,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (v: number) => void;
  render?: (v: number) => React.ReactNode;
}) {
  return (
    <div className="card stack" style={{ padding: 14, gap: 8 }}>
      <span className="brand-sub">{label}</span>
      <div className="row spread">
        <button
          className="stepper"
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span style={{ fontSize: 28, fontWeight: 900 }}>
          {render ? render(value) : value}
        </span>
        <button
          className="stepper"
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Lobby({
  controller,
  state,
}: {
  controller: GameController;
  state: GameState;
}) {
  const { leave } = useGame();
  const isHost = state.hostId === controller.localPlayerId;
  const example = useCyclingExample();
  const [topic, setTopic] = useState(state.topic);

  // Keep local topic in sync with remote changes (for non-host viewers).
  useEffect(() => {
    if (!isHost) setTopic(state.topic);
  }, [state.topic, isHost]);

  const totalItems = computeTotalItems(state.playerOrder.length, state.settings);
  const capacity = state.playerOrder.length * state.settings.slotsPerPlayer;
  const canStart = isHost && topic.trim().length > 1;

  const commitTopic = (t: string) => {
    setTopic(t);
    if (isHost) controller.setTopic(t);
  };

  return (
    <div className="screen" style={{ gap: 18 }}>
      <div className="row spread">
        <div className="stack" style={{ gap: 2 }}>
          <div className="brand-sub">Lobby</div>
          {state.mode === 'multiplayer' ? (
            <div className="roomcode" style={{ textAlign: 'left', fontSize: 34 }}>
              {state.code}
            </div>
          ) : (
            <h2>Practice Room</h2>
          )}
        </div>
        <button className="btn btn-danger btn-sm" onClick={leave}>
          Leave
        </button>
      </div>

      {state.mode === 'multiplayer' && (
        <div className="info-banner tiny">
          Share code <strong>{state.code}</strong> — up to {MAX_PLAYERS} players.
        </div>
      )}

      {/* Players */}
      <div className="stack" style={{ gap: 8 }}>
        <h3 className="brand-sub">
          Players ({state.playerOrder.length}/{MAX_PLAYERS})
        </h3>
        {state.playerOrder.map((id) => {
          const p = state.players[id];
          return (
            <div key={id} className="player-row">
              <Avatar name={p.name} id={p.id} />
              <span style={{ fontWeight: 800, flex: 1 }}>
                {p.name}
                {id === controller.localPlayerId ? ' (you)' : ''}
                {p.isBot ? ' 🤖' : ''}
              </span>
              {p.isHost && <span className="tag" style={{ color: 'var(--gold)' }}>HOST</span>}
              <span className={`dot${p.connected ? '' : ' off'}`} />
            </div>
          );
        })}
      </div>

      {/* Topic */}
      <div className="field">
        <label>Topic — anything goes</label>
        <input
          className="input"
          value={topic}
          disabled={!isHost}
          placeholder={`try: ${example}`}
          maxLength={80}
          onChange={(e) => commitTopic(e.target.value)}
        />
        <span className="faint tiny">
          Free-form: date ranges, people, genres, prices all work. Items are real
          and verified — “{example}”.
        </span>
      </div>

      {/* Settings */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Stepper
          label="Starting Bids"
          value={state.settings.startingCurrency}
          min={STARTING_CURRENCY_RANGE.min}
          max={STARTING_CURRENCY_RANGE.max}
          disabled={!isHost}
          onChange={(v) => controller.updateSettings({ startingCurrency: v })}
          render={(v) => <Bids amount={v} />}
        />
        <Stepper
          label="Slots / player"
          value={state.settings.slotsPerPlayer}
          min={SLOTS_RANGE.min}
          max={SLOTS_RANGE.max}
          disabled={!isHost}
          onChange={(v) => controller.updateSettings({ slotsPerPlayer: v })}
        />
      </div>
      <Stepper
        label="Base item count"
        value={state.settings.baseItemCount}
        min={BASE_ITEM_RANGE.min}
        max={BASE_ITEM_RANGE.max}
        disabled={!isHost}
        onChange={(v) => controller.updateSettings({ baseItemCount: v })}
      />

      <div className="card stack" style={{ gap: 4, padding: 14 }}>
        <div className="row spread">
          <span className="muted">Items this game</span>
          <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--accent-3)' }}>
            {totalItems}
          </span>
        </div>
        <span className="faint tiny">
          {capacity} total slots across {state.playerOrder.length}{' '}
          {state.playerOrder.length === 1 ? 'player' : 'players'} — fewer items
          than slots, so not everyone fills up. Scarcity is the game.
        </span>
      </div>

      {/* Host chooses how items are generated (key stays in their browser). */}
      {isHost && <AiKeyPanel />}

      {isHost ? (
        <button
          className="btn btn-primary btn-lg btn-block"
          disabled={!canStart}
          onClick={() => controller.startGame()}
        >
          🚀 Start Game
        </button>
      ) : (
        <div className="info-banner" style={{ textAlign: 'center' }}>
          Waiting for the host to start…
        </div>
      )}
    </div>
  );
}
