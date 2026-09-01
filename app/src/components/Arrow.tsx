import { FONT_SIZE, SIDE } from '../layout';

/**
 * A pointer arrow with a label — the shared replacement for the 2021 `arrow()`
 * function. The original mutated `polygon.points.getItem(i)` point by point; here
 * the points string is computed directly from the geometry.
 *
 * `tipX` is the x the arrow points at (a cell center). `tipY` is the tip's y.
 * `direction: 'down'` points downward with its label above (the old `reverse`
 * TP arrow); `'up'` points upward with its label below (the PP arrow).
 */
export interface ArrowProps {
  tipX: number;
  tipY: number;
  direction: 'up' | 'down';
  label: string;
  color?: string;
}

const HEAD_HALF = 0.25 * SIDE;
const NECK = 0.4 * SIDE;
const STEM_HALF = 0.08 * SIDE;
const TAIL = 0.75 * SIDE;

export function Arrow({
  tipX,
  tipY,
  direction,
  label,
  color = 'var(--arrow)',
}: ArrowProps) {
  const s = direction === 'down' ? -1 : 1;
  const points = [
    [tipX, tipY],
    [tipX - HEAD_HALF, tipY + s * NECK],
    [tipX - STEM_HALF, tipY + s * NECK],
    [tipX - STEM_HALF, tipY + s * TAIL],
    [tipX + STEM_HALF, tipY + s * TAIL],
    [tipX + STEM_HALF, tipY + s * NECK],
    [tipX + HEAD_HALF, tipY + s * NECK],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(' ');

  const labelY =
    direction === 'down' ? tipY - TAIL - 6 : tipY + TAIL + FONT_SIZE;

  return (
    <g fill={color} stroke={color}>
      <polygon points={points} />
      <text
        x={tipX}
        y={labelY}
        fontSize={FONT_SIZE}
        textAnchor="middle"
        stroke="none"
      >
        {label}
      </text>
    </g>
  );
}
