import { useGame } from '../../hooks/useGame';
import { COLOR_PALETTES } from '../../utils/constants';
import { Card } from '../Card/Card';
import './Board.css';

export function Board() {
  const { state, dispatch, localPlayerId } = useGame();

  const isMultiplayer = state.gameMode === 'multiplayer' || state.gameMode === 'online';
  const isOnline = state.gameMode === 'online';

  // Only visually disable cards during foundSet display
  const isDisabled = !!state.foundSet;

  // Block clicks silently (no visual change) when claim rules prevent selection
  const isClickBlocked =
    !!state.foundSet ||
    state.paused ||
    (isMultiplayer && !state.claim.active) ||
    (isOnline && state.claim.active && state.claim.playerId !== localPlayerId);

  // Positive indicator: local player has an active claim
  const isClaimActive = isMultiplayer && state.claim.active &&
    (!isOnline || state.claim.playerId === localPlayerId);

  const colorValues = COLOR_PALETTES[state.settings.colorPalette];

  return (
    <div className={`board${isClaimActive ? ' board--claim-active' : ''}${state.paused ? ' board--paused' : ''}`}>
      {state.board.map((card) => (
        <Card
          key={card.id}
          card={card}
          colorValues={colorValues}
          selected={state.selected.includes(card.id)}
          hinted={state.hintCardId === card.id}
          matched={state.foundSet?.cards.some(c => c.id === card.id) ?? false}
          disabled={isDisabled}
          onClick={() => {
            if (isClickBlocked) return;
            if (state.selected.includes(card.id)) {
              dispatch({ type: 'DESELECT_CARD', cardId: card.id });
            } else {
              dispatch({ type: 'SELECT_CARD', cardId: card.id });
            }
          }}
        />
      ))}
    </div>
  );
}
