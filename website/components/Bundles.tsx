"use client";

import { motion } from "framer-motion";

const bundles = [
  {
    schema: "Domain-Driven",
    stack: "Spring Kotlin",
    files: "~47 files",
    available: true,
    colors: "from-purple-500/20 to-blue-500/20",
    borderColor: "border-purple-500/20",
  },
  {
    schema: "Domain-Driven",
    stack: "Go gRPC",
    files: null,
    available: false,
    colors: "from-purple-500/10 to-blue-500/10",
    borderColor: "border-border",
  },
  {
    schema: "REST / CRUD",
    stack: "Express TypeScript",
    files: "~32 files",
    available: true,
    colors: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/20",
  },
  {
    schema: "REST / CRUD",
    stack: "FastAPI Python",
    files: "~28 files",
    available: true,
    colors: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/20",
  },
  {
    schema: "Event-Driven",
    stack: "Node.js",
    files: null,
    available: false,
    colors: "from-cyan-500/10 to-purple-500/10",
    borderColor: "border-border",
  },
  {
    schema: "Infrastructure",
    stack: "Terraform",
    files: null,
    available: false,
    colors: "from-cyan-500/10 to-purple-500/10",
    borderColor: "border-border",
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
            Pluggable <span className="text-gradient">stack bundles</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Templates tied to schema + stack. Pick your architecture, pick your language.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bundles.map((bundle, i) => (
            <motion.div
              key={`${bundle.schema}-${bundle.stack}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative rounded-xl border p-6 transition-all ${
                bundle.available
                  ? `bg-gradient-to-br ${bundle.colors} ${bundle.borderColor} hover:border-gray-600`
                  : "bg-surface/50 border-border/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                      bundle.available ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {bundle.schema}
                  </div>
                  <h3
                    className={`text-lg font-bold ${
                      bundle.available ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {bundle.stack}
                  </h3>
                </div>
                {!bundle.available && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
              </div>

              {bundle.files ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gradient font-semibold">
                    {bundle.files}
                  </span>
                  <span className="text-xs text-gray-500">generated</span>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  In development
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
