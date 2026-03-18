import type { Shape, Color, Shading } from '../../types/game';
import { COLOR_VALUES } from '../../utils/constants';
import { Diamond } from './Diamond';
import { Squiggle } from './Squiggle';
import { Oval } from './Oval';

interface ShapeRendererProps {
  shape: Shape;
  color: Color;
  shading: Shading;
  index: number;
}

const ShapeComponent: Record<Shape, React.FC> = {
  diamond: Diamond,
  squiggle: Squiggle,
  oval: Oval,
};

export function ShapeRenderer({ shape, color, shading, index }: ShapeRendererProps) {
  const Component = ShapeComponent[shape];
  const colorValue = COLOR_VALUES[color];
  const patternId = `stripe-${color}-${index}`;

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
