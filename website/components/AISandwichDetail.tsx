import SandwichDiagram from "./SandwichDiagram";

export default function AISandwichDetail() {
  return (
    <article className="max-w-3xl mx-auto px-6 pb-24 pt-8">
      <header className="mb-12">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">Essay</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
          The AI Sandwich
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          AI is good at writing code. It is not good at writing the same code twice.
        </p>
      </header>

      <div className="prose-content text-gray-300 leading-relaxed space-y-6 text-[17px]">
        <p>
          This is the bug at the heart of the current AI-codegen wave. Individual developers are
          dramatically faster. Whole organisations are not &mdash; and in many cases they are
          getting slower in the way that actually matters: the time it takes for an idea in
          someone&apos;s head to become a service in production that meets the rest of the
          org&apos;s standards.
        </p>
        <p>
          We built FixedCode to make this go away. The structural answer we landed on is
          something we call the AI sandwich. On reflection it is fairly obvious. It is not what
          most teams are doing right now, though, and the gap between &ldquo;what we&apos;re
          doing&rdquo; and &ldquo;what would actually work&rdquo; is large enough that it&apos;s
          worth writing down.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Two kinds of code</h2>
        <p>
          Every backend service contains two categories of code, and they have different
          requirements.
        </p>
        <p>
          The first is <strong className="text-white">structural code</strong>. Authentication.
          Logging. Persistence. Audit trails. Event publishing. Migrations. Tests for all of the
          above. This code should be functionally identical across every service in the org. If
          your <code className="text-gray-200">OrderService</code> and your{" "}
          <code className="text-gray-200">InvoiceService</code> handle auth differently, you have
          a bug &mdash; possibly a security bug. The fact that nobody filed it as a bug means
          nothing.
        </p>
        <p>
          The second is <strong className="text-white">business logic</strong>. The validation
          rules that say an order can&apos;t have a negative quantity. The pricing function that
          depends on customer tier and region. The integration with whatever third-party API
          exists in your particular industry. This code is, by definition, different in every
          service. That&apos;s the point.
        </p>
        <p>
          Existing AI coding tools &mdash; Cursor, Claude Code, Copilot, the whole genre &mdash;
          generate both categories with the same machinery. You ask for &ldquo;an order
          management service with validation and pagination&rdquo;, and the model writes you a
          service. The pricing function looks reasonable. The auth code is also reasonable. It
          is not, however, the same as the auth code in the other forty-seven services your org
          has shipped this quarter. Each of them is, in its own quiet way, slightly wrong.
        </p>
        <p>This is fine if you have one service. It is a real problem if you have fifty.</p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          What scaffolding got right, and wrong
        </h2>
        <p>
          Deterministic scaffolding has been around forever. Yeoman, Cookiecutter, Rails
          generators, the Backstage scaffolder, internal tools at every reasonably-sized
          company. The shape is always the same: write some templates, parameterise them, run a
          generator, get back a project skeleton.
        </p>
        <p>
          What scaffolding gets right is the property AI lacks: same input, same output. If your
          template is correct, every service generated from it is correct in the same way. You
          can review the template once and inherit confidence in everything downstream of it.
        </p>
        <p>What scaffolding gets wrong is everything else.</p>
        <p>
          The interface is hostile. Authoring a YAML spec to describe a service that
          doesn&apos;t exist yet is tedious in a way that LLMs are specifically good at
          relieving. Maintaining the templates themselves is worse &mdash; anyone who has tried
          to keep an organisation-wide cookiecutter alive past the first eighteen months knows
          what a slow grind it becomes.
        </p>
        <p>
          Then there is the regeneration problem. Most scaffolding is fire-and-forget. It
          generates your project skeleton and walks away. When you improve the template six
          months later, you have no way to ship the improvement to existing services &mdash;
          they have forked. The clean structural property dissolves immediately. Backstage tried
          to solve this with templated software catalogues, but the experience is still
          substantively that you generate, customise, and then the template&apos;s connection to
          the output is severed. If you want to change auth across all your services, you find
          them, you patch them, you cry.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">The sandwich</h2>
        <p>
          The structural answer is to put deterministic generation between two layers of AI:
        </p>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong className="text-white">Top slice (AI).</strong> Translate intent into a
            spec. Translate examples into templates. The creative work that benefits from a
            model that can think about meaning.
          </li>
          <li>
            <strong className="text-white">Middle (deterministic).</strong> A spec, a template,
            an engine. Same input, identical output, every time. The reproducible work that
            benefits from being a function rather than a chat.
          </li>
          <li>
            <strong className="text-white">Bottom slice (AI).</strong> Fill in business logic in
            clearly-marked extension points after generation. The bespoke work that has to be
            different in every service.
          </li>
        </ul>

        <div className="my-10">
          <SandwichDiagram />
        </div>

        <p>
          The model never touches the structural code. It writes the spec that describes what
          should exist, and it writes the bespoke logic that goes inside the generated shell.
          The engine is responsible for the part that has to be the same across services. The
          model is responsible for the parts that have to be different.
        </p>
        <p>
          This is not a clever architecture. It is what you get when you ask which parts of the
          system should be deterministic and which parts should be creative, and answer the
          question honestly.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          Why deterministic belongs in the middle
        </h2>
        <p>
          There are three properties that deterministic generation gives you, and that AI
          generation cannot.
        </p>
        <p>
          <strong className="text-white">Reviewability.</strong> When you review a template
          once, you have reviewed every service generated from it. When you review the output of
          an LLM, you have reviewed only that output. At one service this distinction is
          invisible. At fifty services it is the entire ballgame. Most engineering
          organisations cannot review fifty services per quarter at the depth that would
          actually catch the auth, logging and audit issues that matter &mdash; and so they
          don&apos;t.
        </p>
        <p>
          <strong className="text-white">Regeneration.</strong> Because the output is a function
          of the input, you can run the function again. When the template improves, every
          service inherits the improvement on the next regeneration. This sounds obvious; in
          practice it is the property that scaffolding has historically failed to deliver,
          because once you have hand-edited the generated code to add business logic,
          regeneration overwrites your work.
        </p>
        <p>
          <strong className="text-white">Auditability.</strong> The contents of any generated
          file are derivable from the spec, the template and the engine version. Compliance
          people care about this a great deal &mdash; they want to know not just{" "}
          <em>what</em> code is in production but <em>why</em>. &ldquo;Generated from spec at
          hash X by engine version Y&rdquo; is a much better answer than &ldquo;an LLM emitted
          it on the third attempt&rdquo;.
        </p>
        <p>
          The sandwich preserves all three because the middle layer is genuinely deterministic.
          The top and bottom layers can be as creative and stochastic as you like &mdash; they
          are producing inputs and extensions, not the structural code that has to be reviewed,
          regenerated and audited.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">The regeneration contract</h2>
        <p>
          Regeneration only works if there is a clear protocol for which files the engine owns
          and which files the human owns. We landed on three categories.
        </p>
        <p>
          <strong className="text-white">Regenerated files</strong> are owned by the engine and
          overwritten on every run. You do not edit these. The repository&apos;s{" "}
          <code className="text-gray-200">.fixedcode-manifest.json</code> records every one of
          them with its hash. If you do edit one, you have created drift, which the engine will
          surface and the next regeneration will erase.
        </p>
        <p>
          <strong className="text-white">Once files</strong> are created by the engine the first
          time and then never touched again. These are typically configuration files where the
          engine has an opinion about the initial contents but the team will evolve them
          afterwards: <code className="text-gray-200">application.yml</code>, the root README,
          the Dockerfile.
        </p>
        <p>
          <strong className="text-white">Extension points</strong> are stub files the engine
          creates if missing and ignores if present. This is where business logic goes. The
          engine creates <code className="text-gray-200">OrderValidator.kt</code> with a default
          implementation that does nothing useful; the developer (or the model) replaces it with
          the actual validation rules; from then on regeneration leaves it alone.
        </p>
        <p>
          Together these three categories make the central trick possible: you can keep
          regenerating forever without losing custom work, because the engine has explicit,
          declared ownership of every file it touches.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          What changes about how you build software
        </h2>
        <p>
          Once the structural code is generated reliably, the activity of building a service
          decomposes differently than before.
        </p>
        <p>
          The old shape was: someone with domain knowledge writes requirements, hands them to a
          developer, who hand-wires the service while consulting the platform team about the
          standards. Multiple roles, multiple handoffs, multiple weeks. AI tooling can compress
          the developer&apos;s part of this loop by perhaps an order of magnitude, but it
          doesn&apos;t remove the handoffs, and it actively makes the standards-consistency
          problem worse.
        </p>
        <p>
          The sandwich shape is: someone with domain knowledge describes the service in plain
          English, an AI agent translates that into a spec, the engine generates the structural
          code, and then the same person (or a different person, it doesn&apos;t matter) fills
          in the business logic with AI assistance. The platform team&apos;s work is in the
          templates, where it compounds &mdash; every service ever generated benefits from every
          template improvement.
        </p>
        <p>
          The boundary that dissolves is between PM, developer and platform engineer. What
          replaces it is a boundary between <strong className="text-white">domain knowledge</strong>{" "}
          (what should this service do, what are the rules, what is the data model) and{" "}
          <strong className="text-white">platform knowledge</strong> (how should services be
          built in this org, what are the patterns, where are the seams). Both are real and
          necessary. Neither has to be embodied in a particular job title.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">What this isn&apos;t</h2>
        <p>A few things we want to be honest about.</p>
        <p>
          It is not a no-code tool. The bespoke parts of every service still have to be
          written. The model can help, but somebody still has to know whether the validation
          rule is right.
        </p>
        <p>
          It is not free. Building a good template bundle is real work &mdash; comparable to
          the effort of writing one good service by hand, except that the result then applies
          to every subsequent service. The leverage is real but not immediate.
        </p>
        <p>
          It is not for tiny teams. If you have one service you do not have a consistency
          problem; the whole apparatus is overhead. The wedge appears around the time you have
          five or ten services and a small platform team that is already overloaded. It widens
          from there.
        </p>
        <p>
          It is not anti-AI. Quite the opposite. The sandwich exists specifically so the model
          can be fully unleashed on the parts where its creativity is an asset, without being
          asked to also be deterministic in the parts where it can&apos;t. Asking an LLM to be
          reproducible is asking a fish to walk.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          Why this hasn&apos;t happened already
        </h2>
        <p>
          It has, sort of. Big tech firms have been building variants of the sandwich
          internally for years &mdash; Google&apos;s protobuf-driven service generation,
          Meta&apos;s codegen chains, Amazon&apos;s Smithy. These are all instances of the same
          idea: define the service in a spec, generate the structural code from it, and let
          humans focus on the bespoke parts. The model layer is recent. The underlying shape
          isn&apos;t.
        </p>
        <p>
          What&apos;s different now is that the top and bottom slices can be genuinely
          automated for the first time. Spec authoring used to be the bottleneck that kept this
          approach from spreading beyond companies that could afford a dedicated DSL team. AI
          removes that bottleneck. The engine that does the deterministic middle is
          straightforward &mdash; most of the engineering at FixedCode has gone into making the
          regeneration contract bulletproof and the templates pleasant to write &mdash; but
          it&apos;s the AI layer on either side that turns the architecture into something a
          normal engineering org can actually adopt.
        </p>
        <p>
          If you have more than a handful of services and you&apos;re starting to feel the
          consistency drift that AI-accelerated development tends to cause, the sandwich is the
          shape to consider. It doesn&apos;t have to be ours &mdash; you can build it
          yourself, and we have a reasonable amount of detail in the docs about how to do
          exactly that &mdash; but the principle is what matters. Don&apos;t ask the model to
          be deterministic. Put a deterministic engine between two layers of model, and you can
          have both.
        </p>
      </div>

      <footer className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          FixedCode is open source under Apache-2.0.
        </div>
        <div className="flex gap-3">
          <a
            href="https://github.com/gibbon/fixedcode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-lg border border-border text-gray-300 hover:bg-surface-light hover:border-gray-600 transition-all"
          >
            View on GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/fixedcode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-lg bg-gradient text-white hover:opacity-90 transition-opacity"
          >
            npm install fixedcode
          </a>
        </div>
      </footer>
    </article>
  );
}
