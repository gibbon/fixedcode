"use client";

import { motion } from "framer-motion";
import { PersonIcon, RobotIcon, FactoryIcon } from "./Icons";

const tiers = [
  {
    name: "Free",
    audience: "Individual Developer",
    price: "$0",
    period: "non-commercial / trial",
    description: "Full CLI for personal projects, evaluation, and non-commercial use. No time limit.",
    icon: <PersonIcon className="w-7 h-7 text-purple-400" />,
    color: "border-border",
    bgColor: "",
    ctaText: "Install from npm",
    ctaHref: "https://www.npmjs.com/package/fixedcode",
    ctaClass: "border border-border text-gray-300 hover:bg-surface-light",
    features: [
      { text: "FixedCode CLI — capture, generate, validate", included: true },
      { text: "Local schemas and bundles", included: true },
      { text: "AI-assisted spec drafting", included: true },
      { text: "Regeneration contract", included: true },
      { text: "Extension point system", included: true },
      { text: "Community support (GitHub)", included: true },
      { text: "Shared team registry", included: false },
      { text: "Pipeline integrations", included: false },
      { text: "Audit logs", included: false },
    ],
  },
  {
    name: "Team",
    audience: "Engineering Team",
    price: "$99",
    period: "/month per team",
    description: "Shared schemas across a team. Consistent patterns without coordination overhead.",
    icon: <RobotIcon className="w-7 h-7 text-blue-400" />,
    color: "border-blue-500/30",
    bgColor: "",
    ctaText: "Start Free Trial",
    ctaClass: "border border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Shared team schema registry", included: true },
      { text: "Team bundle sharing", included: true },
      { text: "GitHub Actions integration", included: true },
      { text: "GitLab CI integration", included: true },
      { text: "Schema versioning", included: true },
      { text: "Up to 20 team members", included: true },
      { text: "Email support", included: true },
      { text: "Custom pipeline adapters", included: false },
    ],
  },
  {
    name: "Organisation",
    audience: "Platform Team",
    price: "$499",
    period: "/month",
    description: "Encode your platform's standards. Every service gets every CFR from day zero.",
    icon: <FactoryIcon className="w-7 h-7 text-cyan-400" />,
    color: "border-cyan-500/30",
    bgColor: "ring-1 ring-purple-500/20",
    highlight: true,
    ctaText: "Contact Us",
    ctaClass: "bg-gradient text-white hover:opacity-90",
    features: [
      { text: "Everything in Team", included: true },
      { text: "Unlimited teams and members", included: true },
      { text: "Private organisation registry", included: true },
      { text: "Custom pipeline adapters", included: true },
      { text: "Input adapters (Slack bot, Jira webhook)", included: true },
      { text: "Schema authoring tooling", included: true },
      { text: "Regeneration manifest + tracking", included: true },
      { text: "Priority support", included: true },
      { text: "Onboarding session", included: true },
    ],
  },
  {
    name: "Enterprise",
    audience: "Regulated Industry",
    price: "Custom",
    period: "",
    description: "Provable compliance for AI-generated code. Audit trails for regulators.",
    icon: <FactoryIcon className="w-7 h-7 text-green-400" />,
    color: "border-green-500/30",
    bgColor: "",
    ctaText: "Talk to Us",
    ctaClass: "border border-green-500/30 text-green-400 hover:bg-green-500/10",
    features: [
      { text: "Everything in Organisation", included: true },
      { text: "Full audit logs — who generated what, when, from which template", included: true },
      { text: "Compliance manifests for regulators", included: true },
      { text: "SSO / SAML integration", included: true },
      { text: "Custom schema design consulting", included: true },
      { text: "SLA with guaranteed response times", included: true },
      { text: "Dedicated support channel", included: true },
      { text: "On-premise deployment option", included: true },
      { text: "Security review + SOC2 documentation", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gradient">Pricing</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Open-source at the core. Pay for collaboration, governance, and compliance as you scale.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`rounded-xl border ${tier.color} ${tier.bgColor} bg-surface p-6 flex flex-col relative ${
              tier.highlight ? "shadow-lg shadow-purple-500/10" : ""
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-gradient text-white uppercase tracking-wider">
                  Most Popular
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center">
                {tier.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-gray-500">{tier.audience}</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-white">{tier.price}</span>
              {tier.period && (
                <span className="text-sm text-gray-500 ml-1">{tier.period}</span>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-6">{tier.description}</p>

            <a
              href={tier.ctaHref ?? 'https://github.com/gibbon/fixedcode'}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-6 ${tier.ctaClass}`}
            >
              {tier.ctaText}
            </a>

            <div className="border-t border-border pt-4 flex-1">
              <ul className="space-y-3">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    {feature.included ? (
                      <svg className="w-4 h-4 text-green-500/60 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`text-xs ${feature.included ? "text-gray-300" : "text-gray-600"}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ / Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-center mb-8">Common questions</h2>
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Is the engine really free?</h3>
            <p className="text-sm text-gray-400">
              The CLI is free for non-commercial use, personal projects, and evaluation — no time limit. Commercial
              use requires a paid tier starting at Team. This lets you try everything before committing, while
              ensuring the project is sustainable.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-white mb-2">What about the schemas and bundles?</h3>
            <p className="text-sm text-gray-400">
              Starter schemas ship with the engine as examples. Your production schemas and bundles are yours — you
              build them with AI, store them in your git, and they encode your org&apos;s specific standards. We
              don&apos;t host or sell bundles. The product is the engine and the workflow.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Do we need the Organisation tier to use pipeline integrations?</h3>
            <p className="text-sm text-gray-400">
              Basic GitHub Actions and GitLab CI integrations are included in Team. The Organisation tier adds
              custom pipeline adapters, input adapters (Slack bot, Jira webhooks), and the full end-to-end pipeline
              where a ticket becomes a deployed service automatically.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Can we try it before committing?</h3>
            <p className="text-sm text-gray-400">
              The Free tier is fully functional for individual use. For Team and Organisation, we offer a 14-day
              free trial. Enterprise engagements start with a discovery session to understand your platform and standards.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
