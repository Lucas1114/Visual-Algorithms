/**
 * Shared layout constants and pure coordinate helpers for the SVG views.
 *
 * The 2021 code scattered magic numbers everywhere (`x + 170`,
 * `y + 100 + 2 * side_len + 20`, `side_len / 2` …). Here every dimension lives
 * in one place and positions are computed by small pure functions that can be
 * unit tested. Views render into a local coordinate space (origin at 0,0) and
 * are placed on the canvas with an outer `<g transform>`.
 */

/** Side length of one character cell (the original `side_len`). */
export const SIDE = 40;

/** Font size for cell text (the original `font_size`). */
export const FONT_SIZE = 24;

/** Cell border width (the original hard-coded `stroke-width: 2`). */
export const STROKE_WIDTH = 2;

/** Vertical gap between stacked rows of cells (the original `side_len + 10`). */
export const ROW_GAP = 10;

/** Dash pattern for "not part of this fragment" cells (the original `dash`). */
export const DASH = '4,4';

/** Duration of position transitions, kept in sync with the CSS. */
export const TRANSITION_MS = 500;

/** Left x of the `i`-th cell in a horizontal strip. */
export function cellX(i: number): number {
  return i * SIDE;
}

/** Center x of the `i`-th cell (where its text anchor sits). */
export function cellCenterX(i: number): number {
  return i * SIDE + SIDE / 2;
}

/** Top y of the `row`-th stacked row (0-based). */
export function rowY(row: number): number {
  return row * (SIDE + ROW_GAP);
}

/** Center y of the `row`-th stacked row. */
export function rowCenterY(row: number): number {
  return row * (SIDE + ROW_GAP) + SIDE / 2;
}

/** Total width of a strip of `n` cells. */
export function stripWidth(n: number): number {
  return n * SIDE;
}
