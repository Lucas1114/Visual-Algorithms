import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/** Whatever the pre-paint script in index.html decided. */
function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

/**
 * Fixed sun / moon switch shown on every page. The initial theme comes from the
 * OS (or a saved choice) — see the inline script in `index.html` — so both
 * schemes still work automatically until the visitor picks one.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // keep following the OS until a choice is stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      let chosen = false;
      try {
        chosen = Boolean(localStorage.getItem('theme'));
      } catch {
        /* storage unavailable — treat as unchosen */
      }
      if (!chosen) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
