import type { GameState } from '../../types/game';
import './GameOver.css';

interface GameOverProps {
  state: GameState;
  onPlayAgain?: () => void;
  onMenu: () => void;
  isOnline?: boolean;
  isHost?: boolean;
}

export function GameOver({ state, onPlayAgain, onMenu, isOnline, isHost }: GameOverProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="gameover">
      <h1 className="gameover__title">Game Over!</h1>

      {state.gameMode === 'single' ? (
        <div className="gameover__stats">
          <p>Sets found: <strong>{state.setsFound}</strong></p>
          {state.timerEnabled && (
            <p>Time: <strong>{formatTime(state.elapsedSeconds)}</strong></p>
          )}
        </div>
      ) : (
        <div className="gameover__stats">
          <h2>Scores</h2>
          <ul className="gameover__scores">
            {[...state.players]
              .sort((a, b) => b.score - a.score)
              .map((player) => (
                <li key={player.id} className="gameover__player">
                  <span>
                    {player.name}
                    {!isOnline && player.claimKey && ` (${player.claimKey})`}
                  </span>
                  <strong>{player.score}</strong>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="gameover__buttons">
        {isOnline && !isHost ? (
          <p className="gameover__waiting">Waiting for host...</p>
        ) : (
          onPlayAgain && (
            <button className="gameover__button gameover__button--primary" onClick={onPlayAgain}>
              Play Again
            </button>
          )
        )}
        <button className="gameover__button" onClick={onMenu}>
          Main Menu
        </button>
      </div>
    </div>
  );
}
