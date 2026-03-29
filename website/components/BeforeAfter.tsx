"use client";

import { motion } from "framer-motion";

const withoutItems = [
  "PM → dev → platform → review → fix → re-review → deploy. Multiple handoffs, multiple waits, weeks.",
  "Every new service: dev hand-wires auth, logging, events. Platform team answers the same questions again.",
  "Review agents check AI output. Humans review what agents flag. Every step is lossy at scale.",
  "More teams = more drift = more coordination = slower delivery. Opposite of what scaling should do.",
];

const withItems = [
  "PM creates a request → AI drafts spec → pipeline generates → deployed. One workflow, minutes.",
  "PMs implement business rules with AI. Developers focus on platform and edge cases. Fewer handoffs.",
  "Generated code is known-good. Review only extension points — the 10% that's unique.",
  "Platform team encodes once. Every service inherits every improvement. The org scales without the overhead scaling.",
];

const stats = [
  { value: "3s", label: "Generation time" },
  { value: "90%", label: "Structural code automated" },
  { value: "0", label: "Architectural drift" },
  { value: "1 change", label: "Propagates everywhere" },
];

export default function BeforeAfter() {
  return (
    <section id="before-after" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            The <span className="text-gradient">org change</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Without */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-400">
                Without FixedCode
              </h3>
            </div>
            <ul className="space-y-4">
              {withoutItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-red-500/50 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-400 text-sm leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-cyan-400">
                With FixedCode
              </h3>
            </div>
            <ul className="space-y-4">
              {withItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-cyan-500/60 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-300 text-sm leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center p-6 rounded-xl border border-border bg-surface"
            >
              <div className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
