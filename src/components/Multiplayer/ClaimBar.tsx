import { useGame } from '../../hooks/useGame';
import './ClaimBar.css';

export function ClaimBar() {
  const { state, dispatch, localPlayerId } = useGame();

  const isMultiplayer = state.gameMode === 'multiplayer' || state.gameMode === 'online';
  const isOnline = state.gameMode === 'online';

  if (!isMultiplayer) return null;

  const claimingPlayer = state.claim.active
    ? state.players.find((p) => p.id === state.claim.playerId)
    : null;

  const handleOnlineClaim = () => {
    if (localPlayerId != null && !state.claim.active) {
      dispatch({ type: 'CLAIM', playerId: localPlayerId });
    }
  };

  return (
    <div className="claimbar">
      <div className="claimbar__players">
        {state.players.map((player) => (
          <div
            key={player.id}
            className={`claimbar__player ${
              claimingPlayer?.id === player.id ? 'claimbar__player--active' : ''
            } ${player.connected === false ? 'claimbar__player--disconnected' : ''}`}
          >
            {!isOnline && (
              <span className="claimbar__key">{player.claimKey}</span>
            )}
            <span className="claimbar__name">
              {player.name}
              {isOnline && player.id === localPlayerId && ' (You)'}
            </span>
            <span className="claimbar__score">{player.score}</span>
          </div>
        ))}
      </div>

      {state.claim.active && claimingPlayer && (
        <div className="claimbar__countdown">
          <span>{claimingPlayer.name} is claiming!</span>
          <span className="claimbar__timer">{state.claim.timeRemaining}s</span>
        </div>
      )}

      {!state.claim.active && !isOnline && (
        <p className="claimbar__prompt">
          Press your claim key to start selecting cards
        </p>
      )}

      {!state.claim.active && isOnline && (
        <div className="claimbar__online-claim">
          <button
            className="claimbar__claim-button"
            onClick={handleOnlineClaim}
          >
            CLAIM
          </button>
        </div>
      )}
    </div>
  );
}
