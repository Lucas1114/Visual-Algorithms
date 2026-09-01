import { useState } from 'react';
import { AlgorithmLayout } from '../../components/AlgorithmLayout';
import { DEFAULT_CYCLE, DEFAULT_INPUT } from '../../algorithms/floyd';
import { FloydView } from './FloydView';
import './floyd.css';

const MAX_LEN = 16;
const MIN_LEN = 3;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sanitize = (raw: string) =>
  raw
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, MAX_LEN);

/** Random letter string, length 6–12 (2021 `generate_random()` + its slider). */
const randomString = () => {
  const len = 6 + Math.floor(Math.random() * 7);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
};

export function FloydPage() {
  const [draft, setDraft] = useState(DEFAULT_INPUT);
  const [labels, setLabels] = useState<string | null>(DEFAULT_INPUT);
  const [cycle, setCycle] = useState<number | null>(DEFAULT_CYCLE);

  const commit = (value = draft) => {
    if (value.length < MIN_LEN) return;
    setDraft(value);
    setLabels(value);
    setCycle(null);
  };

  return (
    <AlgorithmLayout title="Hare & Tortoise">
      <div className="floyd-page">
        <ol className="floyd-steps">
          <li>
            <span>
              A string of letters — each is a node, and the last one links back
              to the entrance you pick ({MIN_LEN}–{MAX_LEN} letters):
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commit();
              }}
            >
              <input
                aria-label="string"
                value={draft}
                onChange={(e) => setDraft(sanitize(e.target.value))}
                placeholder={DEFAULT_INPUT}
              />
              <button type="submit" disabled={draft.length < MIN_LEN}>
                Build
              </button>
              <button
                type="button"
                className="floyd-random"
                onClick={() => commit(randomString())}
              >
                Random
              </button>
            </form>
          </li>
          <li className={labels ? undefined : 'is-disabled'}>
            <span>
              Click a letter (not the first or last) to make it the cycle
              entrance:
            </span>
            {labels && (
              <div className="floyd-picker">
                {labels.split('').map((ch, i) => {
                  const pickable = i !== 0 && i !== labels.length - 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="floyd-picker__node"
                      aria-current={i === cycle}
                      disabled={!pickable}
                      onClick={() => setCycle(i)}
                    >
                      <span className="floyd-picker__char">{ch}</span>
                      <span className="floyd-picker__idx">{i}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </li>
          <li className={labels && cycle != null ? undefined : 'is-disabled'}>
            <span>
              Step through the two-pointer chase, the meeting, and the walk to
              the entrance.
            </span>
          </li>
        </ol>

        {labels && cycle != null && (
          <FloydView key={`${labels}:${cycle}`} labels={labels} cycle={cycle} />
        )}
      </div>
    </AlgorithmLayout>
  );
}
