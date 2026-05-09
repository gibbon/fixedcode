"use client";

import { motion } from "framer-motion";
import { FactoryIcon, RobotIcon } from "./Icons";

const examples = [
  {
    category: "Services",
    categoryColor: "text-blue-400",
    items: [
      {
        name: "Domain Services",
        description: "Event-driven microservices with command/query separation, full CFR encoding",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L12 17.25 6.429 14.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25" />
          </svg>
        ),
      },
      {
        name: "REST APIs",
        description: "Standard API services with validation, pagination, and OpenAPI specs",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        ),
      },
      {
        name: "Event-Driven",
        description: "Producers, consumers, event contracts, outbox patterns",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        ),
      },
    ],
  },
  {
    category: "AI Infrastructure",
    categoryColor: "text-purple-400",
    items: [
      {
        name: "AI Agents",
        description: "Autonomous agents with tools, middleware, auth, and structured output",
        icon: <RobotIcon className="w-6 h-6" />,
      },
      {
        name: "MCP Servers",
        description: "Model Context Protocol servers that expose tools to AI coding agents",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        ),
      },
      {
        name: "Agent Orchestrators",
        description: "Multi-agent pipelines with sequential, parallel, or LLM-routed execution",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        ),
      },
    ],
  },
];

export default function SchemaTypes() {
  return (
    <section id="schemas" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            One engine. <span className="text-gradient">Any pattern.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The engine doesn&apos;t care what it generates. Define a spec format, build a template bundle, and generate anything — services, agents, orchestrators, infrastructure.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            These are examples. Your team would build bundles for whatever your org&apos;s patterns are.
          </p>
        </motion.div>

        {examples.map((group, gi) => (
          <div key={group.category} className={gi > 0 ? "mt-10" : ""}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              {gi === 0 ? (
                <FactoryIcon className="w-5 h-5" />
              ) : (
                <RobotIcon className="w-5 h-5" />
              )}
              <h3 className={`text-sm font-semibold uppercase tracking-wider ${group.categoryColor}`}>
                {group.category}
              </h3>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {group.items.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-surface p-6 hover:border-gray-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-gray-300 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
