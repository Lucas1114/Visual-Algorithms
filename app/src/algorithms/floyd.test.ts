import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CYCLE,
  DEFAULT_INPUT,
  floydFrames,
  floydModel,
  nextNode,
} from './floyd';

/** Every (length, entrance) pair worth exercising. */
function* cases(): Generator<{ labels: string; cycle: number }> {
  const alphabet = 'ABCDEFGHIJKLMNOP';
  for (let lens = 3; lens <= 16; lens++) {
    for (let cycle = 1; cycle <= lens - 2; cycle++) {
      yield { labels: alphabet.slice(0, lens), cycle };
    }
  }
}

/** Independent textbook Floyd on the successor function, returns the entrance. */
function bruteEntrance(labels: string, cycle: number): number {
  const model = floydModel(labels, cycle);
  let t = 0;
  let h = 0;
  do {
    t = nextNode(t, model);
    h = nextNode(nextNode(h, model), model);
  } while (t !== h);
  let a = 0;
  while (a !== t) {
    a = nextNode(a, model);
    t = nextNode(t, model);
  }
  return a;
}

describe('nextNode', () => {
  it('walks the tail then loops the last node back to the entrance', () => {
    const model = floydModel('ABCDEF', 2); // mu 2, lambda 4
    expect(nextNode(0, model)).toBe(1);
    expect(nextNode(1, model)).toBe(2);
    expect(nextNode(4, model)).toBe(5);
    expect(nextNode(5, model)).toBe(2); // wrap
  });
});

describe('floydFrames — meeting (phase 1)', () => {
  it('meets after k = lambda * ceil(mu / lambda) tortoise steps', () => {
    for (const { labels, cycle } of cases()) {
      const { mu, lambda, meetSteps } = floydFrames(labels, cycle);
      expect(meetSteps).toBe(lambda * Math.ceil(mu / lambda));
    }
  });

  it('meets on a node that lies inside the cycle', () => {
    for (const { labels, cycle } of cases()) {
      const { meetingNode } = floydFrames(labels, cycle);
      expect(meetingNode).toBeGreaterThanOrEqual(cycle);
      expect(meetingNode).toBeLessThan(labels.length);
    }
  });

  it('reports x = n·lambda − mu in [0, lambda)', () => {
    for (const { labels, cycle } of cases()) {
      const { mu, lambda, loops, meetOffset } = floydFrames(labels, cycle);
      expect(meetOffset).toBe(loops * lambda - mu);
      expect(meetOffset).toBeGreaterThanOrEqual(0);
      expect(meetOffset).toBeLessThan(lambda);
    }
  });

  it('hare has taken exactly twice the tortoise steps at every chase frame', () => {
    for (const { labels, cycle } of cases()) {
      for (const f of floydFrames(labels, cycle).frames) {
        if (f.phase === 'chase' || f.phase === 'meet') {
          expect(f.hareSteps).toBe(2 * f.tortSteps);
        }
      }
    }
  });

  it('advance counts match the phase (2/1 in the chase, 1/1 while converging)', () => {
    for (const { labels, cycle } of cases()) {
      for (const f of floydFrames(labels, cycle).frames) {
        if (f.phase === 'chase' || f.phase === 'meet') {
          expect([f.hareAdvance, f.tortAdvance]).toEqual([2, 1]);
        } else if (f.phase === 'converge' || f.phase === 'entrance') {
          expect([f.hareAdvance, f.tortAdvance]).toEqual([1, 1]);
        } else {
          expect([f.hareAdvance, f.tortAdvance]).toEqual([0, 0]);
        }
      }
    }
  });

  it('a chase frame on a two-node cycle has the hare back where it was but still advancing', () => {
    // 'ABCDE', entrance 3 → μ 3, λ 2: the hare loops back to its own node
    const { frames } = floydFrames('ABCDE', 3);
    const looped = frames.find(
      (f, i) =>
        f.phase === 'chase' &&
        i > 0 &&
        f.hare === frames[i - 1].hare &&
        f.hareAdvance === 2,
    );
    expect(looped).toBeDefined();
  });
});

describe('floydFrames — entrance (phase 2)', () => {
  it('converges on the chosen entrance', () => {
    for (const { labels, cycle } of cases()) {
      const { frames, entranceNode } = floydFrames(labels, cycle);
      expect(entranceNode).toBe(cycle);
      const entrance = frames.find((f) => f.phase === 'entrance');
      // when mu is a multiple of lambda the pointers are already together after
      // the regroup, so there is no distinct 'entrance' frame — 'done' still lands
      // on the entrance.
      const last = frames[frames.length - 1];
      expect(last.phase).toBe('done');
      expect(last.hare).toBe(cycle);
      expect(last.tort).toBe(cycle);
      if (entrance) {
        expect(entrance.hare).toBe(cycle);
        expect(entrance.tort).toBe(cycle);
      }
    }
  });

  it('agrees with an independent Floyd run', () => {
    for (const { labels, cycle } of cases()) {
      expect(floydFrames(labels, cycle).entranceNode).toBe(
        bruteEntrance(labels, cycle),
      );
    }
  });
});

describe('floydFrames — frame sequence', () => {
  it('starts on init, ends on done, carries exactly five derivation frames', () => {
    for (const { labels, cycle } of cases()) {
      const { frames } = floydFrames(labels, cycle);
      expect(frames[0].phase).toBe('init');
      expect(frames[frames.length - 1].phase).toBe('done');
      expect(frames.filter((f) => f.phase === 'derive')).toHaveLength(5);
      expect(
        frames.filter((f) => f.phase === 'derive').map((f) => f.deriveCase),
      ).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it('keeps hare and tort on real node indices in every frame', () => {
    for (const { labels, cycle } of cases()) {
      const { frames } = floydFrames(labels, cycle);
      for (const f of frames) {
        for (const node of [f.hare, f.tort]) {
          expect(node).toBeGreaterThanOrEqual(0);
          expect(node).toBeLessThan(labels.length);
        }
      }
    }
  });

  it('marks every frame from the meeting onward as met', () => {
    const { frames } = floydFrames(DEFAULT_INPUT, DEFAULT_CYCLE);
    const meetIdx = frames.findIndex((f) => f.phase === 'meet');
    expect(meetIdx).toBeGreaterThan(0);
    for (let i = 0; i < frames.length; i++) {
      expect(frames[i].met).toBe(i >= meetIdx);
    }
  });

  it('default input meets after 6 steps and finds entrance 4', () => {
    const r = floydFrames(DEFAULT_INPUT, DEFAULT_CYCLE);
    expect(r.mu).toBe(4);
    expect(r.lambda).toBe(6);
    expect(r.meetSteps).toBe(6);
    expect(r.loops).toBe(1);
    expect(r.meetOffset).toBe(2);
    expect(r.entranceNode).toBe(4);
  });

  it('handles the degenerate case where mu is a multiple of lambda', () => {
    // 'ABCDEF', entrance 4: mu 4, lambda 2, x 0 — meet on the entrance itself
    const r = floydFrames('ABCDEF', 4);
    expect(r.meetOffset).toBe(0);
    expect(r.meetingNode).toBe(4);
    expect(r.entranceNode).toBe(4);
  });
});
