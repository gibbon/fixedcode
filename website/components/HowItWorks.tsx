"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    title: "Request",
    badge: "Human",
    badgeClass: "bg-purple-500/20 text-purple-400",
    description: "PM creates a Jira ticket, Slack message, or markdown doc. Plain English requirements. No YAML, no terminal.",
    code: `# Jira ticket ORD-42

"We need an order management service
with line items, status tracking,
and payment integration.

Should follow our standard service
patterns with event sourcing."`,
  },
  {
    number: "2",
    title: "Translate",
    badge: "AI Agent",
    badgeClass: "bg-purple-500/20 text-purple-400",
    description: "AI agent picks up the request. Translates plain English into a YAML domain spec conforming to the org's schema. Asks clarifying questions if needed.",
    code: `# Agent drafts from ORD-42:
schema: ddd/1.0
boundedContext: Order
aggregates:
  Order:
    attributes:
      orderId!: uuid
      customerId!: uuid
      status: string = OrderStatus
    commands:
      - PlaceOrder{customerId!, items!}
          -> OrderPlaced
      - CancelOrder(orderId!) -> OrderCancelled`,
  },
  {
    number: "3",
    title: "Generate + Deploy",
    badge: "Automated",
    badgeClass: "bg-blue-500/20 text-blue-400",
    description: "Spec pushed to standards repo. CI triggers fixedcode generate. Code pushed to service repo. CI/CD deploys. Every CFR built in.",
    code: `$ fixedcode generate --spec order.yaml
\u2713 Generated 47 files in 2.3s
\u2713 Auth, audit, logging, events, tests
\u2713 Pushed to order-service repo
\u2713 CI/CD pipeline triggered
\u2713 Agent updates ORD-42: "Service deployed"`,
  },
  {
    number: "4",
    title: "Enrich",
    badge: "Human + AI",
    badgeClass: "bg-purple-500/20 text-purple-400",
    description: "PM or developer fills in business logic in extension points, assisted by AI. The only code that needs human thought — the 10% that's unique.",
    code: `// extensions/OrderValidator.kt
class OrderValidator :
  DefaultOrderValidator() {

  override fun onPlace(
    cmd: PlaceOrder
  ): ValidationResult {
    // Your business rules here
    require(cmd.items.isNotEmpty())
    require(cmd.items.all { it.qty > 0 })
    return ValidationResult.valid()
  }
}`,
  },
];

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
            From Jira ticket to <span className="text-gradient">running service</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            PM writes a request. AI handles the rest. Humans focus on the business logic that matters.
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
              <div className="flex-shrink-0 lg:w-72">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-gradient flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
                      {step.number}
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
                  </div>
                  <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
                    {step.code}
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
