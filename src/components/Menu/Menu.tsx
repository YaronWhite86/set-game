import { useState, useEffect } from 'react';
import type { GameMode } from '../../types/game';
import { PLAYER_NAME_KEY } from '../../utils/constants';
import { isValidRoomCode } from '../../network/roomCode';
import './Menu.css';

interface MenuProps {
  onStart: (mode: GameMode, timerEnabled: boolean, playerCount: number) => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export function Menu({ onStart, onCreateRoom, onJoinRoom }: MenuProps) {
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(PLAYER_NAME_KEY) || ''
  );
  const [joinCode, setJoinCode] = useState('');
  const [onlineError, setOnlineError] = useState('');

  // Check URL param for room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setJoinCode(room.toUpperCase());
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreate = () => {
    const name = playerName.trim();
    if (!name) {
      setOnlineError('Please enter your name');
      return;
    }
    setOnlineError('');
    onCreateRoom(name);
  };

  const handleJoin = () => {
    const name = playerName.trim();
    if (!name) {
      setOnlineError('Please enter your name');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (!isValidRoomCode(code)) {
      setOnlineError('Invalid room code');
      return;
    }
    setOnlineError('');
    onJoinRoom(code, name);
  };

  return (
    <div className="menu">
      <h1 className="menu__title">Set!</h1>
      <p className="menu__subtitle">Find sets of three cards</p>

      <div className="menu__section">
        <button
          className="menu__button menu__button--primary"
          onClick={() => onStart('single', timerEnabled, 1)}
        >
          Single Player
        </button>

        <label className="menu__toggle">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
          />
          Enable Timer
        </label>
      </div>

      <div className="menu__divider" />

      <div className="menu__section">
        <div className="menu__player-select">
          <label>Players:</label>
          <select
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>

        <button
          className="menu__button menu__button--secondary"
          onClick={() => onStart('multiplayer', false, playerCount)}
        >
          Local Multiplayer
        </button>

        <p className="menu__hint">
          Claim keys: Q, P{playerCount >= 3 ? ', Z' : ''}{playerCount >= 4 ? ', M' : ''}
        </p>
      </div>

      <div className="menu__divider" />

      <div className="menu__section">
        <h3 className="menu__section-title">Online Multiplayer</h3>

        <input
          className="menu__input"
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
        />

        <button
          className="menu__button menu__button--online"
          onClick={handleCreate}
        >
          Create Game
        </button>

        <div className="menu__join-row">
          <input
            className="menu__input menu__input--code"
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <button
            className="menu__button menu__button--join"
            onClick={handleJoin}
          >
            Join
          </button>
        </div>

        {onlineError && <p className="menu__error">{onlineError}</p>}
      </div>
    </div>
  );
}
