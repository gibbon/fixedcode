"use client";

import { motion } from "framer-motion";
import { RobotIcon, FactoryIcon } from "./Icons";

const approaches = [
  {
    title: "AI Generation Alone",
    icon: <RobotIcon className="w-6 h-6 text-purple-400" />,
    borderClass: "border-purple-500/20",
    bgClass: "bg-purple-500/[0.03]",
    color: "text-purple-400",
    good: [
      "Flexible — handles any language, any framework, any pattern",
      "Creative — great at business logic and novel problems",
      "Accessible — anyone can prompt, no template authoring needed",
    ],
    bad: [
      "Slow in practice — fast to generate, slow to review thousands of lines and verify every CFR is wired correctly",
      "Different output every time, even for the same prompt",
      "CLAUDE.md and coding standards are suggestions, not guarantees",
      "No regeneration path — once generated, you're on your own",
    ],
  },
  {
    title: "Scaffolding Alone",
    icon: <FactoryIcon className="w-6 h-6 text-blue-400" />,
    borderClass: "border-blue-500/20",
    bgClass: "bg-blue-500/[0.03]",
    color: "text-blue-400",
    good: [
      "Deterministic — same input, same output",
      "Consistent — every service looks identical",
      "Auditable — you know exactly what was generated",
    ],
    bad: [
      "Templates are painful to write and maintain by hand",
      "Fire-and-forget — generate once, then you're alone (Yeoman, Backstage)",
      "Rigid — can't handle the creative, domain-specific parts",
      "Nobody wants to author YAML specs manually",
    ],
  },
];

export default function WhyBoth() {
  return (
    <section id="why-both" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why not just use <span className="text-gradient">one or the other?</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI alone is fast but inconsistent. Scaffolding alone is consistent but rigid. FixedCode uses both where they&apos;re strongest.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {approaches.map((approach, i) => (
            <motion.div
              key={approach.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`rounded-xl border ${approach.borderClass} ${approach.bgClass} p-6`}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-8 h-8 rounded-lg ${approach.bgClass} flex items-center justify-center`}>
                  {approach.icon}
                </div>
                <h3 className={`text-lg font-semibold ${approach.color}`}>
                  {approach.title}
                </h3>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">What it does well</p>
                <ul className="space-y-2">
                  {approach.good.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-green-500/60 mt-0.5 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-400 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Where it falls down</p>
                <ul className="space-y-2">
                  {approach.bad.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-red-500/50 mt-0.5 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-400 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* The combination */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center ring-2 ring-background">
                <RobotIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center ring-2 ring-background">
                <FactoryIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gradient">
              FixedCode: AI + Deterministic Together
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-medium text-white mb-1">AI handles the creative parts</p>
              <p className="text-xs text-gray-400">Translating requirements into specs. Building and refining templates. Implementing business logic in extension points. The parts that need flexibility.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-medium text-white mb-1">Engine handles the structural parts</p>
              <p className="text-xs text-gray-400">Deterministic generation from specs. Same input, identical output. Every CFR built in. Regeneration-safe. The parts that need guarantees.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-medium text-white mb-1">Each compensates for the other</p>
              <p className="text-xs text-gray-400">AI can&apos;t be consistent — the engine is. The engine can&apos;t be creative — AI is. Templates are hard to write — AI builds them. Specs are tedious — AI drafts them.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
