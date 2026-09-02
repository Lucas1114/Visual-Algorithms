import type { StepPlayer } from './useStepPlayer';

/**
 * Transport controls for a {@link StepPlayer}: reset · prev · play/pause · next,
 * plus a step counter. Presentational only — all state lives in the hook.
 * Replaces the hand-wired `Animation` / `Run` buttons in the 2021 HTML.
 */
export function StepController({
  player,
  className,
}: {
  player: StepPlayer;
  className?: string;
}) {
  const { step, stepCount, playing, atStart, atEnd } = player;

  return (
    <div className={['step-controller', className].filter(Boolean).join(' ')}>
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
