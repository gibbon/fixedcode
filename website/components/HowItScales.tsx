"use client";

import { motion } from "framer-motion";
import { PersonIcon, RobotIcon, FactoryIcon } from "./Icons";

const tiers = [
  {
    name: "Individual",
    icon: <PersonIcon className="w-6 h-6 text-purple-400" />,
    description: "Capture and replay patterns from AI-generated code. Lock in what works. Never re-prompt for the same structure.",
    color: "border-purple-500/20",
    tagColor: "bg-purple-500/20 text-purple-400",
  },
  {
    name: "Team",
    icon: <RobotIcon className="w-6 h-6 text-blue-400" />,
    description: "Share proven patterns across a team. Shared schemas become the team's golden path. Consistent structure without coordination.",
    color: "border-blue-500/20",
    tagColor: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Platform",
    icon: <FactoryIcon className="w-6 h-6 text-cyan-400" />,
    description: "Encode every CFR into schemas. Every service gets every cross-functional requirement from day zero. Violations structurally impossible.",
    color: "border-cyan-500/20",
    tagColor: "bg-cyan-500/20 text-cyan-400",
  },
  {
    name: "Enterprise",
    icon: <FactoryIcon className="w-6 h-6 text-green-400" />,
    description: "Provable compliance for AI-generated code. Full audit trail. Manifest tracking. Pipeline integrations. Regulated industry ready.",
    color: "border-green-500/20",
    tagColor: "bg-green-500/20 text-green-400",
  },
];

export default function HowItScales() {
  return (
    <section id="scales" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Same product. <span className="text-gradient">Every scale.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Individual dev adoption is the wedge. Each tier removes more handoffs and adds more guarantees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-xl border ${tier.color} bg-surface p-6 flex flex-col`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-lg ${tier.tagColor.replace('text-', 'bg-').replace(/20/g, '10')} flex items-center justify-center`}>
                  {tier.icon}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${tier.tagColor}`}>
                  {tier.name}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">
                {tier.description}
              </p>
              {i < tiers.length - 1 && (
                <div className="hidden md:flex justify-end mt-4 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-gray-500 text-sm mt-8"
        >
          <a href="/pricing" className="text-purple-400 hover:text-purple-300 transition-colors">
            View pricing →
          </a>
        </motion.p>
      </div>
    </section>
  );
}
