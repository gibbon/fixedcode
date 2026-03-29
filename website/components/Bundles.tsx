"use client";

import { motion } from "framer-motion";

const bundles = [
  {
    category: "Domain Services",
    stack: "Spring Kotlin",
    description: "Full DDD service with auth, audit, events, persistence, tests",
    color: "from-purple-500/20 to-blue-500/20",
    border: "border-purple-500/20",
  },
  {
    category: "REST API",
    stack: "FastAPI Python",
    description: "API service with validation, pagination, OpenAPI spec",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
  },
  {
    category: "AI Agent",
    stack: "Python FastAPI",
    description: "Autonomous agent with tools, middleware, auth, structured output",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/20",
  },
  {
    category: "MCP Server",
    stack: "Python",
    description: "Model Context Protocol server exposing tools to AI coding agents",
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
  },
  {
    category: "Agent Orchestrator",
    stack: "Python",
    description: "Multi-agent pipeline with sequential, parallel, or LLM routing",
    color: "from-purple-500/20 to-cyan-500/20",
    border: "border-purple-500/20",
  },
  {
    category: "Your Pattern",
    stack: "Any Stack",
    description: "Define a spec format, build a template bundle, generate whatever your org needs",
    color: "from-gray-500/10 to-gray-500/10",
    border: "border-border border-dashed",
    isCustom: true,
  },
];

export default function Bundles() {
  return (
    <section id="bundles" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Example <span className="text-gradient">bundles</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Bundles are templates tied to a spec format and a target stack. AI helps build them. You own them. These are examples — your org would create bundles for your patterns.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bundles.map((bundle, i) => (
            <motion.div
              key={`${bundle.category}-${bundle.stack}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative rounded-xl border p-6 transition-all bg-gradient-to-br ${bundle.color} ${bundle.border} hover:border-gray-600`}
            >
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {bundle.category}
                </div>
                <h3 className={`text-lg font-bold ${bundle.isCustom ? "text-gradient" : "text-white"}`}>
                  {bundle.stack}
                </h3>
              </div>
              <p className={`text-sm leading-relaxed ${bundle.isCustom ? "text-gray-400" : "text-gray-400"}`}>
                {bundle.description}
              </p>
              {bundle.isCustom && (
                <div className="mt-4 text-xs text-purple-400">
                  Same engine. Different spec + templates.
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
