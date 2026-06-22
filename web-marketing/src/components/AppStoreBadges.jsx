import { APP_STORE_URL, PLAY_STORE_URL } from "../config";

function StoreBadge({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-[52px] min-w-[155px] items-center gap-3 rounded-xl border border-black/10 bg-[#1a1a1a] px-4 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/15"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-current" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
      <path fill="#00D9FF" d="M2 4.5v15l11-7.5L2 4.5z" />
      <path fill="#00F076" d="M13 12 2 19.5V4.5L13 12z" />
      <path fill="#FF3A44" d="M13 12 22 19V5L13 12z" />
      <path fill="#FFB900" d="M13 12 22 5v14l-9-7z" />
    </svg>
  );
}

export default function AppStoreBadges({ className = "", compact = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 justify-center lg:justify-start ${className}`}>
      <StoreBadge href={APP_STORE_URL} label="Download MedSwift on the App Store">
        <AppleIcon />
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-wide opacity-80">
            Download on the
          </span>
          <span className={`block font-semibold ${compact ? "text-sm" : "text-base"}`}>
            App Store
          </span>
        </span>
      </StoreBadge>

      <StoreBadge href={PLAY_STORE_URL} label="Get MedSwift on Google Play">
        <PlayIcon />
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-wide opacity-80">
            Get it on
          </span>
          <span className={`block font-semibold ${compact ? "text-sm" : "text-base"}`}>
            Google Play
          </span>
        </span>
      </StoreBadge>
    </div>
  );
}
