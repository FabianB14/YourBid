import { GameProvider, useGame, useGameState } from './store/GameContext';
import type { GameController } from './store/controller';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { Generating } from './screens/Generating';
import { Auction } from './screens/Auction';
import { Rating } from './screens/Rating';
import { Results } from './screens/Results';

function Router({ controller }: { controller: GameController }) {
  const state = useGameState(controller);

  // While still in the lobby, a loading/error generation status means the host
  // has pressed Start — show the Generating screen.
  if (
    state.phase === 'lobby' &&
    (state.generation.status === 'loading' || state.generation.status === 'error')
  ) {
    return <Generating controller={controller} state={state} />;
  }

  switch (state.phase) {
    case 'lobby':
      return <Lobby controller={controller} state={state} />;
    case 'generating':
      return <Generating controller={controller} state={state} />;
    case 'auction':
      return <Auction controller={controller} state={state} />;
    case 'rating':
      return <Rating controller={controller} state={state} />;
    case 'results':
      return <Results controller={controller} state={state} />;
    default:
      return <Home />;
  }
}

function Shell() {
  const { controller } = useGame();
  if (!controller) return <Home />;
  return <Router controller={controller} />;
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
