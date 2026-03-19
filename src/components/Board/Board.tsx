import { useGame } from '../../hooks/useGame';
import { COLOR_PALETTES } from '../../utils/constants';
import { Card } from '../Card/Card';
import './Board.css';

export function Board() {
  const { state, dispatch, localPlayerId } = useGame();

  const isMultiplayer = state.gameMode === 'multiplayer' || state.gameMode === 'online';
  const isOnline = state.gameMode === 'online';

  // In multiplayer/online: cards disabled when no active claim
  // In online: cards also disabled if the claim isn't by the local player
  let isDisabled = false;
  if (state.foundSet) {
    isDisabled = true;
  } else if (isMultiplayer && !state.claim.active) {
    isDisabled = true;
  } else if (isOnline && state.claim.active && state.claim.playerId !== localPlayerId) {
    isDisabled = true;
  }

  const colorValues = COLOR_PALETTES[state.settings.colorPalette];

  return (
    <div className="board">
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
