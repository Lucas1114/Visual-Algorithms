import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '../../components/AlgorithmLayout';
import { StepController } from '../../components/StepController';
import { useStepPlayer } from '../../components/useStepPlayer';
import { floydFrames, type FloydFrame } from '../../algorithms/floyd';
import {
  cycleAngle,
  nodePos,
  ringArcPath,
  RING_CX,
  RING_CY,
  RING_R,
  TAIL_SPAN,
  TAIL_X0,
  VIEW_H,
  VIEW_W,
} from './geometry';
import { PointerMarker, type Move } from './PointerMarker';
import { TrackDerivation } from './TrackDerivation';

/** "entrance" label, parked down and left of the ring's left point (clear of
 * the arc that runs through a label placed straight below it) with a short
 * arrow leading back to the node. */
function EntranceFlag({ r }: { r: number }) {
  const nodeX = RING_CX - RING_R;
  const nodeY = RING_CY;
  const tip = { x: nodeX - 4, y: nodeY + r + 3 };
  const tail = { x: nodeX - 42, y: nodeY + 44 };
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = 6;
  return (
    <g stroke="var(--match)" fill="var(--match)">
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} strokeWidth={1} />
      <path
        d={`M ${tip.x} ${tip.y} L ${tip.x - head * ux + head * 0.6 * -uy} ${
          tip.y - head * uy + head * 0.6 * ux
        } L ${tip.x - head * ux - head * 0.6 * -uy} ${
          tip.y - head * uy - head * 0.6 * ux
        } Z`}
        stroke="none"
      />
      <text
        x={tail.x + 2}
        y={tail.y + 4}
        fontSize={11}
        textAnchor="end"
        stroke="none"
      >
        entrance
      </text>
    </g>
  );
}

const NODE_R_MAX = 15;

/** Node radius shrinks when the tail or the ring gets crowded, so a long
 * string's circles don't pile on top of each other. */
function nodeRadius(mu: number, lambda: number) {
  const gap = Math.min(
    mu > 0 ? TAIL_SPAN / mu : Infinity,
    lambda > 0 ? (2 * Math.PI * RING_R) / lambda : Infinity,
  );
  return Math.max(10, Math.min(NODE_R_MAX, gap / 2 - 2));
}

/** A caption anchor well clear of the hare lane, radially past a ring node,
 * clamped to stay inside the canvas. */
function labelOut(i: number, mu: number, lambda: number) {
  const a = cycleAngle(i, mu, lambda);
  const r = RING_R + 80;
  const x = Math.min(Math.max(RING_CX - r * Math.cos(a), 40), VIEW_W - 40);
  const y = Math.min(Math.max(RING_CY - r * Math.sin(a), 14), VIEW_H - 6);
  return { x, y };
}

export function FloydView({
  labels,
  cycle,
}: {
  labels: string;
  cycle: number;
}) {
  const run = useMemo(() => floydFrames(labels, cycle), [labels, cycle]);
  const player = useStepPlayer(run.frames.length, 1200);
  const frame = run.frames[player.step];

  const { mu, lambda, lens, meetingNode, entranceNode, loops, meetOffset } = run;

  // A Next / Prev turns into a hop for each marker to animate; computed in an
  // effect (from the step we last saw) so the ring animation fires once per step.
  const seenStep = useRef(player.step);
  const [moves, setMoves] = useState<{ hare: Move | null; tort: Move | null }>({
    hare: null,
    tort: null,
  });

  useEffect(() => {
    const delta = player.step - seenStep.current;
    seenStep.current = player.step;
    if (Math.abs(delta) !== 1) {
      setMoves({ hare: null, tort: null }); // reset / jump → snap
      return;
    }
    const leaving = run.frames[player.step - delta];
    const arriving = run.frames[player.step];
    const entered = delta > 0 ? arriving : leaving;
    const hop = (lane: 'hare' | 'tort'): Move | null => {
      const hops = lane === 'hare' ? entered.hareAdvance : entered.tortAdvance;
      if (hops < 1) return null;
      const at = (f: FloydFrame) => (lane === 'hare' ? f.hare : f.tort);
      return delta > 0
        ? { from: at(leaving), to: at(arriving), hops, reverse: false, token: player.step }
        : { from: at(arriving), to: at(leaving), hops, reverse: true, token: player.step };
    };
    setMoves({ hare: hop('hare'), tort: hop('tort') });
  }, [player.step, run.frames]);

  const inDerive = frame.deriveCase != null;
  const showRest = inDerive && (frame.deriveCase as number) >= 1;

  // The distance-identity panel keeps building through the derive frames, then
  // stays on screen (fully expanded) while the regroup / converge animation
  // plays out — viewers reaching the diagram late still want the legend. It
  // clears only on Reset (step 0).
  const derivePanelCase = Math.max(
    -1,
    ...run.frames.slice(0, player.step + 1).map((f) => f.deriveCase ?? -1),
  );

  const nodes = Array.from({ length: lens }, (_, i) => i);
  const NODE_R = nodeRadius(mu, lambda);

  return (
    <div className="floyd-view">
      <Canvas width={VIEW_W} height={VIEW_H}>
        {/* tail spine */}
        <line
          x1={TAIL_X0}
          y1={RING_CY}
          x2={RING_CX - RING_R}
          y2={RING_CY}
          stroke="var(--cell-stroke)"
          strokeWidth={3}
        />
        {/* cycle ring */}
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke="var(--cell-stroke)"
          strokeWidth={3}
        />

        {/* derivation: highlight the tail and the two cycle arcs */}
        {inDerive && (
          <>
            <line
              x1={TAIL_X0}
              y1={RING_CY}
              x2={RING_CX - RING_R}
              y2={RING_CY}
              stroke="var(--floyd-tail)"
              strokeWidth={6}
              strokeLinecap="round"
            />
            {meetOffset === 0 ? (
              // x collapsed to a point: mark the entrance with a solid dot
              <circle
                cx={nodePos(entranceNode, mu, lambda).x}
                cy={nodePos(entranceNode, mu, lambda).y}
                r={6}
                fill="var(--floyd-arc-x)"
                stroke="var(--panel-bg)"
                strokeWidth={1.5}
              />
            ) : (
              <path
                d={ringArcPath(entranceNode, meetingNode, mu, lambda)}
                fill="none"
                stroke="var(--floyd-arc-x)"
                strokeWidth={6}
                strokeLinecap="round"
              />
            )}
            {showRest &&
              (meetOffset === 0 ? (
                // λ − x is the whole loop
                <circle
                  cx={RING_CX}
                  cy={RING_CY}
                  r={RING_R}
                  fill="none"
                  stroke="var(--floyd-arc-rest)"
                  strokeWidth={6}
                  strokeDasharray="2,8"
                />
              ) : (
                <path
                  d={ringArcPath(meetingNode, entranceNode, mu, lambda)}
                  fill="none"
                  stroke="var(--floyd-arc-rest)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray="2,8"
                />
              ))}
          </>
        )}

        {/* nodes — the circle is split in half: letter on top, index below, so
            neither the moving pointers nor the ring arc can ever hide the
            index (the 2021 build kept the index in a floating label and it got
            covered). */}
        {nodes.map((i) => {
          const p = nodePos(i, mu, lambda);
          const isEntrance = i === entranceNode;
          const isMeeting = frame.met && i === meetingNode;
          const stroke = isMeeting
            ? 'var(--tab-active)'
            : isEntrance
              ? 'var(--match)'
              : 'var(--cell-stroke)';
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={NODE_R}
                fill={
                  isMeeting
                    ? 'var(--highlight-fill)'
                    : isEntrance
                      ? 'var(--match-fill)'
                      : 'var(--cell-fill)'
                }
                stroke={stroke}
                strokeWidth={2}
              />
              <line
                x1={p.x - NODE_R}
                y1={p.y}
                x2={p.x + NODE_R}
                y2={p.y}
                stroke={stroke}
                strokeWidth={1}
              />
              <text
                x={p.x}
                y={p.y - NODE_R * 0.42}
                fontSize={Math.max(9, NODE_R * 0.92)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--cell-text)"
              >
                {labels[i]}
              </text>
              <text
                x={p.x}
                y={p.y + NODE_R * 0.46}
                fontSize={Math.max(7, NODE_R * 0.62)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--cell-text)"
                opacity={0.6}
              >
                {i}
              </text>
            </g>
          );
        })}

        {/* entrance flag — pulled down-left so it clears the ring arc, with a
            thin leader arrow back to the entrance node */}
        <EntranceFlag r={NODE_R} />
        {frame.met && meetingNode !== entranceNode && (
          <g fill="var(--tab-active)" stroke="var(--tab-active)">
            <line
              x1={nodePos(meetingNode, mu, lambda).x}
              y1={nodePos(meetingNode, mu, lambda).y}
              x2={labelOut(meetingNode, mu, lambda).x}
              y2={labelOut(meetingNode, mu, lambda).y}
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />
            <text
              x={labelOut(meetingNode, mu, lambda).x}
              y={labelOut(meetingNode, mu, lambda).y}
              fontSize={11}
              textAnchor="middle"
              dominantBaseline="central"
              stroke="none"
            >
              meeting
            </text>
          </g>
        )}

        {/* pointers — animate along the ring, not in a straight chord */}
        <PointerMarker
          node={frame.tort}
          move={moves.tort}
          mu={mu}
          lambda={lambda}
          lane="tort"
          label="T"
        />
        <PointerMarker
          node={frame.hare}
          move={moves.hare}
          mu={mu}
          lambda={lambda}
          lane="hare"
          label="H"
        />
      </Canvas>

      {/* On a wide screen this column sits beside the canvas so the diagram,
          caption and step buttons are all on screen at once. */}
      <div className="floyd-panel">
        <div className="floyd-readout">
          <span>
            <span className="floyd-dot floyd-dot--tort" />{' '}
            <strong>Tortoise</strong> {frame.tortSteps} step
            {frame.tortSteps === 1 ? '' : 's'}
          </span>
          <span>
            <span className="floyd-dot floyd-dot--hare" /> <strong>Hare</strong>{' '}
            {frame.hareSteps} step{frame.hareSteps === 1 ? '' : 's'} (×
            {frame.hareSpeed})
          </span>
        </div>

        <p className="floyd-caption">{frame.caption}</p>

        {/* Controls stay put — the derivation panel grows *below* them so the
            button row never shifts as more equation rows appear. */}
        <StepController player={player} />

        {derivePanelCase >= 0 && (
          <TrackDerivation
            deriveCase={derivePanelCase}
            mu={mu}
            lambda={lambda}
            loops={loops}
            offset={meetOffset}
          />
        )}
      </div>
    </div>
  );
}
