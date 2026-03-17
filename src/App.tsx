import { useState, useCallback } from 'react';
import type { Screen, GameMode } from './types/game';
import { GameProvider } from './context/GameContext';
import { useGame } from './hooks/useGame';
import { Menu } from './components/Menu/Menu';
import { HUD } from './components/HUD/HUD';
import { Board } from './components/Board/Board';
import { ClaimBar } from './components/Multiplayer/ClaimBar';
import { GameOver } from './components/GameOver/GameOver';

function GameScreen({ onMenu }: { onMenu: () => void }) {
  const { state, dispatch } = useGame();

  if (state.gameOver) {
    return (
      <GameOver
        state={state}
        onPlayAgain={() =>
          dispatch({
            type: 'START_GAME',
            mode: state.gameMode,
            timerEnabled: state.timerEnabled,
            playerCount: state.players.length || undefined,
          })
        }
        onMenu={onMenu}
      />
    );
  }

  return (
    <div className="game">
      <HUD onQuit={onMenu} />
      <Board />
      <ClaimBar />
    </div>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>('menu');
  const { dispatch } = useGame();

  const handleStart = useCallback(
    (mode: GameMode, timerEnabled: boolean, playerCount: number) => {
      dispatch({ type: 'START_GAME', mode, timerEnabled, playerCount });
      setScreen('game');
    },
    [dispatch]
  );

  const handleMenu = useCallback(() => {
    dispatch({ type: 'RESET' });
    setScreen('menu');
  }, [dispatch]);

  if (screen === 'menu') {
    return <Menu onStart={handleStart} />;
  }

  return <GameScreen onMenu={handleMenu} />;
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
