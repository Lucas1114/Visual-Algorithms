import type { StepPlayer } from './useStepPlayer';

/**
 * Transport controls for a {@link StepPlayer}: reset · prev · play/pause · next,
 * plus a step counter. Presentational only — all state lives in the hook.
 * Replaces the hand-wired `Animation` / `Run` buttons in the 2021 HTML.
 */
export function StepController({
  player,
  className,
  attention = false,
  onAction,
}: {
  player: StepPlayer;
  className?: string;
  /** Draw the eye to the controls until they're first used. */
  attention?: boolean;
  /** Fires once on the first button press (any of them). */
  onAction?: () => void;
}) {
  const { step, stepCount, playing, atStart, atEnd } = player;

  return (
    <div
      className={['step-controller', attention && 'step-controller--attention', className]
        .filter(Boolean)
        .join(' ')}
      onClickCapture={onAction}
    >
      <button type="button" onClick={player.reset} disabled={atStart && !playing}>
        Reset
      </button>
      <button type="button" onClick={player.prev} disabled={atStart}>
        Prev
      </button>
      <button type="button" onClick={player.togglePlay} disabled={atEnd}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={player.next} disabled={atEnd}>
        Next
      </button>
      <span className="step-controller__count">
        {stepCount > 0 ? `${step + 1} / ${stepCount}` : '0 / 0'}
      </span>
    </div>
  );
}
