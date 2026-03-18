import type { Card as CardType } from '../../types/game';
import { ShapeRenderer } from '../Shapes/ShapeRenderer';
import './Card.css';

interface CardProps {
  card: CardType;
  selected: boolean;
  hinted: boolean;
  matched: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function Card({ card, selected, hinted, matched, disabled, onClick }: CardProps) {
  const shapes = Array.from({ length: card.number }, (_, i) => (
    <ShapeRenderer
      key={i}
      shape={card.shape}
      color={card.color}
      shading={card.shading}
      index={i}
    />
  ));

  let className = 'card';
  if (matched) className += ' card--matched';
  if (selected) className += ' card--selected';
  if (hinted) className += ' card--hinted';
  if (disabled) className += ' card--disabled';

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      <div className="card__shapes">{shapes}</div>
    </button>
  );
}
