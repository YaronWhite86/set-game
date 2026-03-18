import type { RoomState } from '../../types/network';
import './Lobby.css';

interface LobbyProps {
  roomState: RoomState;
  onStart: () => void;
  onLeave: () => void;
}

export function Lobby({ roomState, onStart, onLeave }: LobbyProps) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomState.roomCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const connectedCount = roomState.lobbyPlayers.filter((p) => p.connected).length;
  const canStart = roomState.isHost && connectedCount >= 2;

  return (
    <div className="lobby">
      <h1 className="lobby__title">Game Lobby</h1>

      <div className="lobby__code-section">
        <p className="lobby__label">Room Code</p>
        <div className="lobby__code" onClick={copyCode} title="Click to copy">
          {roomState.roomCode}
        </div>
        <button className="lobby__copy-btn" onClick={copyLink}>
          Copy Link
        </button>
      </div>

      {roomState.connectionStatus === 'connecting' && (
        <p className="lobby__status">Connecting...</p>
      )}

      {roomState.error && (
        <p className="lobby__error">{roomState.error}</p>
      )}

      <div className="lobby__players">
        <h2 className="lobby__players-title">
          Players ({connectedCount}/{roomState.lobbyPlayers.length})
        </h2>
        <ul className="lobby__player-list">
          {roomState.lobbyPlayers.map((player) => (
            <li
              key={player.id}
              className={`lobby__player ${!player.connected ? 'lobby__player--disconnected' : ''}`}
            >
              <span
                className={`lobby__dot ${
                  player.connected ? 'lobby__dot--connected' : 'lobby__dot--disconnected'
                }`}
              />
              <span className="lobby__player-name">
                {player.name}
                {player.id === 'host' && ' (Host)'}
                {player.playerId === roomState.localPlayerId && player.id !== 'host' && ' (You)'}
                {player.id === 'host' && roomState.isHost && ' (You)'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="lobby__actions">
        {roomState.isHost ? (
          <button
            className="lobby__button lobby__button--start"
            disabled={!canStart}
            onClick={onStart}
          >
            {canStart ? 'Start Game' : 'Waiting for players...'}
          </button>
        ) : (
          <p className="lobby__waiting">Waiting for host to start...</p>
        )}
        <button className="lobby__button lobby__button--leave" onClick={onLeave}>
          Leave
        </button>
      </div>
    </div>
  );
}
