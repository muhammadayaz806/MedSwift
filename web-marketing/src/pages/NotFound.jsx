import { Link, useNavigate } from "react-router-dom";

/**
 * Uses navigate(-1) — React Router's client-side history navigation.
 * This does NOT trigger a page reload; it pops the browser history stack
 * exactly like the browser's own back button, but without leaving the SPA.
 *
 * Falls back to the homepage link if there's no previous page in this
 * tab's history (e.g. someone opened a bad link directly / in a new tab).
 */
export default function NotFound() {
  const navigate = useNavigate();
  const canGoBack = window.history.state?.idx > 0;

  function handleBack() {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <section className="section-pad mx-auto max-w-7xl py-20 sm:py-28">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8 text-brand-red"
            aria-hidden="true"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="text-6xl sm:text-7xl font-bold tracking-tight text-brand-text">
          404
        </p>
        <h1 className="mt-3 text-xl sm:text-2xl font-semibold text-brand-text">
          Page not found
        </h1>
        <p className="mt-2 text-sm sm:text-base text-brand-sub">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white shadow-emergency hover:bg-brand-red/90 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M19 12H5m0 0 7 7m-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Go back
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-surface px-5 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-soft transition-colors"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </section>
  );
}