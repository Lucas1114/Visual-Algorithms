/**
 * Manacher's algorithm — longest palindromic substring in O(n).
 *
 * Direct port of the 2021 vanilla-JS implementation in `Manachar/Manachar.js`:
 *   - `manacher`       <- `palindrome()`                 (Manachar.js L203-235)
 *   - `manacherFrames` <- `stepforward()` + `step0()`..`step7()`
 *
 * The algorithm core (`manacher`) is preserved line for line; only types were
 * added and the module-level globals (`p` / `mx` / `id` / `center` / `m_r` /
 * `m_l`) were made local so repeated runs cannot corrupt each other.
 *
 * `manacherFrames` replaces the nested `setTimeout` / `setInterval` step machinery
 * with a precomputed frame sequence, exactly as the KMP port did. The diff-border
 * branch is routed straight to the border update (owner decision 2026-09-01); the
 * `step8()`..`step13()` "why no outside comparison is needed" proof is deferred.
 */

/** The string the original demo hard-codes in the input box. */
export const DEFAULT_INPUT = 'ABACABACABB';

export interface ManacherResult {
  /** Transformed string: `#` between every character and at both ends. */
  s: string;
  /**
   * Manacher radius. The palindrome centered at `i` in `s` covers
   * `[i - p[i] + 1, i + p[i] - 1]`; the corresponding substring of the original
   * input has length `p[i] - 1`.
   */
  p: number[];
  /**
   * `center[i]` = **C**: the center of the palindrome with the furthest-right
   * reach among all indices processed before `i` (the original `center` array,
   * global `frb`). Recorded at the *start* of iteration `i`.
   */
  center: number[];
  /** `mirror[i]` = **M** = `2 * center[i] - i`: the mirror of `i` about C. */
  mirror: number[];
  /**
   * `mutualLeft[i]` = `max(C_left, M_left)`: the leftmost index of `s` covered by
   * *both* the palindrome centered at C and the one centered at M (the original
   * global `mutual_l`). Meaningful only when `i` sits inside C's palindrome.
   */
  mutualLeft: number[];
}

/**
 * Build the `#`-inserted string and run Manacher. Port of `palindrome()`.
 *
 * The source updates `mx` / `id` inside the expansion `while` (the textbook
 * version updates once after); the two are equivalent because both are monotone.
 */
export function manacher(input: string): ManacherResult {
  const s = '#' + input.split('').join('#') + '#';
  const lens = s.length;

  const p = new Array<number>(lens);
  let mx = 0;
  let id = 0;
  const center = new Array<number>(lens);
  const mR = new Array<number>(lens);
  const mL = new Array<number>(lens);

  for (let i = 0; i < lens; i++) {
    center[i] = id;
    if (mx > i) {
      p[i] = Math.min(mx - i, p[2 * id - i]);
    } else {
      p[i] = 1;
    }

    while (i - p[i] >= 0 && i + p[i] < lens && s[i - p[i]] === s[i + p[i]]) {
      p[i] += 1;
      if (i + p[i] > mx) {
        mx = i + p[i];
        id = i;
      }
    }

    mR[i] = 2 * center[i] - i;
    // mL uses p[mR[i]], computed in an earlier iteration when i is inside C's
    // palindrome. Outside it, mR[i] can be negative and this is NaN — harmless,
    // because the frame builder only reads mutualLeft on the inside-border path.
    mL[i] = Math.max(center[i] - p[center[i]] + 1, mR[i] - p[mR[i]] + 1);
  }

  return { s, p, center, mirror: mR, mutualLeft: mL };
}

/** Length of the longest palindromic substring of the original input. */
export function longestPalindrome(input: string): {
  start: number;
  length: number;
} {
  const { p } = manacher(input);
  let best = 0;
  let bestI = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > best) {
      best = p[i];
      bestI = i;
    }
  }
  const length = best - 1;
  // s index bestI maps back to input: characters sit at odd s indices.
  const start = (bestI - length) / 2;
  return { start, length };
}

// ---------------------------------------------------------------------------
// Frame sequence for the step-through animation
// ---------------------------------------------------------------------------

/** A highlighted strip of `s` shown on its own row during the walk-through. */
export interface PalStrip {
  /** Inclusive `s` index of the left edge. */
  left: number;
  /** Inclusive `s` index of the right edge. */
  right: number;
  /** The cell to mark as this palindrome's center, if any. */
  center: number | null;
}

export type ManacherPhase =
  | 'select'
  | 'pal2'
  | 'pal1'
  | 'pal3'
  | 'flip'
  | 'classify'
  | 'proof'
  | 'expand'
  | 'self'
  | 'border'
  | 'done';

export interface ManacherFrame {
  phase: ManacherPhase;
  /** One-line status shown under the canvas. */
  caption: string;
  /** Palindrome 2 — centered at C. `null` until revealed. */
  pal2: PalStrip | null;
  /** Palindrome 1 — centered at M. */
  pal1: PalStrip | null;
  /** Palindrome 3 — the C∩M intersection, centered at M. */
  pal3: PalStrip | null;
  /** Palindrome 4 — palindrome 3 reflected about C, centered at the current element. */
  pal4: PalStrip | null;
  /** Whether palindrome 4 should be shown in its flipped position. */
  flipped: boolean;
  /** Green "just confirmed by comparison" cell pairs on the main row (`s` indices). */
  confirmed: number[];
  /** Radius value to show in the current element's cell of the radius row (`null` => "?"). */
  radiusValue: number | null;
  /** `s` index of the rightmost-border marker. */
  rightmostBorder: number;
  /** Active flow-chart node ids for this frame. */
  flowNodes: string[];
  /** Active flow-chart edge ids for this frame. */
  flowEdges: string[];
  /**
   * Accumulated lines of the diff-border "why no outside comparison is needed"
   * derivation, shown in a panel that grows one line per proof frame (the 2021
   * `nc_txt`). Empty on every non-proof frame except the border/done frames that
   * follow it, which carry the finished derivation so the panel stays put.
   */
  derivationLines: string[];
  /** The two `s` indices linked by the current reflection hop (proof frames). */
  proofPair: [number, number] | null;
  /** Relation drawn on the current hop's connector. */
  proofRelation: '=' | '≠' | '?' | null;
  /** `s` indices established as part of the argument so far. */
  proofResolved: number[];
  /** `s` indices marked with an orange "?" — the cells being tested. */
  proofQuery: number[];
  /** `s` indices marked with a red "×" — the proven mismatch. */
  proofCross: number[];
}

export interface ManacherFramesResult {
  /** The chosen center as an `s` index. */
  center: number;
  /** C, M for the chosen center (`s` indices). */
  C: number;
  M: number;
  /** Final radius of the palindrome centered on the chosen element. */
  radius: number;
  /** `true` when the current element lies on or outside the known right border. */
  outside: boolean;
  frames: ManacherFrame[];
}

/**
 * Precompute the step-through frames for one chosen palindrome center.
 *
 * `center` is an index into the transformed string `s` (the demo lets the user
 * click any index). Mirrors the branching of `stepforward()`:
 *
 *   - current element on/outside the right border  -> self · expand · border
 *   - inside, palindrome 1 reaches C's left border -> pal2 · pal1 · pal3 · flip ·
 *                                                     classify · expand · border
 *   - inside, palindrome 1 strictly inside C       -> …classify · border (radius
 *                                                     is already exact)
 */
export function manacherFrames(
  input: string,
  center: number,
): ManacherFramesResult {
  const { s, p, center: cArr, mirror, mutualLeft } = manacher(input);
  const lens = s.length;

  const cur = center;
  const C = cArr[cur];
  const M = mirror[cur];
  const radius = p[cur];
  const rightBorder = C + p[C] - 1;
  const outside = cur >= rightBorder;

  const frames: ManacherFrame[] = [];

  const base = (): ManacherFrame => ({
    phase: 'select',
    caption: '',
    pal2: null,
    pal1: null,
    pal3: null,
    pal4: null,
    flipped: false,
    confirmed: [],
    radiusValue: null,
    rightmostBorder: rightBorder,
    flowNodes: [],
    flowEdges: [],
    derivationLines: [],
    proofPair: null,
    proofRelation: null,
    proofResolved: [],
    proofQuery: [],
    proofCross: [],
  });

  // Frame 0 — the element is selected, nothing computed yet.
  frames.push({
    ...base(),
    phase: 'select',
    caption: `Current element at s[${cur}]. The rightmost known palindrome border is at s[${rightBorder}].`,
    flowNodes: ['A'],
  });

  if (outside) {
    // ---- current element on/outside the border: expand from scratch ----
    frames.push({
      ...base(),
      phase: 'self',
      caption:
        'The element is outside every known palindrome, so it starts as its own palindrome (radius 1).',
      radiusValue: 1,
      flowNodes: ['C'],
      flowEdges: ['A-no'],
    });

    let k = 1;
    while (cur - k >= 0 && cur + k < lens && s[cur - k] === s[cur + k]) {
      k += 1;
      const confirmed: number[] = [];
      for (let j = 1; j < k; j++) confirmed.push(cur - j, cur + j);
      frames.push({
        ...base(),
        phase: 'expand',
        caption: `s[${cur - (k - 1)}] = s[${cur + (k - 1)}] — extend outward. Radius is now ${k}.`,
        confirmed,
        radiusValue: k,
        flowNodes: ['C', 'L'],
        flowEdges: ['C-L'],
      });
    }

    frames.push({
      ...base(),
      phase: 'border',
      caption: `No further match. Radius = ${radius}. The rightmost border moves to s[${cur + radius - 1}].`,
      radiusValue: radius,
      rightmostBorder: cur + radius - 1,
      confirmed: expandConfirmed(cur, radius),
      flowNodes: ['L', 'M'],
      flowEdges: ['L-M'],
    });

    frames.push({
      ...base(),
      phase: 'done',
      caption: 'Done — pick another center or edit the string.',
      radiusValue: radius,
      rightmostBorder: cur + radius - 1,
      confirmed: expandConfirmed(cur, radius),
      flowNodes: ['M'],
    });

    return { center: cur, C, M, radius, outside, frames };
  }

  // ---- current element strictly inside C's palindrome ----
  const pal2: PalStrip = { left: C - p[C] + 1, right: C + p[C] - 1, center: C };
  const pal1: PalStrip = { left: M - p[M] + 1, right: M + p[M] - 1, center: M };
  const mutL = mutualLeft[cur];
  const pal3: PalStrip = { left: mutL, right: 2 * M - mutL, center: M };
  const pal4: PalStrip = {
    left: 2 * C - (2 * M - mutL),
    right: 2 * C - mutL,
    center: cur,
  };

  const cLeft = C - p[C] + 1;
  const mLeft = M - p[M] + 1;
  const sameBorder = cLeft === mLeft;

  // Filled in by the diff-border branch so the border/done frames can keep the
  // finished "why no comparison" derivation on screen.
  let proofDeriv: string[] = [];

  // step0 — palindrome 2 (centered C)
  frames.push({
    ...base(),
    phase: 'pal2',
    caption: `Palindrome 2 is centered at C = s[${C}] and owns the rightmost border.`,
    pal2,
    flowNodes: ['E'],
    flowEdges: ['A-yes'],
  });

  // step1 — palindrome 1 (centered M)
  frames.push({
    ...base(),
    phase: 'pal1',
    caption: `Palindrome 1 is the longest palindrome centered at the mirror M = s[${M}].`,
    pal2,
    pal1,
    flowNodes: ['D'],
    flowEdges: ['E-D'],
  });

  // step2 — intersection -> palindrome 3, classify which left border binds
  const closerNode = sameBorder ? 'H' : 'I';
  frames.push({
    ...base(),
    phase: 'pal3',
    caption: sameBorder
      ? `Palindrome 1 reaches exactly palindrome 2's left border. Palindrome 3 is their shared middle.`
      : `Palindrome 3 is the part of palindrome 1 that also lies inside palindrome 2.`,
    pal2,
    pal1,
    pal3,
    flowNodes: ['F', closerNode],
    flowEdges: ['D-F', 'E-F'],
  });

  // step3 — flip palindrome 3 about C -> palindrome 4
  frames.push({
    ...base(),
    phase: 'flip',
    caption: `Flip palindrome 3 around C. Its reflection, palindrome 4, is centered on the current element.`,
    pal2,
    pal1,
    pal3,
    pal4,
    flipped: true,
    flowNodes: ['G', closerNode],
    flowEdges: ['F-G'],
  });

  const pal4Radius = pal4.right - cur + 1;

  if (sameBorder) {
    // step4 (same) -> radius is a lower bound, must expand outward
    frames.push({
      ...base(),
      phase: 'classify',
      caption: `Same borders: the radius is at least palindrome 4 (${pal4Radius}); expand to check for more.`,
      pal2,
      pal1,
      pal4,
      flipped: true,
      radiusValue: pal4Radius,
      flowNodes: ['H', 'J'],
      flowEdges: ['G-H', 'H-J'],
    });

    // step6 — expand outward from the edge of palindrome 4
    let k = pal4Radius;
    while (cur - k >= 0 && cur + k < lens && s[cur - k] === s[cur + k]) {
      k += 1;
      frames.push({
        ...base(),
        phase: 'expand',
        caption: `s[${cur - (k - 1)}] = s[${cur + (k - 1)}] — extend outward. Radius is now ${k}.`,
        pal2,
        pal1,
        pal4,
        flipped: true,
        confirmed: expandConfirmed(cur, k, pal4Radius),
        radiusValue: k,
        flowNodes: ['J', 'L'],
        flowEdges: ['J-L'],
      });
    }

    // step7 — update the rightmost border
    frames.push({
      ...base(),
      phase: 'border',
      caption: `No further match. Radius = ${radius}. The rightmost border moves to s[${cur + radius - 1}].`,
      pal2,
      pal1,
      pal4,
      flipped: true,
      confirmed: expandConfirmed(cur, radius, pal4Radius),
      radiusValue: radius,
      rightmostBorder: cur + radius - 1,
      flowNodes: ['L', 'M'],
      flowEdges: ['L-M'],
    });
  } else {
    // step4 (diff) -> radius is exactly palindrome 4; no comparison needed.
    frames.push({
      ...base(),
      phase: 'classify',
      caption: `One border is strictly closer, so the radius is exactly palindrome 4: ${pal4Radius} — and the cells just outside it need no comparison.`,
      pal2,
      pal1,
      pal4,
      flipped: true,
      radiusValue: pal4Radius,
      flowNodes: ['I', 'K'],
      flowEdges: ['G-I', 'I-K'],
    });

    // step8..step13 — the "why no outside comparison is needed" proof, restored
    // as a group of frames on the diff-border branch (owner decision 2026-09-01).
    // The two cells just past palindrome 4's ends are next_l / next_r; reflecting
    // them about C, then M, then C lands on a known palindrome boundary, forcing
    // S[next_l] != S[next_r]. See HANDOFF.md for the full trace of the 2021 code.
    const proof = diffBorderProof(s, C, M, pal2, pal4);

    if (proof) {
      const { nextL, nextR, aa, bb, rel2, rel3, degenerate } = proof;
      const lines: string[] = [];

      lines.push(
        `Goal: show S[${nextL}] ≠ S[${nextR}], so palindrome 4 cannot grow.`,
      );
      frames.push({
        ...base(),
        phase: 'proof',
        caption: `Could palindrome 4 reach further? Test the cells just past its ends: s[${nextL}] and s[${nextR}].`,
        pal2,
        pal1,
        pal4,
        flipped: true,
        radiusValue: pal4Radius,
        derivationLines: [...lines],
        proofQuery: [nextL, nextR],
        flowNodes: ['K', 'N'],
        flowEdges: ['K-N'],
      });

      lines.push(
        degenerate
          ? `S[${nextL}] is the cell at C — reflecting about C leaves it in place.`
          : `S[${nextL}] = S[${aa}]   (palindrome 2 is symmetric about C)`,
      );
      frames.push({
        ...base(),
        phase: 'proof',
        caption: degenerate
          ? `s[${nextL}] sits on C itself, so reflecting it across C changes nothing.`
          : `Reflect s[${nextL}] across C to s[${aa}]. Both lie inside palindrome 2, which is symmetric about C, so they are equal.`,
        pal2,
        pal1,
        pal4,
        flipped: true,
        radiusValue: pal4Radius,
        derivationLines: [...lines],
        proofPair: degenerate ? null : [nextL, aa],
        proofRelation: degenerate ? null : '=',
        proofResolved: [nextL, aa],
        proofQuery: [nextR],
        flowNodes: ['N'],
      });

      lines.push(
        rel2 === '='
          ? `S[${aa}] = S[${bb}]   (palindrome 1 is symmetric about M)`
          : `S[${aa}] ≠ S[${bb}]   (this is where palindrome 1 stopped)`,
      );
      frames.push({
        ...base(),
        phase: 'proof',
        caption:
          rel2 === '='
            ? `Reflect s[${aa}] across M to s[${bb}]. Both lie inside palindrome 1, symmetric about M, so they are equal.`
            : `Reflect s[${aa}] across M to s[${bb}] — this is exactly the comparison that stopped palindrome 1, so s[${aa}] ≠ s[${bb}].`,
        pal2,
        pal1,
        pal4,
        flipped: true,
        radiusValue: pal4Radius,
        derivationLines: [...lines],
        proofPair: [aa, bb],
        proofRelation: rel2,
        proofResolved: [nextL, aa, bb],
        proofQuery: [nextR],
        flowNodes: ['N'],
      });

      lines.push(
        rel3 === '='
          ? `S[${bb}] = S[${nextR}]   (palindrome 2 is symmetric about C)`
          : `S[${bb}] ≠ S[${nextR}]   (this is where palindrome 2 stopped)`,
      );
      frames.push({
        ...base(),
        phase: 'proof',
        caption:
          rel3 === '='
            ? `Reflect s[${bb}] across C to s[${nextR}]. Both lie inside palindrome 2, symmetric about C, so they are equal.`
            : `Reflect s[${bb}] across C to s[${nextR}] — this is exactly the comparison that stopped palindrome 2, so s[${bb}] ≠ s[${nextR}].`,
        pal2,
        pal1,
        pal4,
        flipped: true,
        radiusValue: pal4Radius,
        derivationLines: [...lines],
        proofPair: [bb, nextR],
        proofRelation: rel3,
        proofResolved: [nextL, aa, bb, nextR],
        flowNodes: ['N'],
      });

      lines.push(
        `⇒ S[${nextL}] ≠ S[${nextR}]   — palindrome 4 is already maximal`,
      );
      frames.push({
        ...base(),
        phase: 'proof',
        caption: `Chaining the three: s[${nextL}] ≠ s[${nextR}]. Palindrome 4 cannot extend, so the radius is exactly ${pal4Radius}.`,
        pal2,
        pal1,
        pal4,
        flipped: true,
        radiusValue: pal4Radius,
        derivationLines: [...lines],
        proofResolved: [aa, bb],
        proofCross: [nextL, nextR],
        flowNodes: ['N'],
      });

      proofDeriv = [...lines];
    }

    frames.push({
      ...base(),
      phase: 'border',
      caption:
        radius === pal4Radius && cur + radius - 1 <= rightBorder
          ? `Radius = ${radius}. This palindrome stays within the current rightmost border.`
          : `Radius = ${radius}. The rightmost border moves to s[${cur + radius - 1}].`,
      pal2,
      pal1,
      pal4,
      flipped: true,
      radiusValue: radius,
      rightmostBorder: Math.max(rightBorder, cur + radius - 1),
      derivationLines: proofDeriv,
      flowNodes: ['K', 'M'],
      flowEdges: ['K-M'],
    });
  }

  frames.push({
    ...base(),
    phase: 'done',
    caption: 'Done — pick another center or edit the string.',
    pal2,
    pal1,
    pal4,
    flipped: true,
    radiusValue: radius,
    rightmostBorder: Math.max(rightBorder, cur + radius - 1),
    confirmed: sameBorder ? expandConfirmed(cur, radius, pal4Radius) : [],
    derivationLines: proofDeriv,
    flowNodes: ['M'],
  });

  return { center: cur, C, M, radius, outside, frames };
}

/**
 * The diff-border "why no outside comparison is needed" argument (2021
 * `step8()`..`step13()`). The two cells just past palindrome 4's ends,
 *
 *   next_l = pal4.left - 1      next_r = pal4.right + 1
 *
 * are shown to differ by chaining three reflections:
 *
 *   next_l --(about C)--> a --(about M)--> b --(about C)--> next_r
 *
 * Two of the hops are equalities (a palindrome's internal symmetry); exactly one
 * is the mismatch that stopped palindrome 1 or palindrome 2. Returns `null` when
 * any of the four indices falls outside `s` — the caller then routes straight to
 * the border update, which is already correct on its own.
 */
function diffBorderProof(
  s: string,
  C: number,
  M: number,
  pal2: PalStrip,
  pal4: PalStrip,
): {
  nextL: number;
  nextR: number;
  aa: number;
  bb: number;
  rel2: '=' | '≠';
  rel3: '=' | '≠';
  degenerate: boolean;
} | null {
  const nextL = pal4.left - 1;
  const nextR = pal4.right + 1;
  const aa = 2 * C - nextL; // pal3.right + 1 = 2M - mutL + 1
  const bb = 2 * M - aa; // mutL - 1

  if (
    nextL < 0 ||
    nextR >= s.length ||
    Math.min(aa, bb) < 0 ||
    Math.max(aa, bb) >= s.length
  ) {
    return null;
  }
  // Both other palindromes must actually cover a / b for the symmetry appeals to
  // hold; if the geometry is degenerate beyond the next_l == C case, bail out.
  const inside = (strip: PalStrip, i: number) =>
    i >= strip.left && i <= strip.right;
  if (!inside(pal2, aa) && aa !== C) return null;

  return {
    nextL,
    nextR,
    aa,
    bb,
    rel2: s[aa] === s[bb] ? '=' : '≠',
    rel3: s[bb] === s[nextR] ? '=' : '≠',
    degenerate: nextL === aa,
  };
}

/** Green cell pairs for radius `k` centered at `cur`, from `fromK` outward. */
function expandConfirmed(cur: number, k: number, fromK = 1): number[] {
  const out: number[] = [];
  for (let j = fromK; j < k; j++) out.push(cur - j, cur + j);
  return out;
}
