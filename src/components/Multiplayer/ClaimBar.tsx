import { useGame } from '../../hooks/useGame';
import './ClaimBar.css';

export function ClaimBar() {
  const { state } = useGame();

  if (state.gameMode !== 'multiplayer') return null;

  const claimingPlayer = state.claim.active
    ? state.players.find((p) => p.id === state.claim.playerId)
    : null;

  return (
    <div className="claimbar">
      <div className="claimbar__players">
        {state.players.map((player) => (
          <div
            key={player.id}
            className={`claimbar__player ${
              claimingPlayer?.id === player.id ? 'claimbar__player--active' : ''
            }`}
          >
            <span className="claimbar__key">{player.claimKey}</span>
            <span className="claimbar__name">{player.name}</span>
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

      {!state.claim.active && (
        <p className="claimbar__prompt">
          Press your claim key to start selecting cards
        </p>
      )}
    </div>
  );
}
