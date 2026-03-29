"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "~3s", label: "Generation time per service", detail: "Not minutes of AI prompting + review" },
  { value: "90%", label: "Structural code automated", detail: "Auth, logging, events, tests — all generated" },
  { value: "0", label: "Architectural drift", detail: "Every service generated from the same schemas" },
  { value: "100%", label: "CFR compliance", detail: "Every cross-functional requirement, every service" },
  { value: "~10%", label: "Review surface", detail: "Only extension points need human review" },
  { value: "Days", label: "New starter → productive", detail: "Clone, generate, run, extend" },
];

export default function ProvenAtScale() {
  return (
    <section id="proven" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Proven in <span className="text-gradient">production</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            This isn&apos;t a concept. It&apos;s running in production across multiple services, jurisdictions, and teams.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center p-6 rounded-xl border border-border bg-surface"
            >
              <div className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-white font-medium mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.detail}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Production numbers</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>4+ microservices generated and deployed</li>
              <li>100+ domain entities modelled in specs</li>
              <li>1000+ API endpoints auto-generated</li>
              <li>Multiple jurisdictions from the same schemas</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold text-white mb-3">What this proves</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Regenerated multiple times — zero business logic lost</li>
              <li>Templates improved, every service upgraded automatically</li>
              <li>Cross-service consistency without manual enforcement</li>
              <li>New developers shipping within days, not weeks</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
