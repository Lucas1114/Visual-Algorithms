import { DASH, FONT_SIZE, SIDE, STROKE_WIDTH } from '../layout';

/**
 * One bordered character cell with centered text — the shared replacement for
 * the 2021 `build_string()` / `build()` / `build_center()` trio.
 *
 * Position is the top-left corner in the parent SVG's coordinate space. Animated
 * movement is done by the caller wrapping cells in a `<g>` with a CSS transform
 * transition, not by animating `x` / `y` here.
 */
export interface CellProps {
  char: string | number;
  /** Top-left corner. */
  x: number;
  y: number;
  size?: number;
  fill?: string;
  stroke?: string;
  textColor?: string;
  /** Dashed border — "outside the matched fragment" in the original. */
  dashed?: boolean;
  /** Dim the whole cell (the original's `lightgrey` text + border). */
  faded?: boolean;
}

export function Cell({
  char,
  x,
  y,
  size = SIDE,
  fill = 'var(--cell-fill)',
  stroke = 'var(--cell-stroke)',
  textColor = 'var(--cell-text)',
  dashed = false,
  faded = false,
}: CellProps) {
  return (
    <g opacity={faded ? 0.4 : 1}>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={fill}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={dashed ? DASH : undefined}
      />
      <text
        x={x + size / 2}
        y={y + size / 2}
        fontSize={FONT_SIZE}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
      >
        {char}
      </text>
    </g>
  );
}
