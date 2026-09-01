import { useMemo, useState } from 'react';
import { Canvas, TabPanel } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { DEFAULT_PATTERN, kmpNext, kmpPmt } from '../../algorithms/kmp';
import { cellX, FONT_SIZE, rowY, SIDE } from '../../layout';

const LABEL_W = 30;

export function PmtTab() {
  const pattern = DEFAULT_PATTERN;
  const pmt = useMemo(() => kmpPmt(pattern), [pattern]);
  const nxt = useMemo(() => kmpNext(pattern), [pattern]);
  const [showShift, setShowShift] = useState(false);

  const m = pattern.length;
  const matrixH = rowY(m);
  const shiftTop = matrixH + 40;
  const width = LABEL_W + cellX(m) + 140;
  const height = showShift ? shiftTop + rowY(3) + 20 : matrixH + 20;

  return (
    <TabPanel
      description={
        <>
          <h2>Partial Match Table (PMT)</h2>
          <p>
            Row <em>i</em> is the prefix <code>{pattern}</code>[0..i]. The green
            cells are its longest border — the longest proper prefix that is
            also a suffix. Its length is the PMT value on the right.
          </p>
          <p>
            To make the matching code simpler the demo actually uses{' '}
            <strong>NEXT</strong>: the PMT shifted one place right with{' '}
            <code>-1</code> in front.
          </p>
          <button type="button" onClick={() => setShowShift((s) => !s)}>
            {showShift ? 'Hide' : 'Show'} PMT → NEXT
          </button>
        </>
      }
    >
      <Canvas width={width} height={height}>
        {pattern.split('').map((_, i) => {
          const y = rowY(i);
          const border = pmt[i];
          return (
            <g key={`row-${i}`}>
              {pattern.split('').map((c, j) => {
                const inPrefix = j <= i;
                const inBorder =
                  inPrefix && (j < border || j > i - border);
                return (
                  <Cell
                    key={j}
                    char={c}
                    x={LABEL_W + cellX(j)}
                    y={y}
                    dashed={!inPrefix}
                    faded={!inPrefix}
                    fill={inBorder ? 'var(--match-fill)' : 'var(--cell-fill)'}
                    stroke={inBorder ? 'var(--match)' : 'var(--cell-stroke)'}
                  />
                );
              })}
              <text
                x={LABEL_W + cellX(m) + 24}
                y={y + SIDE / 2}
                fontSize={FONT_SIZE}
                dominantBaseline="central"
              >
                PMT[{i}] = {border}
              </text>
            </g>
          );
        })}

        {showShift && (
          <g transform={`translate(0 ${shiftTop})`}>
            {(
              [
                ['Pattern', pattern.split('')],
                ['PMT', pmt],
                ['NEXT', nxt.slice(0, m)],
              ] as const
            ).map(([label, values], row) => (
              <g key={label} transform={`translate(0 ${rowY(row)})`}>
                <text x={0} y={SIDE / 2} fontSize={16} dominantBaseline="central">
                  {label}
                </text>
                {values.map((v, i) => (
                  <Cell
                    key={i}
                    char={v}
                    x={LABEL_W + 40 + cellX(i)}
                    y={0}
                    fill={
                      label === 'NEXT' && i === 0
                        ? 'var(--highlight-fill)'
                        : 'var(--cell-fill)'
                    }
                  />
                ))}
              </g>
            ))}
          </g>
        )}
      </Canvas>
    </TabPanel>
  );
}
