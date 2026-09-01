import { Canvas, TabPanel } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { cellX, FONT_SIZE, rowY, SIDE } from '../../layout';

/** The partially matched fragment carried over from the Introduction example. */
const FRAGMENT = 'abaab';

export function PreSuffixTab() {
  const s = FRAGMENT;
  const n = s.length;
  const pairs = Array.from({ length: n - 1 }, (_, k) => {
    const len = k + 1;
    const prefix = s.slice(0, len);
    const suffix = s.slice(n - len);
    return { len, prefix, suffix, identical: prefix === suffix };
  });
  const longest = pairs.filter((p) => p.identical).at(-1)?.len ?? 0;

  const colW = cellX(n) + 40;
  const width = 60 + colW * 2 + 40;
  const height = rowY(n) + 40;

  return (
    <TabPanel
      description={
        <>
          <h2>Prefix and Suffix</h2>
          <p>
            Take the matched fragment <code>{FRAGMENT}</code> from the previous
            section. A string of <em>N</em> letters has <em>N−1</em> proper
            prefixes and <em>N−1</em> proper suffixes.
          </p>
          <p>
            Pair each prefix with the suffix of the same length. The longest
            pair that is <strong>identical</strong> is <code>ab</code> (length{' '}
            {longest}). That is exactly how far KMP can safely slide the pattern
            after this fragment matches — skipping{' '}
            {n - 1 - longest} doomed comparisons.
          </p>
        </>
      }
    >
      <Canvas width={width} height={height}>
        <text x={60} y={rowY(0) - 6} fontSize={16}>
          Prefix
        </text>
        <text x={60 + colW} y={rowY(0) - 6} fontSize={16}>
          Suffix
        </text>

        {pairs.map((pair, row) => {
          const y = rowY(row + 1) - SIDE / 2;
          const stroke = pair.identical ? 'var(--match)' : 'var(--cell-stroke)';
          const fill = pair.identical
            ? 'var(--match-fill)'
            : 'var(--cell-fill)';
          return (
            <g key={pair.len}>
              <text x={0} y={y + SIDE / 2} fontSize={16} dominantBaseline="central">
                len {pair.len}
              </text>
              {pair.prefix.split('').map((c, i) => (
                <Cell key={`p-${i}`} char={c} x={60 + cellX(i)} y={y} fill={fill} stroke={stroke} />
              ))}
              {pair.suffix.split('').map((c, i) => (
                <Cell
                  key={`s-${i}`}
                  char={c}
                  x={60 + colW + cellX(i)}
                  y={y}
                  fill={fill}
                  stroke={stroke}
                />
              ))}
              {pair.identical && (
                <text
                  x={60 + colW - 24}
                  y={y + SIDE / 2}
                  fontSize={FONT_SIZE}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--match)"
                >
                  =
                </text>
              )}
            </g>
          );
        })}
      </Canvas>
    </TabPanel>
  );
}
