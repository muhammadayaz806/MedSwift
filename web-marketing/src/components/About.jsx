import { HeartHandshake, Radio, LineChart } from "lucide-react";
import { useInView } from "../hooks/useInView";

const pillars = [
  {
    icon: HeartHandshake,
    title: "Human-first in a crisis",
    text: "Clear language, calm design, and a single SOS button — because stress should not get in the way of getting help.",
  },
  {
    icon: Radio,
    title: "Connected end to end",
    text: "Citizens, drivers, and organization dashboards share one live picture — from the first alert to arrival on scene.",
  },
  {
    icon: LineChart,
    title: "Built for accountability",
    text: "Trip history, fleet visibility, and admin oversight help organizations improve response times over time.",
  },
];

export default function About() {
  const [ref, visible] = useInView();

  return (
    <section id="about" className="section-pad bg-brand-card">
      <div ref={ref} className="mx-auto max-w-7xl">
        <div
          className={`grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20 ${
            visible ? "card-visible" : "opacity-0"
          }`}
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">
              About MedSwift
            </p>
            <h2 className="section-title mt-3">
              Modern emergency logistics for real communities
            </h2>
            <p className="section-sub">
              MedSwift is an accident and emergency coordination platform. When
              someone needs an ambulance, they should not navigate phone trees or
              wonder whether help is coming. Our mobile app puts dispatch at their
              fingertips; our organization tools give fleets the control room they
              deserve.
            </p>
            <p className="mt-4 text-base leading-relaxed text-brand-sub">
              We designed MedSwift around the same red-and-calm visual language you
              see in the citizen experience — urgent when it matters, reassuring
              everywhere else — so every touchpoint feels like part of one trusted
              system.
            </p>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
              alt="Medical professionals coordinating emergency care"
              className="w-full rounded-3xl border border-brand-border object-cover shadow-card aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-4 max-w-[220px] rounded-2xl border border-brand-border bg-brand-bg p-4 shadow-card">
              <p className="text-3xl font-black text-brand-emergency">1 platform</p>
              <p className="mt-1 text-sm font-medium text-brand-sub">
                Citizens, drivers, organizations &amp; super admin — aligned.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item, i) => (
            <article
              key={item.title}
              className={`feature-card ${visible ? "card-visible" : "opacity-0"}`}
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
              <div className="relative z-10">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand-emergency">
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-brand-text">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-sub">
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
