import { Link, useNavigate } from "react-router-dom";

const HISTORY_KEY = "medswift_nav_trail";

/**
 * We can't reliably trust browser/React-Router history internals here,
 * since a hard navigation (typing a URL, hitting a broken link) resets
 * how the router perceives "previous" pages. Instead we keep our own
 * lightweight trail of visited in-app paths in sessionStorage, updated
 * on every real route change, and use that to go back — still 100%
 * client-side, still zero page reload.
 */
export function trackVisit(pathname) {
  try {
    const trail = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
    if (trail[trail.length - 1] !== pathname) trail.push(pathname);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trail.slice(-20)));
  } catch {
    /* sessionStorage unavailable — fine, we just won't have a trail */
  }
}

export default function NotFound() {
  const navigate = useNavigate();

  function handleBack() {
    try {
      const trail = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
      const prev = trail[trail.length - 2];
      if (prev) {
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trail.slice(0, -1)));
        navigate(prev);
        return;
      }
    } catch {
      /* fall through to home */
    }
    navigate("/");
  }

  return (
    <div className="w-full flex items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-red" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-6xl sm:text-7xl font-bold tracking-tight text-brand-text">404</p>
        <h1 className="mt-3 text-xl sm:text-2xl font-semibold text-brand-text">Page not found</h1>
        <p className="mt-2 text-sm sm:text-base text-brand-sub">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white shadow-emergency hover:bg-brand-red/90 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M19 12H5m0 0 7 7m-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Go back
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-surface px-5 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-soft transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}