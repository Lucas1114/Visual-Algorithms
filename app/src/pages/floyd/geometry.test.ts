import { describe, expect, it } from 'vitest';
import {
  cycleNodePos,
  LANE_OFFSET,
  motionSamples,
  nodePos,
  pointerPos,
  RING_CX,
  RING_CY,
  RING_R,
  tailNodePos,
  TAIL_X0,
} from './geometry';

describe('floyd geometry', () => {
  it('spreads tail nodes evenly from the start to the entrance', () => {
    const mu = 4;
    expect(tailNodePos(0, mu).x).toBeCloseTo(TAIL_X0);
    expect(tailNodePos(mu, mu).x).toBeCloseTo(RING_CX - RING_R); // entrance = ring left point
    const gaps = [1, 2, 3, 4].map(
      (i) => tailNodePos(i, mu).x - tailNodePos(i - 1, mu).x,
    );
    for (const g of gaps) expect(g).toBeCloseTo(gaps[0]);
  });

  it('puts the entrance node at the ring left point and winds around', () => {
    const mu = 3;
    const lambda = 6;
    expect(cycleNodePos(mu, mu, lambda)).toEqual({
      x: RING_CX - RING_R,
      y: RING_CY,
    });
    // half way round the cycle lands on the right point
    const half = cycleNodePos(mu + lambda / 2, mu, lambda);
    expect(half.x).toBeCloseTo(RING_CX + RING_R);
    expect(half.y).toBeCloseTo(RING_CY);
  });

  it('nodePos switches from tail to ring at the entrance', () => {
    const mu = 5;
    const lambda = 4;
    expect(nodePos(2, mu, lambda)).toEqual(tailNodePos(2, mu));
    expect(nodePos(7, mu, lambda)).toEqual(cycleNodePos(7, mu, lambda));
  });

  it('motionSamples follows the ring, not a straight chord (small cycle)', () => {
    // λ = 3: hare hops 2 nodes; a chord would dive deep inside the ring
    const mu = 2;
    const lambda = 3;
    const r = RING_R + LANE_OFFSET; // hare lane
    const pts = motionSamples(mu, mu + 2, 2, mu, lambda, 'hare');
    expect(pts.length).toBeGreaterThan(3);
    for (const p of pts) {
      const d = Math.hypot(p.x - RING_CX, p.y - RING_CY);
      expect(Math.abs(d - r)).toBeLessThan(1); // every sample sits on the lane
    }
  });

  it('motionSamples animates a full lap when a hop returns to the same node', () => {
    // λ = 2: two forward steps land back on the start node
    const mu = 3;
    const lambda = 2;
    const pts = motionSamples(mu, mu, 2, mu, lambda, 'hare');
    expect(pts.length).toBeGreaterThan(6);
    // the path visits the far side of the ring, not just the start point
    const angles = pts.map((p) =>
      Math.atan2(p.y - RING_CY, p.x - RING_CX),
    );
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(2);
  });

  it('keeps the hare outside the ring and the tortoise inside', () => {
    const mu = 3;
    const lambda = 6;
    const node = mu + 2;
    const c = { x: RING_CX, y: RING_CY };
    const distH = Math.hypot(
      pointerPos(node, mu, lambda, 'hare').x - c.x,
      pointerPos(node, mu, lambda, 'hare').y - c.y,
    );
    const distT = Math.hypot(
      pointerPos(node, mu, lambda, 'tort').x - c.x,
      pointerPos(node, mu, lambda, 'tort').y - c.y,
    );
    expect(distH).toBeGreaterThan(RING_R);
    expect(distT).toBeLessThan(RING_R);
  });
});
