import type { Shape, Shading } from '../../types/game';
import { Diamond } from './Diamond';
import { Oval } from './Oval';
import { Star } from './Star';
import { Heart } from './Heart';
import { Cross } from './Cross';
import { Arrow } from './Arrow';

interface ShapeRendererProps {
  shape: Shape;
  colorValue: string;
  shading: Shading;
  index: number;
}

const ShapeComponent: Record<Shape, React.FC> = {
  diamond: Diamond,
  oval: Oval,
  star: Star,
  heart: Heart,
  cross: Cross,
  arrow: Arrow,
};

export function ShapeRenderer({ shape, colorValue, shading, index }: ShapeRendererProps) {
  const Component = ShapeComponent[shape];
  const patternId = `stripe-${colorValue.replace('#', '')}-${index}`;

  let fill: string;
  const strokeWidth = 2;

  switch (shading) {
    case 'solid':
      fill = colorValue;
      break;
    case 'striped':
      fill = `url(#${patternId})`;
      break;
    case 'empty':
      fill = 'transparent';
      break;
  }

  return (
    <svg viewBox="0 0 40 60" className="shape-svg">
      {shading === 'striped' && (
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="40"
            height="5"
          >
            <line x1="0" y1="0" x2="40" y2="0" stroke={colorValue} strokeWidth="2" />
          </pattern>
        </defs>
      )}
      <g fill={fill} stroke={colorValue} strokeWidth={strokeWidth}>
        <Component />
      </g>
    </svg>
  );
}
