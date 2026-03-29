"use client";

import { motion } from "framer-motion";
import { PersonIcon as Person, RobotIcon as Robot, FactoryIcon as Factory } from "./Icons";

function Arrow({ className = "", reverse = false }: { className?: string; reverse?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {reverse ? (
        <>
          <path d="M40 12H8" />
          <path d="M16 6l-8 6 8 6" />
        </>
      ) : (
        <>
          <path d="M8 12h32" />
          <path d="M32 6l8 6-8 6" />
        </>
      )}
    </svg>
  );
}

const steps = [
  { icon: Person, label: "Human", sublabel: "Requirements", color: "text-purple-400", glow: "rgba(168, 85, 247, 0.4)" },
  { icon: null, label: "", sublabel: "", color: "", isArrow: true },
  { icon: Robot, label: "AI", sublabel: "Domain spec + templates", color: "text-purple-400", glow: "rgba(168, 85, 247, 0.4)" },
  { icon: null, label: "", sublabel: "", color: "", isArrow: true },
  { icon: Factory, label: "FixedCode", sublabel: "Deterministic generation", color: "text-blue-400", isCenter: true, glow: "rgba(59, 130, 246, 0.5)" },
  { icon: null, label: "", sublabel: "", color: "", isArrow: true },
  { icon: Robot, label: "AI", sublabel: "Business logic", color: "text-cyan-400", glow: "rgba(6, 182, 212, 0.4)" },
  { icon: null, label: "", sublabel: "", color: "", isArrow: true },
  { icon: Person, label: "Human", sublabel: "Review + ship", color: "text-cyan-400", glow: "rgba(6, 182, 212, 0.4)" },
];

export default function SandwichDiagram() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((step, i) => {
          if (step.isArrow) {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex-shrink-0"
              >
                <Arrow className="w-8 sm:w-12 h-6 text-gray-500" />
              </motion.div>
            );
          }

          const Icon = step.icon!;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }}
              whileHover={{
                scale: 1.1,
                filter: `drop-shadow(0 0 20px ${step.glow})`,
                transition: { duration: 0.15, delay: 0 },
              }}
              viewport={{ once: true }}
              className={`flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer ${
                step.isCenter ? "relative" : ""
              }`}
              style={{ filter: "drop-shadow(0 0 0px transparent)" }}
            >
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center ${
                  step.isCenter
                    ? "bg-gradient shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/30"
                    : "bg-surface border border-border"
                }`}
              >
                <Icon
                  className={`w-7 h-7 sm:w-9 sm:h-9 ${
                    step.isCenter ? "text-white" : step.color
                  }`}
                />
              </div>
              <div className="text-center">
                <p
                  className={`text-xs sm:text-sm font-semibold ${
                    step.isCenter ? "text-gradient" : step.color
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 max-w-[80px] sm:max-w-[100px]">
                  {step.sublabel}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
