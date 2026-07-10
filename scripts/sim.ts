// Headless full-game simulation to validate the reducer + bot rules without a
// browser. Not part of the app build; run via esbuild + node (see below).
import { reduce, createInitialState, currentOpener } from '../src/game/reducer';
import { botOpenDecision, botRaiseDecision, botRating } from '../src/game/bots';
import { computeResults, computeTotalItems } from '../src/game/logic';
import { sampleItemsForTopic } from '../src/services/sampleItems';
import type { GameState, Player } from '../src/types';

function mkPlayer(id: string, name: string, isBot: boolean, host = false): Player {
  return { id, name, isHost: host, isBot, connected: true, currency: 20, wonItems: [] };
}

const now = () => Date.now();
let s: GameState = createInitialState({
  mode: 'practice',
  code: 'TESTAB',
  hostId: 'human',
  host: mkPlayer('human', 'Human', false, true),
});
s = reduce(s, { type: 'ADD_PLAYER', player: mkPlayer('bot1', 'Bot One', true) }, now());
s = reduce(s, { type: 'ADD_PLAYER', player: mkPlayer('bot2', 'Bot Two', true) }, now());
s = reduce(s, { type: 'UPDATE_SETTINGS', settings: { slotsPerPlayer: 5, baseItemCount: 12 } }, now());
s = reduce(s, { type: 'SET_TOPIC', topic: 'Drake songs' }, now());

const items = sampleItemsForTopic('Drake songs');
console.log('generated items:', items.length, 'expected total:', computeTotalItems(3, s.settings));
s = reduce(s, { type: 'START_GAME', items }, now());
console.log('auction started; totalItems =', s.totalItems, 'phase =', s.phase);

// Drive the auction. The "human" plays like a bot for the sim.
let guard = 0;
while (s.phase === 'auction' && guard++ < 5000) {
  const a = s.auction!;
  if (a.phase === 'opening') {
    const opener = currentOpener(s);
    if (!opener) { throw new Error('no opener but still opening'); }
    const dec = botOpenDecision(s.players[opener], s);
    if (dec.action === 'open') s = reduce(s, { type: 'OPEN_BID', playerId: opener, amount: dec.amount }, now());
    else s = reduce(s, { type: 'PASS', playerId: opener }, now());
  } else {
    // raising: let each non-leader try to raise; if none raise, resolve.
    let raised = false;
    for (const id of s.playerOrder) {
      if (id === a.highBidderId) continue;
      const amt = botRaiseDecision(s.players[id], s);
      if (amt != null) { s = reduce(s, { type: 'RAISE', playerId: id, amount: amt }, now()); raised = true; break; }
    }
    if (!raised) s = reduce(s, { type: 'RESOLVE_ITEM' }, now());
  }
}

console.log('after auction: phase =', s.phase, 'discarded =', s.discardedCount);
for (const id of s.playerOrder) {
  const p = s.players[id];
  console.log(`  ${p.name}: ${p.wonItems.length} items, ${p.currency} left`);
}

// Rating phase: everyone rates everything.
guard = 0;
while (s.phase === 'rating' && guard++ < 5000) {
  let acted = false;
  for (const raterId of s.playerOrder) {
    for (const ownerId of s.playerOrder) {
      for (const w of s.players[ownerId].wonItems) {
        if (w.ratings[raterId] == null) {
          s = reduce(s, { type: 'SUBMIT_RATING', raterId, key: w.key, value: botRating(raterId, w.key) }, now());
          acted = true;
        }
      }
    }
  }
  if (!acted) break;
}

console.log('final phase =', s.phase);
if (s.phase !== 'results') throw new Error('did not reach results');
const rows = computeResults(s);
console.log('LEADERBOARD:');
for (const r of rows) {
  console.log(`  ${r.name}: score ${r.score} (items ${r.itemsValue}, penalty ${r.penalty}, empty ${r.unfilledSlots})`);
}
// Sanity checks
const totalWon = s.playerOrder.reduce((n, id) => n + s.players[id].wonItems.length, 0);
if (totalWon + s.discardedCount !== s.totalItems) throw new Error(`item accounting off: won ${totalWon} + discarded ${s.discardedCount} != ${s.totalItems}`);
console.log('OK: item accounting balances (', totalWon, 'won +', s.discardedCount, 'discarded =', s.totalItems, ')');
console.log('SIMULATION PASSED');
