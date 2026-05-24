import { useState, useEffect } from "react";
import { Menu, X, Ambulance } from "lucide-react";
import { NAV_LINKS, ORG_REGISTER_URL } from "../config";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-brand-border/80 bg-white/90 backdrop-blur-lg shadow-sm"
          : "bg-brand-bg/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-emergency text-white shadow-emergency transition-transform group-hover:scale-105">
            <Ambulance className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight text-brand-text">
              MedSwift
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
              Emergency Coordination
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-brand-sub transition-colors hover:text-brand-emergency"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="#services" className="btn-outline !py-2.5 !px-5 !text-sm">
            For Citizens
          </a>
          <a
            href={ORG_REGISTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2.5 !px-5 !text-sm"
          >
            Register Organization
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-text lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-border bg-white px-4 py-5 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold text-brand-text hover:bg-brand-surface"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <a href="#services" onClick={closeMenu} className="btn-outline w-full">
              For Citizens
            </a>
            <a
              href={ORG_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              Register Organization
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
