import { Ambulance, Heart } from "lucide-react";
import { NAV_LINKS, ORG_REGISTER_URL } from "../config";
import AppStoreBadges from "./AppStoreBadges";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-brand-footer text-red-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <a href="#home" className="inline-flex gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-emergency text-white">
                <Ambulance className="h-5 w-5" />
              </span>
              <span className="text-lg font-black text-white">MedSwift</span>
            </a>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-red-200/90">
              Coordinating accident and emergency response between citizens and
              verified ambulance organizations — faster dispatch, live tracking,
              and accountable care from call to arrival.
            </p>
            <AppStoreBadges className="mt-6" compact />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-300">
              Explore
            </p>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-red-100/90 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-300">
              Get started
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={ORG_REGISTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-100/90 transition hover:text-white"
                >
                  Organization registration
                </a>
              </li>
              <li>
                <a
                  href="#download"
                  className="text-red-100/90 transition hover:text-white"
                >
                  Download mobile app
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-red-100/90 transition hover:text-white"
                >
                  Contact &amp; partnerships
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-red-300">
            © {year} MedSwift. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-red-300">
            Built for communities who deserve help in seconds
            <Heart className="h-3.5 w-3.5 fill-brand-emergency text-brand-emergency" />
          </p>
        </div>
      </div>
    </footer>
  );
}
