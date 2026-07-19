import Link from "next/link";
import ObfuscatedEmail from "./ObfuscatedEmail";

const talks = [
  {
    title: "The AI Sandwich",
    blurb:
      "AI drafts the spec, a deterministic engine generates the service, AI fills in the business logic. Why the boring middle layer is the part most teams are missing.",
    href: "/ai-sandwich",
  },
  {
    title: "Token min-maxxing",
    blurb:
      "Tokenmaxxing is half right. Minimise the tokens spent on deterministic code, maximise the ones that buy judgment: 600 tokens of spec instead of 8,000 tokens of code.",
    href: "/token-min-maxxing",
  },
  {
    title: "Code you can regenerate",
    blurb:
      "Regeneration contracts, extension points, and how generated code survives a year of human edits without a merge conflict.",
    href: "/blog/regeneration",
  },
  {
    title: "CFRs from day zero",
    blurb:
      "Auth, observability, resilience, and audit baked into every generated service instead of retrofitted after the incident.",
  },
  {
    title: "From codebase to bundle",
    blurb:
      "Take the best service your org ever shipped and turn it into a template every team can stamp out.",
  },
];

export default function ContactPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 pb-24 pt-8">
      <header className="mb-14">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
          Speaking and consultancy
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
          Talks and consultancy on enterprise AI engineering
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          I build FixedCode and talk about the patterns underneath it: spec-driven
          generation, regeneration contracts, and how enterprise teams put AI on both
          sides of an engine they can trust. Book me for a conference, a meetup, or
          your engineering org.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Speaking</h2>
        <p className="text-gray-300 leading-relaxed text-[17px] mb-8">
          I do conference sessions, meetup talks, and internal company events. The
          material comes from building FixedCode and from watching AI-assisted
          delivery succeed and fail inside large organisations. Every talk is
          concrete, demo-friendly, and none of it is a product pitch.
        </p>

        <ul className="border-y border-border divide-y divide-border">
          {talks.map((talk) => (
            <li key={talk.title} className="py-5">
              <h3 className="text-lg font-semibold text-white mb-1">{talk.title}</h3>
              <p className="text-gray-400 text-[15px] leading-relaxed">
                {talk.blurb}
                {talk.href && (
                  <>
                    {" "}
                    <Link
                      href={talk.href}
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Read the essay
                    </Link>
                    .
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Consultancy</h2>
        <p className="text-gray-300 leading-relaxed text-[17px] mb-6">
          For companies that want the patterns applied rather than described. A
          typical engagement:
        </p>
        <ol className="space-y-4 mb-6">
          <li className="flex gap-4">
            <span className="font-mono text-sm text-gray-600 pt-0.5 select-none">01</span>
            <p className="text-gray-300 leading-relaxed text-[17px]">
              Assess how your teams use AI today: where it compounds, where it leaks
              quality, and where review has become theatre.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="font-mono text-sm text-gray-600 pt-0.5 select-none">02</span>
            <p className="text-gray-300 leading-relaxed text-[17px]">
              Extract your platform standards into specs and bundles, so the golden
              path is generated rather than documented.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="font-mono text-sm text-gray-600 pt-0.5 select-none">03</span>
            <p className="text-gray-300 leading-relaxed text-[17px]">
              Leave your teams running the sandwich on their own stack, with the
              guardrails encoded in an engine rather than in a wiki.
            </p>
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Booking</h2>
        <p className="text-gray-300 leading-relaxed text-[17px] mb-6">
          Tell me what you are running, the audience, and when, and I will reply
          with availability and an outline.
        </p>

        <ObfuscatedEmail subject="Speaking and consultancy enquiry" />
      </section>
    </article>
  );
}
