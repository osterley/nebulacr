import { Link } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';

// Shared chrome for both routes: the steel header (the app's signature,
// steel in both themes), a persisted light/dark toggle, and a few small
// primitives so App and ScanDetail stay declarative.

type Theme = 'light' | 'dark';
const THEME_KEY = 'specton-theme';

/** Read the persisted theme, apply it to <html data-theme>, expose a toggle. */
export function useTheme(): [Theme | null, () => void] {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme | null) ?? null;
    setTheme(saved);
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }, []);

  function toggle() {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = theme ?? (sysDark ? 'dark' : 'light');
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return [theme, toggle];
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SunMoon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

/** The steel header. `right` renders inside the bar (e.g. the API-key control). */
export function Header({ right }: { right?: ReactNode }) {
  const [theme, toggle] = useTheme();
  const isDark =
    theme === 'dark' ||
    (theme === null && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="SpectonCR home">
          <span className="brand-mark"><ShieldIcon /></span>
          <span className="brand-name">
            <b>SpectonCR</b>
            <span>Registry &amp; scanner</span>
          </span>
        </Link>
        <div className="header-spacer" />
        {right}
        <button className="icon-btn" onClick={toggle} aria-label="Toggle color theme" title="Toggle theme">
          <SunMoon dark={isDark} />
        </button>
      </div>
    </header>
  );
}

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'unknown'] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Normalize an API severity string ("HIGH", "Unknown", null) to a class key. */
export function sevKey(s?: string | null): Severity {
  const k = (s || 'unknown').toLowerCase();
  return (SEVERITIES as readonly string[]).includes(k) ? (k as Severity) : 'unknown';
}

export function SevBadge({ severity }: { severity?: string | null }) {
  const k = sevKey(severity);
  return <span className={`sev ${k}`}>{k}</span>;
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
