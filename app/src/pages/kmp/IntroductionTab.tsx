import { useMemo } from 'react';
import { Canvas, TabPanel } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { StepController } from '../../components/StepController';
import { useStepPlayer } from '../../components/useStepPlayer';
import { DEFAULT_PATTERN, DEFAULT_TEXT } from '../../algorithms/kmp';
import { cellX, FONT_SIZE, rowY, SIDE } from '../../layout';

const LABEL_W = 110;

interface BruteFrame {
  start: number;
  matchedLen: number;
  matched: boolean;
}

/** Every alignment the naive "compare each substring" scan tries. */
function bruteForceFrames(text: string, pattern: string): BruteFrame[] {
  const frames: BruteFrame[] = [];
  for (let start = 0; start + pattern.length <= text.length; start += 1) {
    let matchedLen = 0;
    while (
      matchedLen < pattern.length &&
      text[start + matchedLen] === pattern[matchedLen]
    ) {
      matchedLen += 1;
    }
    frames.push({
      start,
      matchedLen,
      matched: matchedLen === pattern.length,
    });
  }
  return frames;
}

export function IntroductionTab() {
  const text = DEFAULT_TEXT;
  const pattern = DEFAULT_PATTERN;
  const frames = useMemo(() => bruteForceFrames(text, pattern), [text, pattern]);
  const player = useStepPlayer(frames.length);
  const frame = frames[player.step];

  const width = LABEL_W + cellX(text.length) + 24;
  const height = rowY(3) + 20;

  return (
    <TabPanel
      description={
        <>
          <h2>Knuth–Morris–Pratt (KMP)</h2>
          <p>
            KMP finds every occurrence of a pattern string inside a text string.
            Here the text is <code>{text}</code> and the pattern is{' '}
            <code>{pattern}</code>.
          </p>
          <p>
            The naive approach compares the pattern against every substring of
            the text. Step through it below: green is a matching prefix, red is
            the first mismatch. Notice how often a long matched prefix is thrown
            away and the pattern restarts just one position later — that is the
            waste KMP removes.
          </p>
          <p className="kmp-frame-status">
            Alignment at index {frame.start}:{' '}
            {frame.matched
              ? 'full match!'
              : `${frame.matchedLen} char(s) matched, mismatch at index ${
                  frame.start + frame.matchedLen
                }.`}
          </p>
          <StepController player={player} />
        </>
      }
    >
      <Canvas width={width} height={height}>
        <text x={0} y={rowY(0) + SIDE / 2} fontSize={16} dominantBaseline="central">
          index
        </text>
        <text x={0} y={rowY(1) + SIDE / 2} fontSize={FONT_SIZE} dominantBaseline="central">
          Text
        </text>
        <text x={0} y={rowY(2) + SIDE / 2} fontSize={FONT_SIZE} dominantBaseline="central">
          Pattern
        </text>

        {text.split('').map((_, i) => (
          <text
            key={`i-${i}`}
            x={LABEL_W + cellX(i) + SIDE / 2}
            y={rowY(0) + SIDE / 2}
            fontSize={14}
            textAnchor="middle"
            opacity={0.6}
          >
            {i}
          </text>
        ))}

        {text.split('').map((c, i) => {
          const rel = i - frame.start;
          const inWindow = rel >= 0 && rel < pattern.length;
          const isMatch = inWindow && rel < frame.matchedLen;
          const isMiss = inWindow && rel === frame.matchedLen && !frame.matched;
          return (
            <Cell
              key={`t-${i}`}
              char={c}
              x={LABEL_W + cellX(i)}
              y={rowY(1)}
              faded={!inWindow}
              fill={
                isMatch
                  ? 'var(--match-fill)'
                  : isMiss
                    ? 'var(--mismatch-fill)'
                    : 'var(--cell-fill)'
              }
              stroke={
                isMatch
                  ? 'var(--match)'
                  : isMiss
                    ? 'var(--mismatch)'
                    : 'var(--cell-stroke)'
              }
            />
          );
        })}

        <g
          className="algo-move"
          style={{ transform: `translateX(${cellX(frame.start)}px)` }}
        >
          {pattern.split('').map((c, j) => {
            const isMatch = j < frame.matchedLen;
            const isMiss = j === frame.matchedLen && !frame.matched;
            return (
              <Cell
                key={`p-${j}`}
                char={c}
                x={LABEL_W + cellX(j)}
                y={rowY(2)}
                fill={
                  isMatch
                    ? 'var(--match-fill)'
                    : isMiss
                      ? 'var(--mismatch-fill)'
                      : 'var(--cell-fill)'
                }
                stroke={
                  isMatch
                    ? 'var(--match)'
                    : isMiss
                      ? 'var(--mismatch)'
                      : 'var(--cell-stroke)'
                }
              />
            );
          })}
        </g>
      </Canvas>
    </TabPanel>
  );
}
