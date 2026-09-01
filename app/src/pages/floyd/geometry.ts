/**
 * Pure coordinate helpers for the ρ-shape drawing — a horizontal "tail" that
 * runs into a circular "cycle", the 2021 `build_non_cycle()` / `build_cycle()` /
 * `pointer_move()` geometry pulled out of the render code so it can be unit
 * tested.
 *
 * The 2021 version hard-coded `x = 900`, `y = 400`, radius `200`, tail span
 * `500`, and the polar term `x - 200*cos(interval*(i-cycle))`. Same shape here,
 * smaller numbers, one place.
 */

export const RING_R = 150;
export const RING_CX = 452;
export const RING_CY = 214;
export const TAIL_SPAN = 250;
export const TAIL_X0 = RING_CX - RING_R - TAIL_SPAN;

export const VIEW_W = 700;
export const VIEW_H = 428;

/** How far the hare / tortoise markers sit off the node ring. */
export const LANE_OFFSET = 26;

export interface Pt {
  x: number;
  y: number;
}

/** Position of tail node `i` (`0 <= i <= mu`; `i === mu` is the entrance). */
export function tailNodePos(i: number, mu: number): Pt {
  const step = TAIL_SPAN / mu;
  return { x: TAIL_X0 + i * step, y: RING_CY };
}

/** Angle of cycle node `i` about the ring centre (entrance = angle 0). */
export function cycleAngle(i: number, mu: number, lambda: number): number {
  return (2 * Math.PI * (i - mu)) / lambda;
}

/** Position of cycle node `i` (`i >= mu`). Winds up-and-over from the left point. */
export function cycleNodePos(i: number, mu: number, lambda: number): Pt {
  const a = cycleAngle(i, mu, lambda);
  return {
    x: RING_CX - RING_R * Math.cos(a),
    y: RING_CY - RING_R * Math.sin(a),
  };
}

/** Centre of node `i` for drawing the node itself. */
export function nodePos(i: number, mu: number, lambda: number): Pt {
  return i < mu ? tailNodePos(i, mu) : cycleNodePos(i, mu, lambda);
}

/** Marker position for a pointer (`hare` outside the ring, `tort` inside). */
export function pointerPos(
  i: number,
  mu: number,
  lambda: number,
  lane: 'hare' | 'tort',
): Pt {
  if (i < mu) {
    const p = tailNodePos(i, mu);
    return { x: p.x, y: p.y + (lane === 'hare' ? -LANE_OFFSET : LANE_OFFSET) };
  }
  const a = cycleAngle(i, mu, lambda);
  const r = RING_R + (lane === 'hare' ? LANE_OFFSET : -LANE_OFFSET);
  return { x: RING_CX - r * Math.cos(a), y: RING_CY - r * Math.sin(a) };
}

/** Successor of node `i` in a ρ of `lens` nodes with entrance `mu`. */
function succ(i: number, lens: number, mu: number): number {
  return i < lens - 1 ? i + 1 : mu;
}

/**
 * Sample marker positions for a pointer that takes `hops` forward successor
 * steps from node `from` (expected to land on `to`) — **along the ring**, not in
 * a straight chord. Drives the hare / tortoise move animation.
 *
 * `hops` is passed explicitly (not derived from `from`/`to`) so a move that
 * loops right back to the same node still animates a full lap — a two-step hare
 * hop on a `λ = 2` cycle returns to `from`, but the pointer should still be seen
 * going round. Pass the points reversed for a backward (Prev) step.
 *
 * Falls back to a straight two-point path if the walk doesn't reach `to`.
 */
export function motionSamples(
  from: number,
  to: number,
  hops: number,
  mu: number,
  lambda: number,
  lane: 'hare' | 'tort',
): Pt[] {
  const lens = mu + lambda;

  const seq = [from];
  let cur = from;
  for (let i = 0; i < hops; i++) {
    cur = succ(cur, lens, mu);
    seq.push(cur);
  }
  if (hops < 1 || seq[seq.length - 1] !== to) {
    return [
      pointerPos(from, mu, lambda, lane),
      pointerPos(to, mu, lambda, lane),
    ];
  }

  const r = RING_R + (lane === 'hare' ? LANE_OFFSET : -LANE_OFFSET);
  const step = (2 * Math.PI) / lambda;
  const SUBS = 6;

  const pts: Pt[] = [pointerPos(seq[0], mu, lambda, lane)];
  for (let k = 1; k < seq.length; k++) {
    const a = seq[k - 1];
    const b = seq[k];
    if (a >= mu && b >= mu) {
      const a0 = cycleAngle(a, mu, lambda);
      for (let s = 1; s <= SUBS; s++) {
        const ang = a0 + (step * s) / SUBS;
        pts.push({
          x: RING_CX - r * Math.cos(ang),
          y: RING_CY - r * Math.sin(ang),
        });
      }
    } else {
      pts.push(pointerPos(b, mu, lambda, lane));
    }
  }
  return pts;
}

/**
 * SVG arc path between two cycle nodes along the ring, at radius `r`.
 * `sweep` follows increasing node index (the direction of travel).
 */
export function ringArcPath(
  fromIdx: number,
  toIdx: number,
  mu: number,
  lambda: number,
  r: number = RING_R,
): string {
  const a0 = cycleAngle(fromIdx, mu, lambda);
  const a1 = cycleAngle(toIdx, mu, lambda);
  const p0 = { x: RING_CX - r * Math.cos(a0), y: RING_CY - r * Math.sin(a0) };
  const p1 = { x: RING_CX - r * Math.cos(a1), y: RING_CY - r * Math.sin(a1) };
  const span = ((a1 - a0) % (2 * Math.PI)) + (a1 >= a0 ? 0 : 2 * Math.PI);
  const largeArc = span > Math.PI ? 1 : 0;
  // node angle grows counter-clockwise in maths, but the y-flip in cycleNodePos
  // makes travel render clockwise → SVG sweep flag 1.
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;
}
