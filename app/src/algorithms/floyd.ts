/**
 * Floyd's cycle detection — the "hare and tortoise" algorithm.
 *
 * The 2021 vanilla-JS page (`hare-tortoise/Hare&Tortoise.js`) has **no algorithm
 * core to port line for line**: it is a geometric animation driven by a closed
 * form (`merge_idx`) plus a meeting predicate. Per the owner decision
 * (2026-09-01) this rebuild instead models the ρ-shape as a successor function
 * and runs the textbook two-phase Floyd:
 *
 *   phase 1  t = next(t); h = next(next(h))   until t === h   (the meeting)
 *   phase 2  a = next(a) from the start; b = next(b) from the meeting;
 *            both one step at a time until a === b              (the entrance)
 *
 * `floydFrames` precomputes the whole walk as a frame list, exactly as the KMP
 * and Manacher ports did — stepping is `setStep(s ± 1)` and backward stepping
 * needs no special logic (the 2021 `step_back()` cross-phase rollback is gone).
 *
 * Notation used throughout (matches HANDOFF.md):
 *   mu     = tail length  = the entrance index `cycle`
 *   lambda = cycle length = lens - cycle
 *   k      = tortoise steps at the meeting = lambda * ceil(mu / lambda)
 *   n      = k / lambda   = extra loops the hare made
 *   x      = entrance -> meeting distance along the cycle = n*lambda - mu (0 <= x < lambda)
 */

/** The letter string the 2021 input box hard-codes. */
export const DEFAULT_INPUT = 'ABCDEFGHIJ';

/** A sensible default entrance for {@link DEFAULT_INPUT} (mu = 4, lambda = 6). */
export const DEFAULT_CYCLE = 4;

export interface FloydModel {
  /** Node labels — the letter string. Pure decoration; the algorithm only
   * depends on `mu` and `lambda`. */
  labels: string;
  /** Number of nodes. */
  lens: number;
  /** Entrance node index (= `mu`). Node `lens - 1` links back here. */
  cycle: number;
  /** Tail length: steps from the start node to the entrance. */
  mu: number;
  /** Cycle length. */
  lambda: number;
}

/** Build the ρ-model for a letter string and a chosen entrance index. */
export function floydModel(labels: string, cycle: number): FloydModel {
  const lens = labels.length;
  return { labels, lens, cycle, mu: cycle, lambda: lens - cycle };
}

/** Successor of node `i` in the ρ-shape: `i + 1`, wrapping `lens - 1` -> `cycle`. */
export function nextNode(i: number, model: FloydModel): number {
  return i < model.lens - 1 ? i + 1 : model.cycle;
}

// ---------------------------------------------------------------------------
// Frame sequence for the step-through animation
// ---------------------------------------------------------------------------

export type FloydPhase =
  | 'init'
  | 'chase'
  | 'meet'
  | 'derive'
  | 'regroup'
  | 'converge'
  | 'entrance'
  | 'done';

export interface FloydFrame {
  phase: FloydPhase;
  /** One-line status shown under the canvas. */
  caption: string;
  /** Hare node index. */
  hare: number;
  /** Tortoise node index. */
  tort: number;
  /** Hare speed for this phase (2 in the chase, 1 afterwards). */
  hareSpeed: 1 | 2;
  /** Steps the tortoise has taken in the current phase. */
  tortSteps: number;
  /** Steps the hare has taken in the current phase. */
  hareSteps: number;
  /**
   * Forward successor hops each pointer took to reach this frame from the
   * previous one — so the view can animate a hop that loops right back to the
   * same node (a two-step hare move on a `λ = 2` cycle). `0` means "no move"
   * or "teleport" (snap, don't animate).
   */
  hareAdvance: number;
  tortAdvance: number;
  /** Which of the five distance-equation cases to show (`null` outside the derivation). */
  deriveCase: number | null;
  /** True once the phase-1 meeting is on screen — keeps the meeting marker up. */
  met: boolean;
  /** Meeting node (phase-1 result). */
  meetingNode: number;
  /** Cycle entrance node (phase-2 result — always `cycle`). */
  entranceNode: number;
}

export interface FloydFramesResult extends FloydModel {
  /** Tortoise steps at the meeting (`k`). */
  meetSteps: number;
  /** Extra loops the hare made (`n`). */
  loops: number;
  /** Entrance -> meeting distance along the cycle (`x`). */
  meetOffset: number;
  meetingNode: number;
  /** Cycle entrance node (= `cycle`). */
  entranceNode: number;
  frames: FloydFrame[];
}

/** The five distance-equation captions (2021 `<p id="track0..4">`, reworded). */
function deriveCaption(
  c: number,
  mu: number,
  lambda: number,
  n: number,
  x: number,
): string {
  const nLam = n === 1 ? `${lambda}` : `${n}·${lambda}`;
  switch (c) {
    case 0:
      return `The two paths so far: the tortoise walked ${mu} + ${x} = ${mu + x}; the hare walked twice that.`;
    case 1:
      return `The hare covered the same tail-plus-arc, then ${n} extra loop${n === 1 ? '' : 's'}: 2·(${mu} + ${x}) = (${mu} + ${x}) + ${nLam}.`;
    case 2:
      return `Expand both sides: ${2 * mu} + ${2 * x} = ${mu} + ${x} + ${nLam}.`;
    case 3:
      return `Cancel ${mu} + ${x} from each side: ${mu} + ${x} = ${nLam}.`;
    case 4:
      return x === 0
        ? `So ${mu} = ${nLam}: the tortoise entered the cycle exactly as the hare completed a loop — they met on the entrance itself.`
        : `So ${mu} = ${nLam} − ${x} = ${lambda - x}${n > 1 ? ` + ${(n - 1) * lambda}` : ''}. Reset the tortoise to the start and slow the hare to one step: both reach the entrance together.`;
  }
  return '';
}

/**
 * Precompute the full two-phase walk for one chosen entrance.
 *
 * `cycle` is an index into `labels` (the 2021 demo lets the user click any letter
 * except the first or last). Frames:
 *
 *   init · chase×k · meet · derive×5 · regroup · converge×mu · entrance · done
 */
export function floydFrames(labels: string, cycle: number): FloydFramesResult {
  const model = floydModel(labels, cycle);
  const { mu, lambda } = model;
  const entranceNode = cycle;

  const frames: FloydFrame[] = [];

  // ---- phase 1: the chase ----
  let t = 0;
  let h = 0;
  let tortSteps = 0;
  let hareSteps = 0;

  frames.push({
    phase: 'init',
    caption:
      'Both pointers start at the head. Each round the tortoise moves one node, the hare two.',
    hare: 0,
    tort: 0,
    hareSpeed: 2,
    tortSteps: 0,
    hareSteps: 0,
    hareAdvance: 0,
    tortAdvance: 0,
    deriveCase: null,
    met: false,
    meetingNode: -1,
    entranceNode,
  });

  do {
    t = nextNode(t, model);
    h = nextNode(nextNode(h, model), model);
    tortSteps += 1;
    hareSteps += 2;
    const meeting = t === h;
    frames.push({
      phase: meeting ? 'meet' : 'chase',
      caption: meeting
        ? `The pointers land on the same node after the tortoise's ${tortSteps} steps. The hare has taken ${hareSteps}.`
        : `Round ${tortSteps}: tortoise at "${labels[t]}" (node ${t}), hare at "${labels[h]}" (node ${h}).`,
      hare: h,
      tort: t,
      hareSpeed: 2,
      tortSteps,
      hareSteps,
      hareAdvance: 2,
      tortAdvance: 1,
      deriveCase: null,
      met: meeting,
      meetingNode: meeting ? t : -1,
      entranceNode,
    });
  } while (t !== h);

  const meetingNode = t;
  const meetSteps = tortSteps; // k
  const loops = meetSteps / lambda; // n (always integer: k is a multiple of lambda)
  const meetOffset = loops * lambda - mu; // x

  // ---- the five distance-equation frames (2021 track_draw) ----
  for (let c = 0; c < 5; c++) {
    frames.push({
      phase: 'derive',
      caption: deriveCaption(c, mu, lambda, loops, meetOffset),
      hare: meetingNode,
      tort: meetingNode,
      hareSpeed: 1,
      tortSteps: meetSteps,
      hareSteps: 2 * meetSteps,
      hareAdvance: 0,
      tortAdvance: 0,
      deriveCase: c,
      met: true,
      meetingNode,
      entranceNode,
    });
  }

  // ---- phase 2: converge on the entrance ----
  let a = 0;
  let b = meetingNode;
  let steps = 0;

  frames.push({
    phase: 'regroup',
    caption:
      'Send the tortoise back to the head and drop the hare to one step per round. Now advance both together.',
    hare: b,
    tort: a,
    hareSpeed: 1,
    tortSteps: 0,
    hareSteps: 0,
    hareAdvance: 0,
    tortAdvance: 0,
    deriveCase: null,
    met: true,
    meetingNode,
    entranceNode,
  });

  while (a !== b) {
    a = nextNode(a, model);
    b = nextNode(b, model);
    steps += 1;
    const arrived = a === b;
    frames.push({
      phase: arrived ? 'entrance' : 'converge',
      caption: arrived
        ? `Both pointers meet at "${labels[a]}" (node ${a}) after ${steps} steps — the cycle entrance.`
        : `Step ${steps}: tortoise at "${labels[a]}" (node ${a}), hare at "${labels[b]}" (node ${b}).`,
      hare: b,
      tort: a,
      hareSpeed: 1,
      tortSteps: steps,
      hareSteps: steps,
      hareAdvance: 1,
      tortAdvance: 1,
      deriveCase: null,
      met: true,
      meetingNode,
      entranceNode,
    });
  }

  frames.push({
    phase: 'done',
    caption: `Done — the entrance is node ${entranceNode} ("${labels[entranceNode]}"). Pick another entrance or edit the string.`,
    hare: entranceNode,
    tort: entranceNode,
    hareSpeed: 1,
    tortSteps: steps,
    hareSteps: steps,
    hareAdvance: 0,
    tortAdvance: 0,
    deriveCase: null,
    met: true,
    meetingNode,
    entranceNode,
  });

  return {
    ...model,
    meetSteps,
    loops,
    meetOffset,
    meetingNode,
    entranceNode,
    frames,
  };
}
