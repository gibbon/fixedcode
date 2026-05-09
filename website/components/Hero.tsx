"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import SandwichDiagram from "./SandwichDiagram";

const modes = [
  {
    id: "agent",
    label: "AI Agent",
    lines: [
      { type: "human", text: "[ORD-42] New ticket: \"Need an order management service\"" },
      { type: "output", text: "\u2713 Agent picks up request from Jira / Linear / Slack / doc" },
      { type: "output", text: "\u2713 Drafts YAML domain spec → schema validates → conforms to org standards" },
      { type: "output", text: "\u2713 Generated 47 files in ~3s — auth, audit, logging, events, tests" },
      { type: "output", text: "\u2713 Pushed to order-service repo → CI/CD deploying" },
      { type: "output", text: "\u2713 Agent updates ticket: \"Service deployed. Extension points ready.\"" },
    ],
  },
  {
    id: "cli",
    label: "CLI",
    lines: [
      { type: "command", text: "$ fixedcode generate --spec order.yaml --bundle spring-kotlin" },
      { type: "output", text: "\u2713 Schema: ddd/1.0 — valid" },
      { type: "output", text: "\u2713 Generated 47 files in 2.3s — auth, audit, logging, events, tests" },
      { type: "output", text: "\u2713 Extension points: OrderValidator.kt, OrderScorer.kt" },
      { type: "command", text: "$ git push && # CI/CD deploys automatically" },
      { type: "human", text: "\u2713 Fill extension points with business logic → deploy" },
    ],
  },
  {
    id: "pipeline",
    label: "CI Pipeline",
    lines: [
      { type: "command", text: "$ git push origin main  # push order.yaml to standards repo" },
      { type: "output", text: "\u2713 GitHub Actions triggered → fixedcode generate → 47 files" },
      { type: "output", text: "\u2713 PR created on order-service repo → auto-merged" },
      { type: "output", text: "\u2713 CI/CD: build → test → deploy to staging" },
      { type: "output", text: "\u2713 Service running at https://staging.orders.internal" },
      { type: "human", text: "\u2713 PM fills extension points with AI → production ready" },
    ],
  },
];

function useTypewriter(text: string, speed: number = 30, start: boolean = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) {
      setDisplayed("");
      setDone(false);
      return;
    }
    let i = 0;
    setDisplayed("");
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, start]);

  return { displayed, done };
}

function TerminalLine({
  line,
  onDone,
  start,
}: {
  line: { type: string; text: string };
  onDone: () => void;
  start: boolean;
}) {
  const speed = line.type === "command" ? 25 : 15;
  const { displayed, done } = useTypewriter(line.text, speed, start);

  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
  }, [start]);

  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      const delay = line.type === "command" ? 400 : 200;
      const timer = setTimeout(onDone, delay);
      return () => clearTimeout(timer);
    }
  }, [done, onDone, line.type]);

  if (!start) return null;

  if (line.type === "blank") {
    return <div className="h-4" />;
  }

  return (
    <div
      className={`font-mono text-sm leading-relaxed ${
        line.type === "command" ? "text-gray-300" : line.type === "human" ? "text-purple-400" : "text-green-400"
      }`}
    >
      {displayed}
      {!done && (
        <span className="inline-block w-2 h-4 bg-purple-500 ml-0.5 animate-blink align-middle" />
      )}
    </div>
  );
}

export default function Hero() {
  const [activeMode, setActiveMode] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStartAnimation(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const switchMode = (idx: number) => {
    setActiveMode(idx);
    setCurrentLine(0);
    setStartAnimation(false);
    setTimeout(() => setStartAnimation(true), 200);
  };

  const terminalLines = modes[activeMode].lines;

  const advanceLine = () => {
    setCurrentLine((prev) => prev + 1);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-4"
        >
          <SandwichDiagram />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Smaller teams.{" "}
          <span className="text-gradient">Faster delivery. Fewer handoffs.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI + deterministic generation replaces the coordination overhead that slows every software org down.
          <br className="hidden sm:block" />
          <span className="text-base text-gray-500">Create a ticket. Get a running service back. No handoffs.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="https://www.npmjs.com/package/fixedcode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-md"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M0 0v24h24V0H0zm19.2 19.2H12V8.4h7.2v10.8z" />
            </svg>
            npm install fixedcode
          </a>
          <a
            href="https://github.com/gibbon/fixedcode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-gray-300 font-medium text-sm hover:bg-surface-light hover:border-gray-600 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="max-w-2xl mx-auto"
        >
          <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-1">
                {modes.map((mode, idx) => (
                  <button
                    key={mode.id}
                    onClick={() => switchMode(idx)}
                    className={`text-xs font-mono px-3 py-1 rounded transition-colors ${
                      activeMode === idx
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Terminal body */}
            <div className="p-5 min-h-[180px] text-left">
              {terminalLines.map((line, i) => (
                <TerminalLine
                  key={`${activeMode}-${i}`}
                  line={line}
                  start={startAnimation && i <= currentLine}
                  onDone={i === currentLine ? advanceLine : () => {}}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
          />
        </div>
      </motion.div>
    </section>
  );
}
