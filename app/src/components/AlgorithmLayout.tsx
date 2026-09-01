import type { ReactNode } from 'react';
import './algorithm.css';

export interface TabDef {
  id: string;
  label: string;
}

/**
 * Page frame shared by every algorithm: a title, a tab rail, and a content
 * area. Replaces the 2021 `build_button()` / `click()` pair (~110 lines of
 * hand-rolled hover and selected-state SVG) with a plain button group styled
 * in CSS.
 */
export function AlgorithmLayout({
  title,
  tabs = [],
  activeTab = '',
  onTabChange,
  children,
}: {
  title: string;
  tabs?: readonly TabDef[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children: ReactNode;
}) {
  const hasTabs = tabs.length > 0;
  return (
    <div className={hasTabs ? 'algo' : 'algo algo--notabs'}>
      <header className="algo__header">
        <h1>{title}</h1>
      </header>
      {hasTabs && (
        <nav className="algo__tabs" aria-label={`${title} sections`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="algo__tab"
              aria-current={tab.id === activeTab}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
      <div className="algo__body">{children}</div>
    </div>
  );
}

/**
 * Two-column tab content: prose on the left, an SVG canvas on the right.
 * Collapses to a single column on narrow screens.
 */
export function TabPanel({
  description,
  children,
}: {
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="algo__panel">
      <aside className="algo__desc">{description}</aside>
      <div className="algo__canvas-wrap">{children}</div>
    </div>
  );
}

/**
 * Responsive SVG canvas. Content is authored in a fixed coordinate space
 * (`width` × `height`); the element scales to fit and scrolls if it can't.
 */
export function Canvas({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="algo__canvas">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        role="img"
      >
        {children}
      </svg>
    </div>
  );
}
