import { useCallback, useEffect, useState } from 'react';

export interface StepPlayer {
  step: number;
  stepCount: number;
  playing: boolean;
  atStart: boolean;
  atEnd: boolean;
  next: () => void;
  prev: () => void;
  reset: () => void;
  togglePlay: () => void;
  goTo: (step: number) => void;
}

/**
 * Frame-sequence player shared by every algorithm view.
 *
 * Replaces the 2021 nested `setTimeout` / `setInterval` machinery (`run()`,
 * `step(k)`, `tp_move`, `pp_move`, …). Stepping is just `setStep(s ± 1)`;
 * autoplay is a single interval cleaned up on unmount. Backward stepping needs
 * no special logic — `frames[step - 1]` is a complete state.
 *
 * `stepCount` is the number of frames; valid steps are `0 .. stepCount - 1`.
 * When `stepCount` changes (new input) the player resets to 0.
 */
export function useStepPlayer(stepCount: number, intervalMs = 1200): StepPlayer {
  const [step, setStep] = useState(0);
  const [wantPlay, setWantPlay] = useState(false);

  const lastIndex = Math.max(0, stepCount - 1);
  const atStart = step <= 0;
  const atEnd = step >= lastIndex;
  const playing = wantPlay && !atEnd;

  // Reset when the frame sequence changes (React's "adjust state on prop
  // change" pattern — runs during render, not in an effect).
  const [seenCount, setSeenCount] = useState(stepCount);
  if (stepCount !== seenCount) {
    setSeenCount(stepCount);
    setStep(0);
    setWantPlay(false);
  }

  const goTo = useCallback(
    (target: number) => setStep(Math.min(Math.max(target, 0), lastIndex)),
    [lastIndex],
  );
  const next = useCallback(() => goTo(step + 1), [goTo, step]);
  const prev = useCallback(() => goTo(step - 1), [goTo, step]);
  const reset = useCallback(() => {
    setWantPlay(false);
    setStep(0);
  }, []);
  const togglePlay = useCallback(() => {
    if (atEnd) {
      setStep(0);
      setWantPlay(true);
    } else {
      setWantPlay((p) => !p);
    }
  }, [atEnd]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((s) => (s >= lastIndex ? s : s + 1));
    }, intervalMs);
    return () => clearInterval(id);
  }, [playing, lastIndex, intervalMs]);

  return {
    step,
    stepCount,
    playing,
    atStart,
    atEnd,
    next,
    prev,
    reset,
    togglePlay,
    goTo,
  };
}
