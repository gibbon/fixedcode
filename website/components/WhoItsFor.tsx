"use client";

import { motion } from "framer-motion";

const forItems = [
  {
    title: "Mid-market regulated companies",
    detail: "500-5000 engineers. Banks, fintechs, insurers, health, government. 50+ services, growing fast, can't hire enough platform engineers. Regulatory requirements for audit, compliance, and consistency that aren't optional.",
    color: "border-purple-500/20",
  },
  {
    title: "Fast-scaling companies",
    detail: "Went from 5 to 50 services and skipped the \"build a platform team\" phase. Drowning in inconsistency. AI making it worse. Platform team of 2-5 people who are already the bottleneck.",
    color: "border-blue-500/20",
  },
  {
    title: "Teams adopting AI coding tools",
    detail: "Discovering that AI makes individual devs faster but makes the org-wide consistency problem worse. Need guardrails that are structural, not suggestions.",
    color: "border-cyan-500/20",
  },
];

const notForItems = [
  { title: "Big Tech", detail: "Google, Meta, Amazon already built this internally with 50-100+ person platform teams." },
  { title: "Small startups", detail: "Under 10 engineers. One team, a few services. The pain isn't acute yet." },
  { title: "Monoliths", detail: "No cross-service consistency problem to solve." },
];

export default function WhoItsFor() {
  return (
    <section id="who" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Is this <span className="text-gradient">for you?</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Big Tech spent hundreds of millions building this capability internally. FixedCode makes it accessible to everyone else.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {forItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-xl border ${item.color} bg-surface p-6`}
            >
              <h3 className="text-base font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.detail}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-border bg-surface p-6"
        >
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Probably not for you (yet) if...</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notForItems.map((item) => (
              <div key={item.title}>
                <p className="text-sm font-medium text-gray-400">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
