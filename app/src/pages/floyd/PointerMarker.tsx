import { useEffect, useRef } from 'react';
import { motionSamples, pointerPos } from './geometry';

const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export interface Move {
  /** Node the pointer starts the hop from. */
  from: number;
  /** Node it lands on (may equal `from` for a full lap). */
  to: number;
  /** Forward successor hops taken — drives a full lap even when `from === to`. */
  hops: number;
  /** Play the samples in reverse (a backward / Prev step). */
  reverse: boolean;
  /** Changes every step so the animation re-fires even on an identical hop. */
  token: number;
}

/**
 * The hare / tortoise dot. Rests at its current node; on a step it animates
 * there **along the ring** (via {@link motionSamples}) rather than cutting a
 * straight chord. A two-step hare hop on a `λ = 2` cycle lands back where it
 * started — it still plays a full lap instead of sitting frozen.
 *
 * The move is a Web Animations API keyframe run, not a per-frame timer (the 2021
 * `pointer_move()` setInterval); it cancels itself if the step changes again
 * mid-flight.
 */
export function PointerMarker({
  node,
  move,
  mu,
  lambda,
  lane,
  label,
}: {
  node: number;
  move: Move | null;
  mu: number;
  lambda: number;
  lane: 'hare' | 'tort';
  label: string;
}) {
  const ref = useRef<SVGGElement>(null);
  const here = pointerPos(node, mu, lambda, lane);

  useEffect(() => {
    const el = ref.current;
    if (!el || !move || move.hops < 1 || REDUCED()) return;

    let pts = motionSamples(move.from, move.to, move.hops, mu, lambda, lane);
    if (move.reverse) pts = pts.slice().reverse();
    if (pts.length < 2) return;

    const anim = el.animate(
      pts.map((p) => ({ transform: `translate(${p.x}px, ${p.y}px)` })),
      { duration: 460, easing: 'ease-in-out' },
    );
    return () => anim.cancel();
    // token changes every step, so an identical consecutive hop still replays
  }, [move?.token, move, mu, lambda, lane]);

  const color = lane === 'hare' ? 'var(--floyd-hare)' : 'var(--floyd-tort)';
  return (
    <g ref={ref} style={{ transform: `translate(${here.x}px, ${here.y}px)` }}>
      <circle r={12} fill={color} stroke="var(--cell-stroke)" />
      <text
        fontSize={12}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
      >
        {label}
      </text>
    </g>
  );
}
