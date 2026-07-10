import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { GameController } from './controller';
import type { GameState } from '../types';
import { PracticeController } from './practiceController';
import { FirebaseController } from './firebaseController';

interface GameContextValue {
  controller: GameController | null;
  startPractice: (name: string) => void;
  createRoom: (name: string) => Promise<void>;
  joinRoom: (code: string, name: string) => Promise<void>;
  leave: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [controller, setController] = useState<GameController | null>(null);
  const controllerRef = useRef<GameController | null>(null);

  const swap = (next: GameController | null) => {
    controllerRef.current?.destroy();
    controllerRef.current = next;
    setController(next);
  };

  const value: GameContextValue = {
    controller,
    startPractice: (name) => swap(new PracticeController(name, 2)),
    createRoom: async (name) => swap(await FirebaseController.createRoom(name)),
    joinRoom: async (code, name) =>
      swap(await FirebaseController.joinRoom(code, name)),
    leave: () => swap(null),
  };

  useEffect(() => () => controllerRef.current?.destroy(), []);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

/** Subscribe to the active controller's state. Re-renders on every update. */
export function useGameState(controller: GameController): GameState {
  return useSyncExternalStore(
    (cb) => controller.subscribe(cb),
    () => controller.getState()
  );
}
