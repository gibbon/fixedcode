"use client";

import { motion } from "framer-motion";

const problems = [
  {
    title: "Handoffs Everywhere",
    description:
      "PM writes requirements, waits for dev. Dev asks platform about CFRs. Platform explains for the 50th time. Dev hand-wires everything. Review catches drift. Fix. Re-review. Weeks of coordination before any business logic.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    borderColor: "from-purple-500 to-purple-500",
  },
  {
    title: "Guardrails Are Social, Not Structural",
    description:
      "The golden path lives in wikis and CLAUDE.md files. Code reviews catch violations after the fact. Nothing enforces standards at generation time. Compliance depends on discipline.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
        />
      </svg>
    ),
    borderColor: "from-blue-500 to-blue-500",
  },
  {
    title: "AI Makes It Faster But Not Safer",
    description:
      "AI coding tools accelerate delivery but produce different structural code every time. 10 teams, 50 services, 50 interpretations. Speed without guardrails is just faster drift.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
        />
      </svg>
    ),
    borderColor: "from-cyan-500 to-cyan-500",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            The real cost of <span className="text-gradient">building software</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            It&apos;s not writing code. It&apos;s the handoffs, coordination, and waiting between the people who write it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              {/* Gradient top border */}
              <div
                className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${problem.borderColor} opacity-60`}
              />
              <div className="bg-surface rounded-xl p-6 pt-8 border border-border hover:border-gray-700 transition-colors h-full">
                <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-gray-400 mb-4 group-hover:text-white transition-colors">
                  {problem.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {problem.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
