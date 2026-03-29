"use client";

import { motion } from "framer-motion";

const schemas = [
  {
    name: "Domain-Driven",
    description: "Event-driven microservices with command/query separation",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L12 17.25 6.429 14.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25" />
      </svg>
    ),
    available: true,
  },
  {
    name: "REST / CRUD",
    description: "Standard API services with relationships and validation",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    available: true,
  },
  {
    name: "Event-Driven",
    description: "Producers, consumers, and event contracts",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    available: false,
  },
  {
    name: "Frontend",
    description: "Pages, components, and data sources",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    available: false,
  },
  {
    name: "Infrastructure",
    description: "Service catalog to deployment configs",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    available: false,
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            One engine. <span className="text-gradient">Five architecture types.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Pluggable schemas for the patterns your team actually uses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {schemas.map((schema, i) => (
            <motion.div
              key={schema.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-xl border p-6 transition-all ${
                schema.available
                  ? "bg-surface border-border hover:border-gray-600"
                  : "bg-surface/50 border-border/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    schema.available
                      ? "bg-surface-light text-gray-300"
                      : "bg-surface-light/50 text-gray-600"
                  }`}
                >
                  {schema.icon}
                </div>
                {!schema.available && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
              </div>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  schema.available ? "text-white" : "text-gray-500"
                }`}
              >
                {schema.name}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  schema.available ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {schema.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
