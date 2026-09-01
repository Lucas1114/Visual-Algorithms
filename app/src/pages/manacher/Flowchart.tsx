/**
 * Data-driven redraw of the 2021 `draw_flowchart()` (Manachar.js L1201-1262).
 *
 * The original hand-placed 27 `<rect>` blocks and a tangle of `direction()`
 * arrows with magic-number coordinates, then toggled them with `fc_track` /
 * `fc_process` / `di_process`. Here every node is one fixed-size box on a
 * three-column grid, edges are orthogonal connectors, and the active set for a
 * frame comes straight off `ManacherFrame.flowNodes` / `.flowEdges`.
 */

const NODE_W = 220;
const NODE_H = 54;

const COL = { L: 30, M: 300, R: 570 } as const;
const ROW = [20, 120, 214, 308, 402, 496, 590, 684] as const;

const VIEW_W = COL.R + NODE_W + 30;
const VIEW_H = ROW[7] + NODE_H + 24;

interface FlowNode {
  id: string;
  x: number;
  y: number;
  text: string;
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

// Left column = the "outside the border" fast path; middle column = the mirror
// construction spine; right column = the branch that needs no expansion.
const NODES: FlowNode[] = [
  { id: 'A', x: COL.M, y: ROW[0], text: 'Inside the rightmost known border?' },
  { id: 'C', x: COL.L, y: ROW[1], text: 'Outside → radius is 1' },
  {
    id: 'E',
    x: COL.M,
    y: ROW[1],
    text: 'Palindrome 2: centred at C, owns the border',
  },
  {
    id: 'D',
    x: COL.R,
    y: ROW[1],
    text: 'Palindrome 1: centred at the mirror M',
  },
  { id: 'F', x: COL.M, y: ROW[2], text: 'Palindrome 3 = 1 ∩ 2, centred at M' },
  {
    id: 'G',
    x: COL.M,
    y: ROW[3],
    text: 'Flip palindrome 3 around C → palindrome 4',
  },
  {
    id: 'H',
    x: COL.M,
    y: ROW[4],
    text: 'Palindromes 1 and 2 share a left border',
  },
  { id: 'I', x: COL.R, y: ROW[4], text: 'One left border is strictly closer' },
  {
    id: 'J',
    x: COL.M,
    y: ROW[5],
    text: 'Radius ≥ palindrome 4 → expand outward',
  },
  { id: 'K', x: COL.R, y: ROW[5], text: 'Radius = palindrome 4 exactly' },
  { id: 'L', x: COL.L, y: ROW[6], text: 'Scan outward until a mismatch' },
  {
    id: 'M',
    x: COL.M,
    y: ROW[7],
    text: 'Extend the border if it reaches further',
  },
  {
    id: 'N',
    x: COL.R,
    y: ROW[6],
    text: 'Reflecting C→M→C forces S[next_l] ≠ S[next_r]',
  },
];

const EDGES: FlowEdge[] = [
  { id: 'A-yes', from: 'A', to: 'E', label: 'inside' },
  { id: 'A-no', from: 'A', to: 'C', label: 'outside' },
  { id: 'E-D', from: 'E', to: 'D' },
  { id: 'E-F', from: 'E', to: 'F' },
  { id: 'D-F', from: 'D', to: 'F' },
  { id: 'F-G', from: 'F', to: 'G' },
  { id: 'G-H', from: 'G', to: 'H' },
  { id: 'G-I', from: 'G', to: 'I' },
  { id: 'H-J', from: 'H', to: 'J' },
  { id: 'I-K', from: 'I', to: 'K' },
  { id: 'J-L', from: 'J', to: 'L' },
  { id: 'C-L', from: 'C', to: 'L' },
  { id: 'L-M', from: 'L', to: 'M' },
  { id: 'K-M', from: 'K', to: 'M' },
  { id: 'K-N', from: 'K', to: 'N' },
];

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

const cx = (n: FlowNode) => n.x + NODE_W / 2;
const cy = (n: FlowNode) => n.y + NODE_H / 2;

/**
 * Orthogonal connector between two boxes: a straight line when they share a
 * column or a row, otherwise a Z-bend (down, across at the midpoint, down).
 */
function edgePath(
  from: FlowNode,
  to: FlowNode,
): { d: string; lx: number; ly: number } {
  const sameCol = Math.abs(cx(from) - cx(to)) < 4;
  const sameRow = Math.abs(cy(from) - cy(to)) < 4;

  if (sameRow) {
    const leftToRight = cx(from) < cx(to);
    const ax = leftToRight ? from.x + NODE_W : from.x;
    const bx = leftToRight ? to.x : to.x + NODE_W;
    const y = cy(from);
    return { d: `M ${ax} ${y} L ${bx} ${y}`, lx: (ax + bx) / 2, ly: y - 6 };
  }

  const ax = cx(from);
  const bx = cx(to);
  const ay = from.y + NODE_H;
  const by = to.y;

  if (sameCol) {
    return { d: `M ${ax} ${ay} L ${bx} ${by}`, lx: ax + 8, ly: (ay + by) / 2 };
  }

  const my = (ay + by) / 2;
  return {
    d: `M ${ax} ${ay} L ${ax} ${my} L ${bx} ${my} L ${bx} ${by}`,
    lx: (ax + bx) / 2,
    ly: my - 6,
  };
}

function wrapText(text: string, max = 26): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function Flowchart({
  activeNodes,
  activeEdges,
}: {
  activeNodes: readonly string[];
  activeEdges: readonly string[];
}) {
  const nodeSet = new Set(activeNodes);
  const edgeSet = new Set(activeEdges);

  return (
    <svg
      className="manacher-flow"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMinYMin meet"
      role="img"
      aria-label="Manacher decision flow chart"
    >
      <defs>
        {/* userSpaceOnUse: the arrowhead is a fixed size, so the thicker active
            stroke does not also inflate it (which collided with the bends). */}
        <marker
          id="mn-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--flow-edge-active)" />
        </marker>
        <marker
          id="mn-arrow-dim"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--flow-edge)" />
        </marker>
        <filter
          id="mn-node-shadow"
          x="-10%"
          y="-20%"
          width="120%"
          height="150%"
        >
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.4"
            floodColor="#000"
            floodOpacity="0.16"
          />
        </filter>
      </defs>

      {EDGES.map((edge) => {
        const from = NODE_BY_ID.get(edge.from)!;
        const to = NODE_BY_ID.get(edge.to)!;
        const { d, lx, ly } = edgePath(from, to);
        const on = edgeSet.has(edge.id);
        return (
          <g key={edge.id}>
            <path
              d={d}
              fill="none"
              stroke={on ? 'var(--flow-edge-active)' : 'var(--flow-edge)'}
              strokeWidth={on ? 3 : 1.8}
              markerEnd={on ? 'url(#mn-arrow)' : 'url(#mn-arrow-dim)'}
            />
            {edge.label && (
              <text
                x={lx}
                y={ly}
                fontSize={13}
                fontWeight={600}
                fill={on ? 'var(--flow-edge-active)' : 'var(--flow-edge)'}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {NODES.map((node) => {
        const on = nodeSet.has(node.id);
        const lines = wrapText(node.text);
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              filter={on ? undefined : 'url(#mn-node-shadow)'}
              fill={
                on ? 'var(--flow-node-active-fill)' : 'var(--flow-node-fill)'
              }
              stroke={on ? 'var(--flow-node-active)' : 'var(--flow-node)'}
              strokeWidth={on ? 2.5 : 1.6}
            />
            <text
              x={cx(node)}
              y={cy(node) - (lines.length - 1) * 8 + 1}
              fontSize={13.5}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
              fill={
                on ? 'var(--flow-node-active-text)' : 'var(--flow-node-text)'
              }
            >
              {lines.map((ln, i) => (
                <tspan key={i} x={cx(node)} dy={i === 0 ? 0 : 16}>
                  {ln}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
