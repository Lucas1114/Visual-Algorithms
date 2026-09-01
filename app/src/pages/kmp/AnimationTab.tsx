import { useMemo } from 'react';
import { Arrow } from '../../components/Arrow';
import { Canvas, TabPanel } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { StepController } from '../../components/StepController';
import { useStepPlayer } from '../../components/useStepPlayer';
import {
  DEFAULT_PATTERN,
  DEFAULT_TEXT,
  kmpFrames,
  kmpNext,
  type KmpFrame,
} from '../../algorithms/kmp';
import { cellX, FONT_SIZE, SIDE } from '../../layout';

const LABEL_W = 96;
const IDX_Y = 24;
const TEXT_Y = 96;
const PAT_Y = TEXT_Y + SIDE + 44;
const NEXT_LABEL_Y = PAT_Y + SIDE + 78;
const NEXT_IDX_Y = NEXT_LABEL_Y + 12;
const NEXT_VAL_Y = NEXT_IDX_Y + SIDE + 8;

const strip = (i: number) => LABEL_W + cellX(i);

export function AnimationTab() {
  const text = DEFAULT_TEXT;
  const pattern = DEFAULT_PATTERN;

  const frames = useMemo(() => kmpFrames(text, pattern), [text, pattern]);
  const nxt = useMemo(() => kmpNext(pattern), [pattern]);
  const player = useStepPlayer(frames.length);
  const frame = frames[player.step];

  const width = LABEL_W + (text.length + pattern.length) * SIDE + 24;
  const height = NEXT_VAL_Y + SIDE + 24;

  // On a full match, park the pattern on the match rather than at the next
  // alignment (patternStart has already advanced past it via nxt[m]).
  const patDisplayStart =
    frame.kind === 'found' ? frame.matchStart : frame.patternStart;
  const ppColumn = frame.kind === 'found' ? frame.matchStart : frame.textPos;

  const textFill = (i: number) => {
    if (frame.mismatchPos === i) return 'var(--mismatch-fill)';
    if (i >= frame.matchStart && i < frame.matchEnd) return 'var(--match-fill)';
    return 'var(--cell-fill)';
  };
  const textStroke = (i: number) => {
    if (frame.mismatchPos === i) return 'var(--mismatch)';
    if (i >= frame.matchStart && i < frame.matchEnd) return 'var(--match)';
    return 'var(--cell-stroke)';
  };
  const patFill = (j: number) => {
    if (frame.kind === 'found') return 'var(--match-fill)';
    if (j < frame.patternPos) return 'var(--match-fill)';
    return 'var(--cell-fill)';
  };

  return (
    <TabPanel
      description={
        <>
          <h2>Complete Process</h2>
          <p>
            <strong>TP</strong> is the text pointer, <strong>PP</strong> the
            pattern pointer. Each step is one comparison round: characters are
            matched until a mismatch, then the pattern jumps forward by the
            NEXT table instead of restarting one position to the right.
          </p>
          <p>
            Green cells are the confirmed match for this round. The red cell is
            where the round failed — the next round retries from there with a
            shorter pattern overhang.
          </p>
          <p className="kmp-frame-status">{describe(frame)}</p>
          <StepController player={player} />
        </>
      }
    >
      <Canvas width={width} height={height}>
        {/* row labels */}
        <text x={0} y={TEXT_Y + SIDE / 2} fontSize={FONT_SIZE} dominantBaseline="central">
          Text
        </text>
        <text x={0} y={PAT_Y + SIDE / 2} fontSize={FONT_SIZE} dominantBaseline="central">
          Pattern
        </text>
        <text x={0} y={NEXT_IDX_Y + SIDE / 2} fontSize={16} dominantBaseline="central">
          index
        </text>
        <text x={0} y={NEXT_VAL_Y + SIDE / 2} fontSize={16} dominantBaseline="central">
          NEXT
        </text>

        {/* index numbers above the text row */}
        {text.split('').map((_, i) => (
          <text
            key={`idx-${i}`}
            x={strip(i) + SIDE / 2}
            y={IDX_Y}
            fontSize={14}
            textAnchor="middle"
            opacity={0.6}
          >
            {i}
          </text>
        ))}

        {/* text row */}
        {text.split('').map((c, i) => (
          <Cell
            key={`t-${i}`}
            char={c}
            x={strip(i)}
            y={TEXT_Y}
            fill={textFill(i)}
            stroke={textStroke(i)}
          />
        ))}

        {/* pattern row — slides to its alignment */}
        <g
          className="algo-move"
          style={{ transform: `translateX(${patDisplayStart * SIDE}px)` }}
        >
          {pattern.split('').map((c, j) => (
            <Cell
              key={`p-${j}`}
              char={c}
              x={strip(j)}
              y={PAT_Y}
              fill={patFill(j)}
              stroke={
                frame.kind === 'found' || j < frame.patternPos
                  ? 'var(--match)'
                  : 'var(--cell-stroke)'
              }
            />
          ))}
        </g>

        {/* pointers */}
        <g
          className="algo-move"
          style={{ transform: `translateX(${cellX(frame.textPos)}px)` }}
        >
          <Arrow tipX={LABEL_W + SIDE / 2} tipY={TEXT_Y} direction="down" label="TP" />
        </g>
        <g
          className="algo-move"
          style={{ transform: `translateX(${cellX(ppColumn)}px)` }}
        >
          <Arrow
            tipX={LABEL_W + SIDE / 2}
            tipY={PAT_Y + SIDE}
            direction="up"
            label="PP"
          />
        </g>

        {/* NEXT reference table */}
        {pattern.split('').map((c, i) => (
          <Cell key={`ni-${i}`} char={c} x={strip(i)} y={NEXT_IDX_Y} />
        ))}
        {pattern.split('').map((_, i) => (
          <Cell
            key={`nv-${i}`}
            char={nxt[i]}
            x={strip(i)}
            y={NEXT_VAL_Y}
            fill={
              frame.kind !== 'found' && i === frame.patternPos && frame.patternPos > 0
                ? 'var(--highlight-fill)'
                : 'var(--cell-fill)'
            }
          />
        ))}

        {frame.kind === 'found' && (
          <text
            x={strip(frame.matchStart)}
            y={PAT_Y - 12}
            fontSize={FONT_SIZE}
            fill="var(--match)"
          >
            ✓ match at index {frame.matchStart}
          </text>
        )}
      </Canvas>
    </TabPanel>
  );
}

function describe(frame: KmpFrame): string {
  switch (frame.kind) {
    case 'init':
      return 'Start: pattern aligned at index 0.';
    case 'advance':
      return `Mismatch at the first character — slide the pattern to index ${frame.patternStart}.`;
    case 'backtrack':
      return `Matched ${frame.matchEnd - frame.matchStart} chars, then mismatch at index ${frame.mismatchPos}. Pattern jumps so its length-${frame.patternPos} prefix lines up; retry at index ${frame.textPos}.`;
    case 'found':
      return `Full match found at index ${frame.matchStart}.`;
  }
}
