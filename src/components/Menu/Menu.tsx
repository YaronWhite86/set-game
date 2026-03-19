import { useState, useEffect } from 'react';
import type { GameMode, GameSettings, Shape, ColorPalette } from '../../types/game';
import { PLAYER_NAME_KEY, ALL_SHAPES, SHAPE_PRESETS, COLOR_PALETTES, DEFAULT_SETTINGS } from '../../utils/constants';
import { isValidRoomCode } from '../../network/roomCode';
import { ShapeRenderer } from '../Shapes/ShapeRenderer';
import './Menu.css';

interface MenuProps {
  onStart: (mode: GameMode, timerEnabled: boolean, playerCount: number, settings: GameSettings) => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

const SHAPE_LABELS: Record<Shape, string> = {
  diamond: 'Diamond',
  oval: 'Oval',
  star: 'Star',
  heart: 'Heart',
  cross: 'Cross',
  arrow: 'Arrow',
};

const PALETTE_LABELS: Record<ColorPalette, string> = {
  classic: 'Classic',
  ocean: 'Ocean',
  sunset: 'Sunset',
  neon: 'Neon',
};

type ShapeTheme = 'classic' | 'bold' | 'custom';

function getThemeFromShapes(shapes: Shape[]): ShapeTheme {
  const sorted = [...shapes].sort();
  const classicSorted = [...SHAPE_PRESETS.classic].sort();
  const boldSorted = [...SHAPE_PRESETS.bold].sort();
  if (sorted.every((s, i) => s === classicSorted[i])) return 'classic';
  if (sorted.every((s, i) => s === boldSorted[i])) return 'bold';
  return 'custom';
}

export function Menu({ onStart, onCreateRoom, onJoinRoom }: MenuProps) {
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(PLAYER_NAME_KEY) || ''
  );
  const [joinCode, setJoinCode] = useState('');
  const [onlineError, setOnlineError] = useState('');

  const [selectedShapes, setSelectedShapes] = useState<Shape[]>(DEFAULT_SETTINGS.shapes);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(DEFAULT_SETTINGS.colorPalette);
  const [shapeTheme, setShapeTheme] = useState<ShapeTheme>('classic');
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const settings: GameSettings = { shapes: selectedShapes, colorPalette };

  // Check URL param for room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setJoinCode(room.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleThemeChange = (theme: ShapeTheme) => {
    setShapeTheme(theme);
    if (theme === 'classic') setSelectedShapes([...SHAPE_PRESETS.classic]);
    else if (theme === 'bold') setSelectedShapes([...SHAPE_PRESETS.bold]);
  };

  const toggleShape = (shape: Shape) => {
    setSelectedShapes((prev) => {
      if (prev.includes(shape)) {
        if (prev.length <= 3) return prev; // must keep exactly 3
        return prev.filter((s) => s !== shape);
      }
      if (prev.length >= 3) return prev; // already at 3
      const next = [...prev, shape];
      // Auto-resolve theme if custom shapes now match a preset
      const resolved = getThemeFromShapes(next);
      if (resolved !== 'custom') setShapeTheme(resolved);
      return next;
    });
  };

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

      {/* Customize section */}
      <div className="menu__customize">
        <button
          className="menu__customize-toggle"
          onClick={() => setCustomizeOpen(!customizeOpen)}
        >
          Customize {customizeOpen ? '\u25B2' : '\u25BC'}
        </button>

        {customizeOpen && (
          <div className="menu__customize-body">
            {/* Shape selection */}
            <div className="menu__customize-group">
              <label className="menu__customize-label">Shapes</label>
              <div className="menu__theme-buttons">
                {(['classic', 'bold', 'custom'] as ShapeTheme[]).map((theme) => (
                  <button
                    key={theme}
                    className={`menu__theme-btn ${shapeTheme === theme ? 'menu__theme-btn--active' : ''}`}
                    onClick={() => handleThemeChange(theme)}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>

              {shapeTheme === 'custom' && (
                <div className="menu__shape-grid">
                  {ALL_SHAPES.map((shape) => (
                    <button
                      key={shape}
                      className={`menu__shape-btn ${selectedShapes.includes(shape) ? 'menu__shape-btn--active' : ''}`}
                      onClick={() => toggleShape(shape)}
                      title={SHAPE_LABELS[shape]}
                    >
                      <ShapeRenderer shape={shape} colorValue="#555" shading="solid" index={0} />
                      <span className="menu__shape-label">{SHAPE_LABELS[shape]}</span>
                    </button>
                  ))}
                </div>
              )}

              {shapeTheme === 'custom' && selectedShapes.length !== 3 && (
                <p className="menu__hint">Pick exactly 3 shapes</p>
              )}
            </div>

            {/* Color palette selection */}
            <div className="menu__customize-group">
              <label className="menu__customize-label">Colors</label>
              <div className="menu__palette-buttons">
                {(Object.keys(COLOR_PALETTES) as ColorPalette[]).map((palette) => {
                  const colors = COLOR_PALETTES[palette];
                  return (
                    <button
                      key={palette}
                      className={`menu__palette-btn ${colorPalette === palette ? 'menu__palette-btn--active' : ''}`}
                      onClick={() => setColorPalette(palette)}
                    >
                      <div className="menu__palette-dots">
                        <span className="menu__palette-dot" style={{ background: colors.red }} />
                        <span className="menu__palette-dot" style={{ background: colors.green }} />
                        <span className="menu__palette-dot" style={{ background: colors.purple }} />
                      </div>
                      <span className="menu__palette-name">{PALETTE_LABELS[palette]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="menu__section">
        <button
          className="menu__button menu__button--primary"
          onClick={() => onStart('single', timerEnabled, 1, settings)}
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
          onClick={() => onStart('multiplayer', false, playerCount, settings)}
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
