"use client";

import { motion } from "framer-motion";
import { useState } from "react";

function PatentBadge() {
  const [clicked, setClicked] = useState(false);

  return (
    <span className="relative inline-block ml-3 align-top">
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

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

export default function AISandwichDetail() {
  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      {/* Header */}
      <motion.div {...fadeUp} className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          The <span className="text-gradient">AI Sandwich</span>
          <PatentBadge />
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          AI is creative but inconsistent. Deterministic generation is
          consistent but can&apos;t think. The AI Sandwich uses both where
          they&apos;re strongest.
        </p>
      </motion.div>

      {/* The core concept */}
      <motion.div {...fadeUp} className="mb-16">
        <h2 className="text-2xl font-bold mb-6">The Core Idea</h2>
        <p className="text-gray-400 leading-relaxed mb-4">
          Every service has two kinds of code: <strong className="text-white">structural code</strong> that
          should be identical across all services (auth, logging, events, audit,
          persistence, tests) and <strong className="text-white">business logic</strong> that&apos;s unique to
          each service. Today, AI generates both — and gets the structural part
          different every time.
        </p>
        <p className="text-gray-400 leading-relaxed">
          The AI Sandwich separates them. AI handles the creative work at the
          top and bottom. Deterministic generation handles the structural
          guarantees in the middle. Same spec, identical output, every time.
        </p>
      </motion.div>

      {/* Three layers */}
      <motion.div {...fadeUp} className="mb-16">
        <h2 className="text-2xl font-bold mb-6">The Three Layers</h2>
        <div className="flex flex-col gap-4">
          {/* Layer 1 */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-600/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">
                Layer 1: AI + Human (Creative)
              </h3>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400">
                Non-deterministic
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              This layer has two distinct activities, done by different people at different times:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border border-purple-500/20 bg-black/20 p-4">
                <h4 className="text-sm font-semibold text-white mb-1">Domain Specs</h4>
                <p className="text-xs text-purple-400 mb-2">PM / Domain Expert</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Defines <em>what</em> to build. A PM writes &quot;we need an order
                  management service with line items and payment integration&quot;
                  in a Jira ticket or Slack message. AI translates that into a YAML
                  domain spec conforming to the org&apos;s schema. The PM never
                  writes YAML — they write plain English.
                </p>
              </div>
              <div className="rounded-lg border border-purple-500/20 bg-black/20 p-4">
                <h4 className="text-sm font-semibold text-white mb-1">Template Curation</h4>
                <p className="text-xs text-purple-400 mb-2">Developer / Platform Team</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Defines <em>how</em> to build it. AI extracts patterns from existing
                  services into schemas and templates. Human refines iteratively
                  until the output is production-grade. This isn&apos;t one-click —
                  it requires domain expertise guiding AI through many iterations.
                  Done once, benefits every service forever.
                </p>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-gradient-to-b from-purple-500 to-blue-500" />
          </div>

          {/* Layer 2 */}
          <div className="rounded-xl border border-blue-500/30 bg-surface p-6 ring-1 ring-purple-500/20 shadow-lg shadow-black/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gradient">
                Layer 2: FixedCode (Deterministic)
              </h3>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gradient text-white">
                Always identical
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              The engine takes a YAML domain spec and generates a complete
              service from it — deterministically. Same spec produces identical
              output every time, in about 3 seconds. No randomness, no
              variation, no drift.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Every cross-functional requirement is built in from the templates:
              auth with policy engine, audit trails on every entity, structured
              logging with correlation IDs, event sourcing with outbox pattern,
              database migrations, integration tests, black-box API tests. The
              developer never wires any of this up. It&apos;s generated.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border border-border bg-surface-light p-4">
                <p className="text-xs text-gray-500 mb-2">Generated files include:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>Domain model (aggregates, entities, events)</li>
                  <li>Command/query handlers with validation</li>
                  <li>REST controllers + OpenAPI specs</li>
                  <li>Persistence + Flyway migrations</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-surface-light p-4">
                <p className="text-xs text-gray-500 mb-2">
                  Infrastructure (all generated):
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>Auth + policy engine with field filtering</li>
                  <li>Event sourcing with outbox pattern</li>
                  <li>Structured JSON logging + correlation IDs</li>
                  <li>Integration + black-box API tests</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="text-xs text-purple-400 mb-2">
                The regeneration contract:
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white font-medium">Regenerated files</p>
                  <p className="text-gray-500 text-xs">
                    Owned by the engine. Overwritten on every run. Never edit
                    these.
                  </p>
                </div>
                <div>
                  <p className="text-white font-medium">Once files</p>
                  <p className="text-gray-500 text-xs">
                    Created once by the engine. Developer modifies. Never
                    touched again on regenerate.
                  </p>
                </div>
                <div>
                  <p className="text-white font-medium">Extension points</p>
                  <p className="text-gray-500 text-xs">
                    Stub created if missing. Developer fills in logic. Never
                    overwritten.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-gradient-to-b from-blue-500 to-cyan-500" />
          </div>

          {/* Layer 3 */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-600/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">
                Layer 3: AI + Human (Creative)
              </h3>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                The custom parts
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              The generated service has clearly marked extension points — interfaces
              with default implementations. This is where the business logic goes.
              The parts that are unique to this specific service: validation rules,
              domain-specific calculations, custom integrations, regional overrides.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              AI assists here too. A developer (or PM) uses Claude Code, Cursor,
              or any AI tool to implement the business rules in the extension
              points. This is the 10% of the code that actually needs human
              thought — the rest is generated.
            </p>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-gray-500 mb-2">
                What goes in extension points:
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>Business validation rules (e.g. order minimum, credit checks)</li>
                <li>Domain-specific calculations (e.g. pricing, scoring)</li>
                <li>Custom integrations that don&apos;t fit templates (e.g. third-party APIs)</li>
                <li>Regional overrides (e.g. country-specific tax rules)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Why this matters */}
      <motion.div {...fadeUp} className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Why This Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Without the sandwich
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI generates everything — structural code and business logic
              together. The output is different every time. Review agents try to
              catch violations. Humans review what agents flag. The entire
              pipeline exists to compensate for non-deterministic output. At 50
              services, stuff slips through. Every team interprets the patterns
              differently.
            </p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              With the sandwich
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Structural code is generated from reviewed templates — known-good
              by construction. Only extension points need human review (about
              10% of the code). Templates improve, you regenerate, every service
              gets the upgrade. Violations are structurally impossible. The
              review burden drops. The coordination overhead between teams
              largely disappears.
            </p>
          </div>
        </div>
      </motion.div>

      {/* The pipeline */}
      <motion.div {...fadeUp} className="mb-16">
        <h2 className="text-2xl font-bold mb-6">The Full Pipeline</h2>
        <p className="text-gray-400 leading-relaxed mb-6">
          The AI Sandwich isn&apos;t a manual three-step process. It&apos;s an
          automated pipeline. A PM creates a Jira ticket or Slack message. An
          AI agent picks it up, translates it to a YAML domain spec, pushes it
          to a standards repo. CI triggers FixedCode to generate the service.
          CI/CD deploys it. The PM fills in business logic in extension points
          with AI help.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            {
              step: "1",
              title: "Request",
              desc: "Jira ticket, Slack, or CLI",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              step: "2",
              title: "Translate",
              desc: "AI drafts YAML domain spec",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              step: "3",
              title: "Generate",
              desc: "FixedCode, deterministic",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              step: "4",
              title: "Deploy",
              desc: "CI/CD, automated",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              step: "5",
              title: "Enrich",
              desc: "Business logic, AI-assisted",
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
            },
          ].map((s) => (
            <div
              key={s.step}
              className={`rounded-lg border border-border ${s.bg} p-3 text-center`}
            >
              <div
                className={`text-lg font-bold ${s.color} mb-1`}
              >
                {s.step}
              </div>
              <div className="text-xs font-medium text-white">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Who does what */}
      <motion.div {...fadeUp}>
        <h2 className="text-2xl font-bold mb-6">Who Does What</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-purple-500/20 bg-surface p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">
              PM / Domain Expert
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Writes requirements in plain English. AI translates to YAML domain
              spec. Schema validates it — if it conforms, the output is
              guaranteed correct. PM implements business rules in extension
              points with AI help. No infrastructure, no waiting for developers.
            </p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-surface p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">
              Developer
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Curates and evolves templates with AI. Handles service-specific
              code that doesn&apos;t fit generation. Manages schemas, enrichment
              rules, and extension point boundaries. Shifts from hand-wiring
              services to improving the platform.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-surface p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">
              Platform Team
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Encodes standards into schemas and templates once. Owns the
              pipeline. Improves a template, regenerates, every service across
              every team upgrades. Never answers the same CFR question twice.
              The schema is the answer.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
