"use client";

import { motion } from "framer-motion";
import { PersonIcon, RobotIcon, FactoryIcon } from "./Icons";

type CodeLine = {
  text: string;
  color?: string;
};

const steps = [
  {
    number: "1",
    title: "Request",
    badge: "Human",
    badgeClass: "bg-purple-500/20 text-purple-400",
    icon: <PersonIcon className="w-7 h-7" />,
    description: "Anyone creates a ticket, Slack message, or doc. Plain English requirements. No YAML, no terminal. PM, developer, domain expert: the role does not matter.",
    code: [
      { text: "# Ticket ORD-42 (Jira / Linear / Notion / Slack)", color: "text-gray-500" },
      { text: "" },
      { text: '"We need an order management service', color: "text-purple-400" },
      { text: " with line items, status tracking,", color: "text-purple-400" },
      { text: " and payment integration.", color: "text-purple-400" },
      { text: "" },
      { text: ' Should follow our standard service', color: "text-purple-400" },
      { text: ' patterns with event sourcing."', color: "text-purple-400" },
    ] as CodeLine[],
  },
  {
    number: "2",
    title: "Translate",
    badge: "AI Agent",
    badgeClass: "bg-purple-500/20 text-purple-400",
    icon: <RobotIcon className="w-7 h-7" />,
    description: "AI agent picks up the request from any source. Translates plain English into a YAML domain spec conforming to the org's schema. Asks clarifying questions if needed.",
    code: [
      { text: "# Agent drafts from ORD-42:", color: "text-gray-500" },
      { text: "schema: ddd/1.0", color: "text-blue-400" },
      { text: "boundedContext: Order", color: "text-blue-400" },
      { text: "aggregates:", color: "text-cyan-400" },
      { text: "  Order:", color: "text-white" },
      { text: "    attributes:", color: "text-gray-400" },
      { text: "      orderId!: uuid", color: "text-gray-300" },
      { text: "      customerId!: uuid", color: "text-gray-300" },
      { text: "      status: string = OrderStatus", color: "text-gray-300" },
      { text: "    commands:", color: "text-gray-400" },
      { text: "      - PlaceOrder{customerId!, items!}", color: "text-green-400" },
      { text: "          -> OrderPlaced", color: "text-green-400" },
      { text: "      - CancelOrder(orderId!)", color: "text-green-400" },
      { text: "          -> OrderCancelled", color: "text-green-400" },
    ] as CodeLine[],
  },
  {
    number: "3",
    title: "Generate + Deploy",
    badge: "Automated",
    badgeClass: "bg-blue-500/20 text-blue-400",
    icon: <FactoryIcon className="w-7 h-7" />,
    description: "Spec pushed to standards repo. CI triggers fixedcode generate. Code pushed to service repo. CI/CD deploys. Every CFR built in automatically.",
    code: [
      { text: "$ fixedcode generate --spec order.yaml", color: "text-gray-400" },
      { text: "\u2713 Schema validated: ddd/1.0", color: "text-green-400" },
      { text: "\u2713 Generated 47 files in ~3s", color: "text-green-400" },
      { text: "\u2713 Auth, audit, logging, events, tests", color: "text-green-400" },
      { text: "\u2713 Pushed to order-service repo", color: "text-green-400" },
      { text: "\u2713 CI/CD: build → test → deploy", color: "text-green-400" },
      { text: '\u2713 Agent updates ticket: "Deployed"', color: "text-green-400" },
    ] as CodeLine[],
  },
  {
    number: "4",
    title: "Enrich",
    badge: "Human + AI",
    badgeClass: "bg-cyan-500/20 text-cyan-400",
    icon: <PersonIcon className="w-7 h-7" />,
    description: "The same person (PM, developer, whoever) fills in business logic in extension points with AI assistance. The 10% that is unique. The role boundary has dissolved.",
    code: [
      { text: "// extensions/OrderValidator.kt", color: "text-gray-500" },
      { text: "class OrderValidator :", color: "text-blue-400" },
      { text: "  DefaultOrderValidator() {", color: "text-blue-400" },
      { text: "" },
      { text: "  override fun onPlace(", color: "text-cyan-400" },
      { text: "    cmd: PlaceOrder", color: "text-cyan-400" },
      { text: "  ): ValidationResult {", color: "text-cyan-400" },
      { text: "    // Your business rules here", color: "text-purple-400" },
      { text: "    require(cmd.items.isNotEmpty())", color: "text-white" },
      { text: "    require(cmd.items.all { it.qty > 0 })", color: "text-white" },
      { text: "    return ValidationResult.valid()", color: "text-green-400" },
      { text: "  }", color: "text-blue-400" },
      { text: "}", color: "text-blue-400" },
    ] as CodeLine[],
  },
];

function CodeBlock({ lines }: { lines: CodeLine[] }) {
  return (
    <div className="p-4 text-sm font-mono overflow-x-auto leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} className={line.color || "text-gray-300"}>
          {line.text || "\u00A0"}
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            From ticket to <span className="text-gradient">running service</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Anyone writes a request. AI handles the translation. The engine handles the guarantees. Humans handle the business logic.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            The line between PM and developer blurs. With AI + deterministic generation, anyone who understands the domain can ship a service.
          </p>
        </motion.div>

        <div className="space-y-12 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-[2.25rem] top-12 bottom-12 w-px bg-gradient-to-b from-purple-500 via-blue-500 to-cyan-500 opacity-20" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start"
            >
              {/* Step number and info */}
              <div className="flex-shrink-0 lg:w-80">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
                      {step.icon}
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {step.title}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${step.badgeClass}`}
                      >
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code block */}
              <div className="flex-1 w-full">
                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <span className="ml-2 text-xs text-gray-600 font-mono">
                      {i === 0 ? "ticket" : i === 1 ? "order.yaml" : i === 2 ? "terminal" : "OrderValidator.kt"}
                    </span>
                  </div>
                  <CodeBlock lines={step.code} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Role blurring callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 text-center"
        >
          <p className="text-lg font-semibold text-white mb-2">
            The role boundary is <span className="text-gradient">dissolving</span>
          </p>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Step 1 and Step 4 are done by the same person. A PM who understands the domain can request a service and implement the business rules with AI assistance.
            A developer who understands the platform can improve the templates that make this possible.
            The distinction isn&apos;t PM vs developer. It&apos;s <strong className="text-white">domain knowledge</strong> vs <strong className="text-white">platform knowledge</strong>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
