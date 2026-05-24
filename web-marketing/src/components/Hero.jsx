import { MapPin, Shield, Zap, ArrowRight, Building2 } from "lucide-react";
import { ORG_REGISTER_URL } from "../config";

const stats = [
  { value: "< 30s", label: "to send an SOS from your phone" },
  { value: "Live", label: "ambulance tracking on the map" },
  { value: "24/7", label: "coordination for verified fleets" },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36"
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-emergency/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-muted/80 blur-3xl" />

      <div className="section-pad mx-auto max-w-7xl pb-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent shadow-sm">
              <Zap className="h-3.5 w-3.5 text-brand-emergency" />
              Accident &amp; Emergency Coordination
            </span>

            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
              When every second counts,{" "}
              <span className="text-brand-emergency">help is on the way.</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-brand-sub sm:text-xl">
              MedSwift connects people in crisis with trusted ambulance
              organizations — one tap to request help, real-time dispatch, and
              live tracking until care arrives. Built for citizens and the fleets
              that serve them.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a href="#services" className="btn-primary">
                See how it works
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={ORG_REGISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <Building2 className="h-4 w-4 text-brand-emergency" />
                Register your organization
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-brand-border bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm"
                >
                  <p className="text-2xl font-black text-brand-emergency">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-brand-sub">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up lg:pl-4">
            <div className="relative overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-card">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
                alt="Emergency medical team responding with ambulance"
                className="h-[280px] w-full object-cover sm:h-[360px] lg:h-[420px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="rounded-2xl border border-brand-border/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-accent">
                    <MapPin className="h-3.5 w-3.5" />
                    Live dispatch
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    Nearest verified unit assigned in seconds
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-text px-4 py-3 text-white shadow-lg">
                  <Shield className="h-5 w-5 text-brand-soft" />
                  <span className="text-sm font-bold">Trusted fleets only</span>
                </div>
              </div>
            </div>

            <div className="absolute -right-2 -top-4 hidden animate-float rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:block lg:-right-6">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                Citizen app
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-text">
                Tap SOS · Track ambulance
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
