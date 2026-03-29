"use client";

import { motion } from "framer-motion";
import { useState } from "react";

function PatentBadge() {
  const [clicked, setClicked] = useState(false);

  return (
    <span className="relative inline-block ml-2 align-middle">
      <button
        onClick={() => setClicked(!clicked)}
        className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25 transition-colors cursor-pointer uppercase tracking-wider"
      >
        Patent Pending
      </button>
      {clicked && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-surface border border-border shadow-lg whitespace-nowrap z-10"
        >
          <p className="text-xs text-gray-400">Just joking. But it&apos;s a good idea.</p>
        </motion.div>
      )}
    </span>
  );
}

const layers = [
  {
    label: "AI + Human",
    description: null,
    tag: "Creative",
    bgClass: "bg-gradient-to-r from-purple-600/20 to-purple-500/10",
    borderClass: "border-purple-500/30",
    tagClass: "bg-purple-500/20 text-purple-400",
    glowClass: "shadow-purple-500/10",
    split: [
      {
        subtitle: "Domain Specs",
        who: "PM / Domain Expert",
        desc: "Defines what to build. Plain English requirements translated by AI into YAML domain specs.",
      },
      {
        subtitle: "Template Curation",
        who: "Developer / Platform Team",
        desc: "Defines how to build it. AI extracts patterns from existing services into templates. Human refines iteratively.",
      },
    ],
  },
  {
    label: "FixedCode",
    description: "Crystallises AI-generated patterns into reproducible templates. Same spec = identical output, every time.",
    tag: "Deterministic",
    bgClass: "bg-surface",
    borderClass: "border-border",
    tagClass: "bg-gradient text-white",
    glowClass: "shadow-blue-500/10",
    isCenter: true,
  },
  {
    label: "AI + Human",
    description: "The custom parts: business rules, domain-specific logic, unique integrations. In clearly marked extension points that regeneration never touches.",
    tag: "Creative",
    bgClass: "bg-gradient-to-r from-cyan-600/20 to-cyan-500/10",
    borderClass: "border-cyan-500/30",
    tagClass: "bg-cyan-500/20 text-cyan-400",
    glowClass: "shadow-cyan-500/10",
  },
];

export default function AISandwich() {
  return (
    <section id="ai-sandwich" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            The <span className="text-gradient">AI Sandwich</span> <PatentBadge />
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI creates the patterns. FixedCode locks them in. AI enriches the output. You never re-prompt for the same structure twice.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            AI agents call <code className="text-gray-400">fixedcode generate</code> via CLI, MCP, or CI pipeline. Works with any AI tool.
          </p>
          <a
            href="/ai-sandwich"
            className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors mt-3"
          >
            Learn more about the AI Sandwich
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>

        <div className="flex flex-col items-center gap-0">
          {layers.map((layer, i) => (
            <div key={i} className="w-full max-w-lg">
              {/* Connector line */}
              {i > 0 && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileInView={{ opacity: 1, scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.2 }}
                  className="flex justify-center"
                >
                  <div className="w-px h-8 bg-gradient" />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className={`relative rounded-xl border p-6 ${layer.bgClass} ${layer.borderClass} ${
                  layer.isCenter ? "shadow-lg shadow-black/50 ring-1 ring-purple-500/20" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-xl font-bold ${
                      layer.isCenter ? "text-gradient" : "text-white"
                    }`}
                  >
                    {layer.label}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${layer.tagClass}`}
                  >
                    {layer.tag}
                  </span>
                </div>
                {layer.description && (
                  <p className="text-gray-400 text-sm">{layer.description}</p>
                )}
                {layer.split && (
                  <div className="grid grid-cols-2 gap-3">
                    {layer.split.map((s) => (
                      <div key={s.subtitle} className="rounded-lg border border-border/50 bg-black/20 p-3">
                        <p className="text-sm font-semibold text-white mb-0.5">{s.subtitle}</p>
                        <p className="text-[10px] text-purple-400 mb-1.5">{s.who}</p>
                        <p className="text-xs text-gray-400">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
