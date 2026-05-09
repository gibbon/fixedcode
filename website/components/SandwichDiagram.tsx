"use client";

import { motion } from "framer-motion";
import { PersonIcon as Person, RobotIcon as Robot, FactoryIcon as Factory } from "./Icons";

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 12h32" />
      <path d="M32 6l8 6-8 6" />
    </svg>
  );
}

const steps = [
  { icon: Person, label: "Human", sublabel: "Requirements" },
  { icon: Robot, label: "AI", sublabel: "Spec + templates" },
  { icon: Factory, label: "FixedCode", sublabel: "Deterministic", isCenter: true },
  { icon: Robot, label: "AI", sublabel: "Business logic" },
  { icon: Person, label: "Human", sublabel: "Review + ship" },
];

export default function SandwichDiagram() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      {/* Horizontal layout with arrows — sm and up */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    step.isCenter
                      ? "bg-gradient text-background"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Icon className="w-9 h-9" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-gray-500 max-w-[100px]">{step.sublabel}</p>
                </div>
              </motion.div>
              {i < steps.length - 1 && (
                <Arrow className="w-12 h-6 text-gray-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Stacked layout — mobile only. Compact, no horizontal arrows. */}
      <ol className="sm:hidden flex flex-col items-stretch gap-2 max-w-xs mx-auto">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                step.isCenter ? "border-foreground/40 bg-surface" : "border-border bg-surface"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                  step.isCenter
                    ? "bg-gradient text-background"
                    : "bg-surface-light border border-border"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{step.label}</p>
                <p className="text-xs text-gray-500 leading-tight">{step.sublabel}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
