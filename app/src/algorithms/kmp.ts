/**
 * KMP (Knuth–Morris–Pratt) string matching.
 *
 * Direct port of the 2021 vanilla-JS implementation in `KMP/KMP.js`:
 *   - `kmpNext`   <- `kmp_pmt()`            (KMP.js L376-399)
 *   - `kmpFrames` <- the while loop inside `Animation()` (KMP.js L471-494)
 *
 * The algorithm logic is preserved line for line; only types were added and the
 * mutated module-level arrays (`nxt` / `rec` / `sgn` / `back`) were made local so
 * repeated runs can no longer corrupt each other (the known bug noted in
 * CLAUDE.md — "重复点击 Animation 会导致动画错乱").
 */

/** The text / pattern the original demo hard-codes (`txt_s` / `pat_s`). */
export const DEFAULT_TEXT = 'acabaabaabcaccaabc';
export const DEFAULT_PATTERN = 'abaabcac';

/**
 * Build the NEXT table (a.k.a. failure function) for a pattern.
 *
 * Port of `kmp_pmt()`. The original seeds the global `nxt` with `[-1, 0]` and
 * pushes onto it; here `nxt` is local. Result length is `pattern.length + 1`
 * (`nxt[0] === -1` is the sentinel used when the first character mismatches).
 *
 * `pre` / `suf` are the end indices of the prefix / suffix being compared.
 */
export function kmpNext(pattern: string): number[] {
  const nxt: number[] = [-1, 0];

  let pre = 0;
  let suf = 1;

  while (suf < pattern.length) {
    if (pattern[pre] === pattern[suf]) {
      pre += 1;
      suf += 1;
      nxt.push(pre);
    } else if (pre) {
      // original: nxt[pre - 1 + 1], i.e. nxt[pre]
      pre = nxt[pre];
    } else {
      nxt.push(0);
      suf += 1;
    }
  }

  return nxt;
}

export type KmpFrameKind = 'init' | 'advance' | 'backtrack' | 'found';

/**
 * One "comparison round" of the matching process — the granularity the original
 * animation steps through (its `rec` / `sgn` / `back` arrays). Runs of character
 * matches are collapsed into a single frame; a frame is emitted whenever the
 * pattern backtracks, the text pointer advances past a dead position, or a full
 * match is found.
 *
 * Every field is the *resulting* visible state after the round, so a view can
 * render `frames[step]` directly with no history.
 */
export interface KmpFrame {
  kind: KmpFrameKind;
  /** Text pointer (TP) position after this round — the original `rec[k]`. */
  textPos: number;
  /** Pattern pointer (PP) position after this round. */
  patternPos: number;
  /** Text index the pattern's left edge is aligned to after this round. */
  patternStart: number;
  /** `[matchStart, matchEnd)` — text indices matched (green) during this round. */
  matchStart: number;
  matchEnd: number;
  /** Text index that mismatched (red), or `null` for `init` / `found`. */
  mismatchPos: number | null;
}

/**
 * Run KMP matching and return the precomputed frame sequence, starting with the
 * initial state (`kind: 'init'`). Port of the `Animation()` while loop.
 *
 * Note: the source keeps `txt_pos = nxt[pat_pos]` / the loop guard
 * `txt_pos - pat_pos + pat_s.length <= txt_s.length` verbatim. A stale hand
 * trace in KMP.js (the `// 0,1,2,7,13,14,15,17,18  rec` comment) does not match
 * this input — the real run ends once no further alignment fits the text.
 */
export function kmpFrames(text: string, pattern: string): KmpFrame[] {
  const nxt = kmpNext(pattern);

  const frames: KmpFrame[] = [
    {
      kind: 'init',
      textPos: 0,
      patternPos: 0,
      patternStart: 0,
      matchStart: 0,
      matchEnd: 0,
      mismatchPos: null,
    },
  ];

  let txtPos = 0;
  let patPos = 0;

  while (txtPos - patPos + pattern.length <= text.length) {
    if (text[txtPos] === pattern[patPos]) {
      txtPos += 1;
      patPos += 1;
    } else if (patPos) {
      const alignStart = txtPos - patPos;
      const mismatchPos = txtPos;
      patPos = nxt[patPos];
      frames.push({
        kind: 'backtrack',
        textPos: txtPos,
        patternPos: patPos,
        patternStart: txtPos - patPos,
        matchStart: alignStart,
        matchEnd: mismatchPos,
        mismatchPos,
      });
    } else {
      const mismatchPos = txtPos;
      txtPos += 1;
      frames.push({
        kind: 'advance',
        textPos: txtPos,
        patternPos: patPos,
        patternStart: txtPos,
        matchStart: mismatchPos,
        matchEnd: mismatchPos,
        mismatchPos,
      });
    }

    if (patPos === pattern.length) {
      const alignStart = txtPos - patPos;
      patPos = nxt[patPos];
      frames.push({
        kind: 'found',
        textPos: txtPos,
        patternPos: patPos,
        patternStart: txtPos - patPos,
        matchStart: alignStart,
        matchEnd: txtPos,
        mismatchPos: null,
      });
    }
  }

  return frames;
}

/**
 * The "PMT" values shown in the PMT tab: `pmt[i]` is the length of the longest
 * proper prefix of `pattern[0..i]` that is also a suffix. Derived from the NEXT
 * table exactly as the original does (`nxt[i + 1]`).
 */
export function kmpPmt(pattern: string): number[] {
  const nxt = kmpNext(pattern);
  return pattern.split('').map((_, i) => nxt[i + 1]);
}
