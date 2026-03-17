import { useState } from 'react';
import type { GameMode } from '../../types/game';
import './Menu.css';

interface MenuProps {
  onStart: (mode: GameMode, timerEnabled: boolean, playerCount: number) => void;
}

export function Menu({ onStart }: MenuProps) {
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

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
    </div>
  );
}
