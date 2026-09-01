import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PATTERN,
  DEFAULT_TEXT,
  kmpFrames,
  kmpNext,
  kmpPmt,
} from './kmp';

describe('kmpNext', () => {
  it('matches the NEXT table baked into the original KMP.js comment', () => {
    // KMP.js L596: "-1,0,0,1, 1, 2, 0, 1, 0" for pattern 'abaabcac'
    expect(kmpNext(DEFAULT_PATTERN)).toEqual([-1, 0, 0, 1, 1, 2, 0, 1, 0]);
  });

  it('has length pattern.length + 1 and a -1 sentinel at index 0', () => {
    const nxt = kmpNext(DEFAULT_PATTERN);
    expect(nxt).toHaveLength(DEFAULT_PATTERN.length + 1);
    expect(nxt[0]).toBe(-1);
  });

  it('handles a single repeated character', () => {
    expect(kmpNext('aaaa')).toEqual([-1, 0, 1, 2, 3]);
  });

  it('handles a pattern with no self-overlap', () => {
    expect(kmpNext('abcd')).toEqual([-1, 0, 0, 0, 0]);
  });
});

describe('kmpPmt', () => {
  it('is the NEXT table shifted (nxt[i + 1])', () => {
    expect(kmpPmt(DEFAULT_PATTERN)).toEqual([0, 0, 1, 1, 2, 0, 1, 0]);
  });
});

describe('kmpFrames', () => {
  const frames = kmpFrames(DEFAULT_TEXT, DEFAULT_PATTERN);

  it('starts from the initial state', () => {
    expect(frames[0]).toMatchObject({ kind: 'init', textPos: 0, patternPos: 0 });
  });

  it('reproduces the original rec / sgn / back sequences', () => {
    // rec = text-pointer position after each round
    expect(frames.map((f) => f.textPos)).toEqual([0, 1, 2, 7, 13]);
    // sgn = 1 for backtrack / found, 0 for advance (init excluded below)
    expect(frames.slice(1).map((f) => (f.kind === 'advance' ? 0 : 1))).toEqual([
      1, 0, 1, 1,
    ]);
    // back = pattern pointer after retreat
    expect(frames.slice(1).map((f) => f.patternPos)).toEqual([0, 0, 2, 0]);
  });

  it('ends by finding the single occurrence at text index 5', () => {
    const found = frames.filter((f) => f.kind === 'found');
    expect(found).toHaveLength(1);
    expect(found[0].matchStart).toBe(5);
    expect(found[0].matchEnd).toBe(13);
    expect(DEFAULT_TEXT.slice(5, 13)).toBe(DEFAULT_PATTERN);
  });

  it('keeps every matched run within the text bounds', () => {
    for (const f of frames) {
      expect(f.matchStart).toBeGreaterThanOrEqual(0);
      expect(f.matchEnd).toBeLessThanOrEqual(DEFAULT_TEXT.length);
      expect(f.matchStart).toBeLessThanOrEqual(f.matchEnd);
    }
  });

  it('finds all overlapping occurrences for a self-overlapping pattern', () => {
    const f = kmpFrames('ababababa', 'aba');
    const hits = f.filter((fr) => fr.kind === 'found').map((fr) => fr.matchStart);
    expect(hits).toEqual([0, 2, 4, 6]);
  });

  it('returns only the initial frame when the pattern cannot fit', () => {
    expect(kmpFrames('ab', 'abcabc')).toHaveLength(1);
  });
});
