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

interface Pt {
  x: number;
  y: number;
}

/** Small filled triangle at `tip`, pointing along `from → tip`. */
function ArrowHead({ tip, from }: { tip: Pt; from: Pt }) {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  const s = 6;
  const bx = tip.x - s * ux;
  const by = tip.y - s * uy;
  return (
    <path
      d={`M ${tip.x} ${tip.y} L ${bx - s * 0.5 * uy} ${by + s * 0.5 * ux} L ${
        bx + s * 0.5 * uy
      } ${by - s * 0.5 * ux} Z`}
      stroke="none"
    />
  );
}

/**
 * A bold caption with an underline that runs on into a 45° leader and a small
 * arrow at the target node — so the word never lies across the ring arc and it
 * reads as clearly "this node".
 */
function LeaderLabel({
  text,
  tx,
  ty,
  anchor,
  node,
  nodeR,
  color,
}: {
  text: string;
  tx: number;
  ty: number;
  anchor: 'start' | 'end';
  node: Pt;
  nodeR: number;
  color: string;
}) {
  const FS = 11;
  const w = Math.max(text.length * FS * 0.56, 24);
  const ulY = ty + 3;
  const ulLeft = anchor === 'end' ? tx - w - 2 : tx - 2;
  const ulRight = anchor === 'end' ? tx + 2 : tx + w + 2;

  const nodeIsRight = node.x >= (ulLeft + ulRight) / 2;
  const start: Pt = { x: nodeIsRight ? ulRight : ulLeft, y: ulY };
  const far = nodeIsRight ? ulLeft : ulRight;

  // arrow tip: a small gap off the node edge, on the node → underline line
  const vx = start.x - node.x;
  const vy = start.y - node.y;
  const vlen = Math.hypot(vx, vy) || 1;
  const tip: Pt = {
    x: node.x + (vx / vlen) * (nodeR + 5),
    y: node.y + (vy / vlen) * (nodeR + 5),
  };
  // 45° bend: horizontal along the underline, then a diagonal to the tip
  const diag = Math.abs(start.y - tip.y);
  const bend: Pt = { x: tip.x - Math.sign(tip.x - start.x) * diag, y: start.y };

  return (
    <g
      stroke={color}
      fill={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <text
        x={tx}
        y={ty}
        fontSize={FS}
        fontWeight={700}
        textAnchor={anchor}
        stroke="none"
      >
        {text}
      </text>
      <polyline
        points={`${far},${ulY} ${bend.x},${bend.y} ${tip.x},${tip.y}`}
        fill="none"
        strokeWidth={1.2}
      />
      <ArrowHead tip={tip} from={bend} />
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

/** Anchor for the "meeting" label — radially past the node, clear of the hare
 * lane, clamped to stay inside the canvas with room for the underline. */
function labelOut(i: number, mu: number, lambda: number) {
  const a = cycleAngle(i, mu, lambda);
  const r = RING_R + 58;
  const x = Math.min(Math.max(RING_CX - r * Math.cos(a), 60), VIEW_W - 60);
  const y = Math.min(Math.max(RING_CY - r * Math.sin(a), 22), VIEW_H - 14);
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

        {/* entrance flag — down-left of the ring's left point, clear of the arc */}
        <LeaderLabel
          text="entrance"
          tx={RING_CX - RING_R - 44}
          ty={RING_CY + 44}
          anchor="end"
          node={{ x: RING_CX - RING_R, y: RING_CY }}
          nodeR={NODE_R}
          color="var(--match)"
        />
        {frame.met &&
          meetingNode !== entranceNode &&
          (() => {
            const mn = nodePos(meetingNode, mu, lambda);
            const lo = labelOut(meetingNode, mu, lambda);
            const anchor = lo.x < mn.x ? 'end' : 'start';
            return (
              <LeaderLabel
                text="meeting"
                tx={lo.x}
                ty={lo.y}
                anchor={anchor}
                node={mn}
                nodeR={NODE_R}
                color="var(--tab-active)"
              />
            );
          })()}

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
