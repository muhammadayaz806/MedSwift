import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useInView } from "../hooks/useInView";
import { ORG_REGISTER_URL } from "../config";

export default function Contact() {
  const [ref, visible] = useInView();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section id="contact" className="section-pad bg-white">
      <div ref={ref} className="mx-auto max-w-7xl">
        <div
          className={`grid gap-12 lg:grid-cols-5 lg:gap-16 ${
            visible ? "card-visible" : "opacity-0"
          }`}
        >
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">
              Contact us
            </p>
            <h2 className="section-title mt-3">Let&apos;s talk about your fleet or partnership</h2>
            <p className="section-sub">
              Whether you operate ambulances, run a hospital network, or want to
              bring MedSwift to your city — we would love to hear from you. For
              organization onboarding, use the registration dashboard for the
              fastest path.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand-emergency">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-brand-text">Email</p>
                  <a
                    href="mailto:hello@medswift.app"
                    className="text-sm text-brand-sub hover:text-brand-emergency"
                  >
                    hello@medswift.app
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand-emergency">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-brand-text">Partnerships</p>
                  <p className="text-sm text-brand-sub">Available on request for pilot regions</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand-emergency">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-brand-text">Coverage</p>
                  <p className="text-sm text-brand-sub">
                    Expanding with verified ambulance organizations worldwide
                  </p>
                </div>
              </li>
            </ul>

            <a
              href={ORG_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-8"
            >
              Register organization instead
            </a>
          </div>

          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-brand-border bg-brand-bg p-6 shadow-card sm:p-8"
            >
              {sent ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-14 w-14 text-brand-emergency" />
                  <h3 className="mt-4 text-xl font-bold text-brand-text">
                    Thank you for reaching out
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-brand-sub">
                    We received your message. A member of the MedSwift team will
                    respond soon. For urgent fleet setup, complete organization
                    registration in the dashboard.
                  </p>
                  <button
                    type="button"
                    className="btn-outline mt-6"
                    onClick={() => {
                      setSent(false);
                      setForm({ name: "", email: "", subject: "general", message: "" });
                    }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-brand-text">
                        Your name
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none ring-brand-emergency/30 transition focus:ring-2"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-text">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none ring-brand-emergency/30 transition focus:ring-2"
                        placeholder="you@organization.org"
                      />
                    </div>
                  </div>
                  <div className="mt-5">
                    <label className="block text-sm font-semibold text-brand-text">
                      I am interested in
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none ring-brand-emergency/30 transition focus:ring-2"
                    >
                      <option value="general">General inquiry</option>
                      <option value="org">Organization / fleet partnership</option>
                      <option value="citizen">Citizen app support</option>
                      <option value="press">Press &amp; media</option>
                    </select>
                  </div>
                  <div className="mt-5">
                    <label className="block text-sm font-semibold text-brand-text">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="mt-1.5 w-full resize-y rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none ring-brand-emergency/30 transition focus:ring-2"
                      placeholder="Tell us about your organization, region, or question..."
                    />
                  </div>
                  <button type="submit" className="btn-primary mt-6 w-full sm:w-auto">
                    <Send className="h-4 w-4" />
                    Send message
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
