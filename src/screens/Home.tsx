import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { isFirebaseConfigured } from '../firebase';
import { CURRENCY } from '../config/currency';
import { HowToPlay } from '../components/HowToPlay';

type Panel = 'menu' | 'create' | 'join';

export function Home() {
  const { startPractice, createRoom, joinRoom } = useGame();
  const [panel, setPanel] = useState<Panel>('menu');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doCreate = async () => {
    setError(null);
    setBusy(true);
    try {
      await createRoom(name.trim());
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const doJoin = async () => {
    setError(null);
    setBusy(true);
    try {
      await joinRoom(code.trim(), name.trim());
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="screen center" style={{ gap: 22 }}>
      <div className="stack center" style={{ gap: 4 }}>
        <div className="brand">YourBid</div>
        <div className="brand-sub">The auction party game</div>
      </div>

      <div className="card stack" style={{ width: '100%', maxWidth: 420 }}>
        {error && <div className="error-banner">{error}</div>}

        {panel === 'menu' && (
          <>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => setPanel('create')}
            >
              🎪 Create Room
            </button>
            <button
              className="btn btn-ghost btn-lg btn-block"
              onClick={() => setPanel('join')}
            >
              🔑 Join Room
            </button>
            <div className="divider" />
            <button
              className="btn btn-gold btn-block"
              onClick={() => startPractice(name.trim() || 'You')}
            >
              🤖 Practice vs 2 Bots
            </button>
            <HowToPlay block />
            <p className="faint tiny" style={{ margin: 0, textAlign: 'center' }}>
              Practice mode runs fully offline — no setup needed. Bid{' '}
              {CURRENCY.icon} {CURRENCY.label} on real items and try the whole loop.
            </p>
            {!isFirebaseConfigured && (
              <div className="info-banner tiny">
                Multiplayer needs Firebase configured in{' '}
                <code>src/firebase.ts</code>. Until then, use Practice mode.
              </div>
            )}
          </>
        )}

        {panel === 'create' && (
          <>
            <div className="field">
              <label>Display name</label>
              <input
                className="input"
                value={name}
                maxLength={16}
                placeholder="Your name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-lg btn-block"
              disabled={busy || !name.trim() || !isFirebaseConfigured}
              onClick={doCreate}
            >
              {busy ? 'Creating…' : 'Create Room'}
            </button>
            {!isFirebaseConfigured && (
              <div className="info-banner tiny">
                Firebase isn’t configured yet — multiplayer is disabled. Try
                Practice mode instead.
              </div>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => setPanel('menu')}>
              ← Back
            </button>
          </>
        )}

        {panel === 'join' && (
          <>
            <div className="field">
              <label>Room code</label>
              <input
                className="input code"
                value={code}
                maxLength={6}
                placeholder="ABCDEF"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="field">
              <label>Display name</label>
              <input
                className="input"
                value={name}
                maxLength={16}
                placeholder="Your name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-lg btn-block"
              disabled={busy || code.trim().length !== 6 || !name.trim() || !isFirebaseConfigured}
              onClick={doJoin}
            >
              {busy ? 'Joining…' : 'Join Room'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setPanel('menu')}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
