import { useGame } from '../../hooks/useGame';
import { hasSetOnBoard } from '../../logic/setValidation';
import './HUD.css';

interface HUDProps {
  onQuit: () => void;
  roomCode?: string;
}

export function HUD({ onQuit, roomCode }: HUDProps) {
  const { state, dispatch } = useGame();

  const isOnline = state.gameMode === 'online';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const canAddCards = state.deck.length > 0 && !hasSetOnBoard(state.board);

  return (
    <div className="hud">
      <div className="hud__left">
        <span className="hud__stat">Deck: {state.deck.length}</span>
        <span className="hud__stat">Sets: {state.setsFound}</span>
        {state.timerEnabled && (
          <span className="hud__stat">{formatTime(state.elapsedSeconds)}</span>
        )}
        {roomCode && (
          <span className="hud__stat hud__room-code">Room: {roomCode}</span>
        )}
      </div>
      <div className="hud__right">
        {state.gameMode === 'single' && (
          <>
            <button
              className="hud__button"
              onClick={() => dispatch({ type: 'HINT' })}
            >
              Hint
            </button>
            {canAddCards && (
              <button
                className="hud__button"
                onClick={() => dispatch({ type: 'ADD_CARDS' })}
              >
                +3 Cards
              </button>
            )}
          </>
        )}
        <button className="hud__button hud__button--quit" onClick={onQuit}>
          {isOnline ? 'Leave' : 'Quit'}
        </button>
      </div>
    </div>
  );
}
