import {
  Smartphone,
  Truck,
  LayoutDashboard,
  MapPinned,
  Bell,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useInView } from "../hooks/useInView";
import { ORG_REGISTER_URL } from "../config";
import AppStoreBadges from "./AppStoreBadges";

const citizenFeatures = [
  {
    icon: Smartphone,
    title: "One-tap SOS",
    desc: "Share your location instantly so the nearest available crew can be alerted.",
  },
  {
    icon: MapPinned,
    title: "Live tracking",
    desc: "Follow your assigned ambulance on the map from dispatch to arrival.",
  },
  {
    icon: Bell,
    title: "Stay informed",
    desc: "Status updates and support channels keep you connected through the trip.",
  },
];

const orgFeatures = [
  {
    icon: LayoutDashboard,
    title: "Operations dashboard",
    desc: "Overview of active emergencies, fleet status, and daily activity at a glance.",
  },
  {
    icon: Truck,
    title: "Fleet & drivers",
    desc: "Manage ambulances, onboard drivers, and see who is online and ready.",
  },
  {
    icon: Users,
    title: "History & reports",
    desc: "Review completed trips and export insights to improve response performance.",
  },
];

const steps = [
  { n: "01", title: "Request", text: "A citizen sends an emergency from the MedSwift mobile app." },
  { n: "02", title: "Dispatch", text: "Your organization receives the alert and assigns the nearest driver." },
  { n: "03", title: "Track", text: "Everyone sees live location until the ambulance reaches the scene." },
];

export default function Services() {
  const [ref, visible] = useInView();

  return (
    <section id="services" className="section-pad bg-brand-bg">
      <div ref={ref} className="mx-auto max-w-7xl">
        <div className={`text-center ${visible ? "card-visible" : "opacity-0"}`}>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">
            Services
          </p>
          <h2 className="section-title mx-auto mt-3 max-w-3xl">
            Everything you need — whether you call for help or run the fleet
          </h2>
          <p className="section-sub mx-auto">
            Two experiences, one coordinated network. Citizens get speed and clarity;
            organizations get the tools to respond with confidence.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div
            className={`feature-card !bg-gradient-to-br !from-brand-card !to-brand-surface ${
              visible ? "card-visible" : "opacity-0"
            }`}
            style={{ animationDelay: "0.08s" }}
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-accent">
                <Smartphone className="h-3.5 w-3.5" />
                For citizens
              </span>
              <h3 className="mt-4 text-2xl font-black text-brand-text">
                The MedSwift mobile app
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-sub">
                Download on iOS or Android, register as a citizen, tap SOS when you
                need an ambulance, and track help in real time — the same experience
                you see on the user home screen, designed for stress.
              </p>
              <ul className="mt-6 space-y-4">
                {citizenFeatures.map((f) => (
                  <li key={f.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand-emergency">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-brand-text">{f.title}</p>
                      <p className="mt-0.5 text-sm text-brand-sub">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div
                id="download"
                className="mt-6 scroll-mt-28 rounded-xl border border-brand-border bg-brand-muted/50 px-4 py-4"
              >
                <p className="text-sm font-semibold text-brand-text">
                  Download MedSwift
                </p>
                <p className="mt-1 text-sm text-brand-sub">
                  Available on the App Store and Google Play.
                </p>
                <AppStoreBadges className="mt-4" compact />
              </div>
            </div>
          </div>

          <div
            className={`feature-card !border-brand-soft/60 !bg-gradient-to-br !from-[rgb(69,10,10)] !to-[rgb(127,29,29)] !text-white dark:!from-[rgb(40,10,10)] dark:!to-[rgb(100,20,20)] ${
              visible ? "card-visible" : "opacity-0"
            }`}
            style={{ animationDelay: "0.16s" }}
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90">
                <Building2 className="h-3.5 w-3.5" />
                For organizations
              </span>
              <h3 className="mt-4 text-2xl font-black">Organization dashboard</h3>
              <p className="mt-3 text-sm leading-relaxed text-red-100">
                Register your ambulance service, get verified by MedSwift admin, and
                run day-to-day operations from a secure web dashboard — drivers,
                ambulances, live emergencies, and reporting in one place.
              </p>
              <ul className="mt-6 space-y-4">
                {orgFeatures.map((f) => (
                  <li key={f.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold">{f.title}</p>
                      <p className="mt-0.5 text-sm text-red-100">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <a
                href={ORG_REGISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-brand-text shadow-lg transition hover:bg-brand-surface sm:w-auto"
              >
                Go to organization registration
                <ArrowRight className="h-4 w-4 text-brand-emergency" />
              </a>
            </div>
          </div>
        </div>

        <div
          className={`mt-16 ${visible ? "card-visible" : "opacity-0"}`}
          style={{ animationDelay: "0.24s" }}
        >
          <h3 className="text-center text-xl font-black text-brand-text sm:text-2xl">
            How coordination flows
          </h3>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="feature-card text-center"
                style={{ animationDelay: `${0.28 + i * 0.1}s` }}
              >
                <div className="relative z-10">
                  <span className="text-4xl font-black text-brand-soft">{step.n}</span>
                  <h4 className="mt-2 text-lg font-bold text-brand-text">{step.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-brand-sub">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-brand-border shadow-card">
          <img
            src="https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&w=1400&q=80"
            alt="Ambulance on the road for emergency response"
            className="h-48 w-full object-cover sm:h-64"
          />
        </div>
      </div>
    </section>
  );
}
