import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INPUT,
  longestPalindrome,
  manacher,
  manacherFrames,
} from './manacher';

/** Independent brute-force longest palindromic substring, for cross-checking. */
function bruteLongest(str: string): { start: number; length: number } {
  let best = { start: 0, length: 0 };
  for (let i = 0; i < str.length; i++) {
    for (let j = i; j < str.length; j++) {
      const sub = str.slice(i, j + 1);
      if (sub === [...sub].reverse().join('') && sub.length > best.length) {
        best = { start: i, length: sub.length };
      }
    }
  }
  return best;
}

describe('manacher', () => {
  it('builds the #-inserted string', () => {
    expect(manacher('ABA').s).toBe('#A#B#A#');
    // empty input: the demo alerts before reaching here, but the join still runs
    expect(manacher('').s).toBe('##');
  });

  it('radius array has p[i] - 1 == palindrome length in the original string', () => {
    const { s, p } = manacher(DEFAULT_INPUT);
    for (let i = 0; i < s.length; i++) {
      // the palindrome centered at i covers [i - (p[i]-1), i + (p[i]-1)]
      const arm = p[i] - 1;
      expect(i - arm).toBeGreaterThanOrEqual(0);
      expect(i + arm).toBeLessThan(s.length);
      for (let k = 1; k <= arm; k++) {
        expect(s[i - k]).toBe(s[i + k]);
      }
      // and cannot be extended further
      if (i - arm - 1 >= 0 && i + arm + 1 < s.length) {
        expect(s[i - arm - 1]).not.toBe(s[i + arm + 1]);
      }
    }
  });

  it('mirror[i] is the reflection of i about center[i]', () => {
    const { s, center, mirror } = manacher(DEFAULT_INPUT);
    for (let i = 0; i < s.length; i++) {
      expect(mirror[i]).toBe(2 * center[i] - i);
    }
  });

  it('finds the longest palindromic substring of the default input', () => {
    // "BACABACAB" (input indices 1..9) is the longest palindrome in "ABACABACABB"
    const got = longestPalindrome(DEFAULT_INPUT);
    const brute = bruteLongest(DEFAULT_INPUT);
    expect(got.length).toBe(brute.length);
    expect(DEFAULT_INPUT.substr(got.start, got.length)).toBe('BACABACAB');
  });

  it('agrees with brute force on assorted strings', () => {
    for (const str of [
      'A',
      'AA',
      'AB',
      'ABBA',
      'ABCBA',
      'AAAAA',
      'ABABABA',
      'XABAY',
    ]) {
      const got = longestPalindrome(str);
      const brute = bruteLongest(str);
      expect(got.length).toBe(brute.length);
    }
  });
});

describe('manacherFrames', () => {
  it('starts on the select frame and ends on done', () => {
    const { frames } = manacherFrames(DEFAULT_INPUT, 9);
    expect(frames[0].phase).toBe('select');
    expect(frames[frames.length - 1].phase).toBe('done');
  });

  it('reaches the true radius by the border frame, inside-border case', () => {
    // s index 9 = input index 4 ('A'), sits inside "ABACABA"
    const { frames, radius, outside, C, M } = manacherFrames(DEFAULT_INPUT, 9);
    expect(outside).toBe(false);
    expect(M).toBe(2 * C - 9);
    const border = frames.find((f) => f.phase === 'border');
    expect(border?.radiusValue).toBe(radius);
  });

  it('handles the on/outside-border case with a from-scratch expansion', () => {
    // s index 0 is always on the border
    const { frames, outside, radius } = manacherFrames(DEFAULT_INPUT, 0);
    expect(outside).toBe(true);
    expect(frames.some((f) => f.phase === 'self')).toBe(true);
    const border = frames.find((f) => f.phase === 'border');
    expect(border?.radiusValue).toBe(radius);
  });

  it('never emits a frame whose radius exceeds the true radius', () => {
    for (let c = 0; c < manacher(DEFAULT_INPUT).s.length; c++) {
      const { frames, radius } = manacherFrames(DEFAULT_INPUT, c);
      for (const f of frames) {
        if (f.radiusValue != null)
          expect(f.radiusValue).toBeLessThanOrEqual(radius);
      }
    }
  });

  it('keeps every confirmed cell index within bounds', () => {
    const lens = manacher(DEFAULT_INPUT).s.length;
    for (let c = 0; c < lens; c++) {
      const { frames } = manacherFrames(DEFAULT_INPUT, c);
      for (const f of frames) {
        for (const idx of f.confirmed) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(lens);
        }
      }
    }
  });
});

describe('manacherFrames — diff-border proof (2021 step8..step13)', () => {
  /** All centers of `input` whose walk-through hits the diff-border branch. */
  function diffBorderCenters(input: string): number[] {
    const { s } = manacher(input);
    const out: number[] = [];
    for (let c = 1; c < s.length; c++) {
      if (manacherFrames(input, c).frames.some((f) => f.phase === 'proof')) {
        out.push(c);
      }
    }
    return out;
  }

  it('only the diff-border branch carries a proof', () => {
    // s[9] is diff-border, s[11] is same-border, s[0] is outside
    expect(
      manacherFrames(DEFAULT_INPUT, 9).frames.some((f) => f.phase === 'proof'),
    ).toBe(true);
    for (const c of [0, 11]) {
      const { frames } = manacherFrames(DEFAULT_INPUT, c);
      expect(frames.some((f) => f.phase === 'proof')).toBe(false);
      expect(frames.every((f) => f.derivationLines.length === 0)).toBe(true);
    }
  });

  it('the derivation resolves to a real mismatch with exactly one unequal hop', () => {
    for (const input of [
      DEFAULT_INPUT,
      'AABAAB',
      'ABCBABCBA',
      'ABABABABA',
      'ABACABADABACABA',
      'AABBAABBAA',
    ]) {
      const { s } = manacher(input);
      for (const c of diffBorderCenters(input)) {
        const { frames, radius } = manacherFrames(input, c);
        const proof = frames.filter((f) => f.phase === 'proof');
        const lines = proof[proof.length - 1].derivationLines;

        // goal + three hops + conclusion
        expect(lines).toHaveLength(5);
        const hops = lines.slice(1, 4);
        expect(hops.filter((l) => l.includes('≠'))).toHaveLength(1);

        const [, l, r] = lines[lines.length - 1].match(
          /S\[(\d+)\] ≠ S\[(\d+)\]/,
        )!;
        expect(s[Number(l)]).not.toBe(s[Number(r)]);

        // diff-border never expands: the radius equals palindrome 4's radius,
        // and no proof frame claims otherwise.
        for (const f of proof) {
          expect(f.radiusValue).toBe(radius);
        }
      }
    }
  });

  it('grows the derivation one line per proof frame, prefix-stable', () => {
    const proof = manacherFrames(DEFAULT_INPUT, 15).frames.filter(
      (f) => f.phase === 'proof',
    );
    expect(proof).toHaveLength(5);
    for (let i = 0; i < proof.length; i++) {
      expect(proof[i].derivationLines).toHaveLength(i + 1);
      if (i > 0) {
        expect(proof[i].derivationLines.slice(0, i)).toEqual(
          proof[i - 1].derivationLines,
        );
      }
    }
    // the finished derivation stays on the border and done frames
    const tail = manacherFrames(DEFAULT_INPUT, 15).frames.slice(-2);
    for (const f of tail) {
      expect(f.derivationLines).toHaveLength(5);
    }
  });

  it('keeps every proof cell index within bounds', () => {
    for (const input of [DEFAULT_INPUT, 'ABACABADABACABA', 'AABBAABBAA']) {
      const lens = manacher(input).s.length;
      for (const c of diffBorderCenters(input)) {
        for (const f of manacherFrames(input, c).frames) {
          for (const idx of [
            ...f.proofResolved,
            ...f.proofQuery,
            ...f.proofCross,
            ...(f.proofPair ?? []),
          ]) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(lens);
          }
        }
      }
    }
  });
});
