import { useGame } from '../../hooks/useGame';
import { Card } from '../Card/Card';
import './Board.css';

export function Board() {
  const { state, dispatch } = useGame();

  const isDisabled = state.gameMode === 'multiplayer' && !state.claim.active;

  return (
    <div className="board">
      {state.board.map((card) => (
        <Card
          key={card.id}
          card={card}
          selected={state.selected.includes(card.id)}
          hinted={state.hintCardId === card.id}
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
