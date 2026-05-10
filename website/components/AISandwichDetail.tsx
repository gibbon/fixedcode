import SandwichDiagram from "./SandwichDiagram";

export default function AISandwichDetail() {
  return (
    <article className="max-w-3xl mx-auto px-6 pb-24 pt-8">
      <header className="mb-10">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">Essay</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
          The AI Sandwich
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          AI is good at writing code. It is bad at writing the same code twice.
        </p>
      </header>

      <div className="prose-content text-gray-300 leading-relaxed space-y-6 text-[17px]">
        <p>
          For the past two years I have been watching teams adopt AI coding tools and ship more
          services per week than they ever did. The same teams have been quietly drifting. Every
          new service has slightly different auth wiring, slightly different log formatting,
          slightly different audit trails. Each version is reasonable on its own. None of them
          match each other.
        </p>
        <p>This is fine if you ship one service. It is a real problem if you ship fifty.</p>
        <p>
          I built FixedCode because I think the fix is structural. The architecture I landed on
          is something I call the AI sandwich, and it is the rest of this post.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Two kinds of code</h2>
        <p>
          Every backend service contains two kinds of code, and they want different things from
          a generator.
        </p>
        <p>
          The first is structural code: authentication, logging, persistence, audit trails,
          event publishing, migrations, tests for all of it. This code should be functionally
          identical across every service in the org. If your{" "}
          <code className="text-gray-200">OrderService</code> and your{" "}
          <code className="text-gray-200">InvoiceService</code> handle auth differently, you have
          a bug. Possibly a security bug.
        </p>
        <p>
          The second is business logic: validation rules, pricing functions, integrations with
          whatever third-party API your industry happens to use. This code is, by definition,
          different in every service. That is the point.
        </p>
        <p>
          Existing AI coding tools generate both kinds with the same machinery. You ask for
          &ldquo;an order management service with validation and pagination&rdquo; and the model
          writes you a service. The pricing function looks reasonable. The auth code is also
          reasonable. It is not the same as the auth code in the other forty-seven services your
          org has shipped this quarter.
        </p>
        <p>That is the whole problem in one sentence.</p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">What scaffolding got right</h2>
        <p>
          Deterministic scaffolding has been around for ever. Yeoman, Cookiecutter, Rails
          generators, Backstage, every reasonably-sized company&apos;s internal tools. Same shape
          every time: write some templates, parameterise them, run a generator, get a project
          skeleton.
        </p>
        <p>
          What scaffolding got right is the property AI lacks: same input, same output. Review
          the template once and you have reviewed every service generated from it.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">What scaffolding got wrong</h2>
        <p>
          The interface is hostile. Writing YAML to describe a service that does not exist yet
          is tedious, and tedium is exactly what AI is good at relieving.
        </p>
        <p>
          Maintaining the templates is worse. Anyone who has tried to keep an org-wide
          cookiecutter alive for eighteen months knows it slowly turns into a second job.
        </p>
        <p>
          And most scaffolding is fire-and-forget. You generate the project skeleton and the
          generator walks away. When you improve the template six months later there is no path
          to ship the improvement to existing services. They have forked. Backstage tried to
          solve this with templated software catalogues, but the experience is still
          substantively that you generate, you customise, and the template&apos;s connection to
          the output is severed.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">You already trust some of this</h2>
        <p>
          Most engineers already trust deterministic codegen for one thing: API clients. You
          write an OpenAPI spec, you run{" "}
          <code className="text-gray-200">openapi-generator</code>, and you get a typed client in
          TypeScript or Kotlin or Python. Every team gets the same client for the same API.
          Nobody hand-rolls HTTP code, because the spec to client transformation is too
          obviously a function to do by hand.
        </p>
        <p>
          OpenAPI works because the contract between the spec and the generated code is
          unambiguous, the regeneration loop is fast, and the cost of a hand-edit is so high
          that nobody is tempted. None of that is unique to HTTP. The same property is available
          for auth, persistence, event publishing, audit, and the rest of the structural layer.
          You just need a generator that handles them with the same discipline. That is what
          FixedCode is. The AI sandwich is what you do once you have one.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">The sandwich</h2>
        <p>The architecture is to put deterministic generation between two layers of AI.</p>

        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
{`Top layer    (AI):       intent          ->  spec
Middle       (engine):   spec            ->  code   (deterministic)
Bottom layer (AI):       business logic  ->  extension points`}
        </pre>

        <p>
          Top: an AI agent translates plain English (&ldquo;we need an order management service
          with line items and payment integration&rdquo;) into a YAML spec that conforms to the
          org&apos;s schema.
        </p>
        <p>
          Middle: the FixedCode engine reads the spec and generates a complete service. Same
          spec, same files, every time. About three seconds for a typical Spring Kotlin service.
        </p>
        <p>
          Bottom: the engine leaves clearly-marked extension points. Validation rules, pricing
          functions, the parts that have to be unique to this service. AI fills those in too.
        </p>
        <p>The model never touches structural code. The engine never tries to be creative.</p>

        <p>Here is what running the middle slice looks like:</p>

        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
{`$ fixedcode generate order.yaml -o order-service
✓ Schema valid: ddd/1.0
✓ Generated 47 files in 2.3s
✓ Extension points: OrderValidator.kt, OrderScorer.kt`}
        </pre>

        <div className="my-10">
          <SandwichDiagram />
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          Why deterministic belongs in the middle
        </h2>
        <p>
          Three properties that you cannot get out of an LLM, no matter how good your prompt is.
        </p>
        <p>
          <strong className="text-white">Reviewability.</strong> Review the template once and
          you have reviewed every service generated from it. Review LLM output and you have
          reviewed only that output. At one service this distinction is invisible. At fifty it
          dominates the math, because no engineering org reviews fifty services per quarter at
          the depth that would catch the auth, logging and audit issues that matter.
        </p>
        <p>
          <strong className="text-white">Regeneration.</strong> Because the output is a function
          of the input, you can run the function again. When the template improves, every
          service inherits the improvement on the next run. Scaffolding has historically failed
          to deliver this, because once you hand-edit generated code to add business logic,
          regeneration overwrites your work.
        </p>
        <p>
          <strong className="text-white">Auditability.</strong> The contents of any generated
          file are derivable from the spec, the template and the engine version.
          &ldquo;Generated from spec at hash X by engine version Y&rdquo; is a much better
          answer for a compliance reviewer than &ldquo;an LLM emitted it on the third
          attempt&rdquo;.
        </p>
        <p>
          The sandwich preserves all three because the middle layer is deterministic. The top
          and bottom layers can be as creative as you like. They produce inputs and extensions,
          not the structural code that has to be reviewed, regenerated and audited.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          How regeneration works without losing your code
        </h2>
        <p>Three categories of files.</p>
        <p>
          <strong className="text-white">Regenerated files</strong> are owned by the engine.
          Overwritten on every run. You do not edit them. The repo&apos;s{" "}
          <code className="text-gray-200">.fixedcode-manifest.json</code> records every one with
          its hash. If you do edit one, the next run surfaces the drift and erases it.
        </p>
        <p>
          <strong className="text-white">Once files</strong> are created the first time and then
          never touched again. Configuration files where the engine has an opinion about the
          initial contents but the team will evolve them:{" "}
          <code className="text-gray-200">application.yml</code>, the root README, the
          Dockerfile.
        </p>
        <p>
          <strong className="text-white">Extension points</strong> are stub files the engine
          creates if missing and ignores if present. Business logic goes here. The engine
          creates <code className="text-gray-200">OrderValidator.kt</code> with a default
          implementation that does nothing useful. Developer (or model) fills in real validation
          rules. From then on regeneration leaves it alone.
        </p>
        <p>
          This is the core trick. You can keep regenerating forever without losing custom work,
          because the engine has explicit, declared ownership of every file it touches.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">The org consequence</h2>
        <p>
          Once structural code is generated reliably, building a service decomposes differently.
        </p>
        <p>
          Old shape: someone with domain knowledge writes requirements, hands them to a
          developer, who hand-wires the service while consulting the platform team about
          standards. Multiple roles, multiple handoffs, multiple weeks. AI tooling can compress
          the developer&apos;s part of this loop by an order of magnitude. It does not remove
          the handoffs, and it makes the standards-consistency problem worse.
        </p>
        <p>
          Sandwich shape: someone with domain knowledge describes the service in plain English,
          an AI agent translates that into a spec, the engine generates the structural code, and
          then the same person (or a different person; it does not matter) fills in the business
          logic with AI assistance.
        </p>
        <p>
          The boundary that dissolves is between PM, developer and platform engineer. What
          replaces it is a boundary between domain knowledge (what should this service do, what
          are the rules, what is the data model) and platform knowledge (how should services be
          built in this org, what are the patterns, where are the seams). Both are real. Neither
          has to be embodied in a particular job title.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">What it is not</h2>
        <p>
          It is not a no-code tool. The bespoke parts still get written by hand. The model can
          help; somebody still has to know whether the validation rule is right.
        </p>
        <p>
          It is not free. Building a good template bundle is real engineering work, comparable
          to writing one good service by hand. The result then applies to every subsequent
          service, but the leverage is not immediate.
        </p>
        <p>
          It is not for tiny teams. One service has no consistency problem; the whole apparatus
          is overhead. The wedge appears around five or ten services and a small platform team
          that is already overloaded. It widens from there.
        </p>
        <p>
          It is not anti-AI. The point is to let the model do the parts where its creativity is
          an asset, without asking it to also be deterministic in the parts where it cannot be.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Why now</h2>
        <p>
          Big tech firms have been building variants of this internally for years.
          Google&apos;s protobuf-driven service generation. Meta&apos;s codegen chains.
          Amazon&apos;s Smithy. Define the service in a spec, generate the structural code, let
          humans focus on the bespoke parts. The model layer is recent. The shape is not.
        </p>
        <p>
          What is different now is that the top and bottom slices can be automated. Spec
          authoring used to be the bottleneck that kept this approach inside companies that
          could afford a dedicated DSL team. AI removes that bottleneck. The deterministic
          engine in the middle is straightforward; most of my engineering effort has gone into
          making the regeneration contract bulletproof and the templates pleasant to write. It
          is the AI layers on either side that turn the architecture into something a normal
          engineering org can actually adopt.
        </p>
        <p>
          If you have more than a handful of services and you are starting to feel the
          consistency drift that AI-accelerated development causes, the sandwich is the shape to
          consider. It does not have to be FixedCode. You can build it yourself; the docs
          include enough detail that doing so is reasonable. The principle is what matters: do
          not ask the model to be deterministic. Put a deterministic engine between two layers
          of model and you can have both.
        </p>

        <p className="pt-4">
          The repo is at{" "}
          <a
            href="https://github.com/gibbon/fixedcode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            github.com/gibbon/fixedcode
          </a>
          . <code className="text-gray-200">npm install fixedcode</code>. I would love feedback,
          especially from teams who have tried something in this shape and run into walls I have
          not seen yet.
        </p>
        <p className="text-gray-400 text-sm pt-2">
          Follow-up post on the implementation:{" "}
          <a
            href="/blog/regeneration"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            How regenerating code stays out of your way
          </a>{" "}
          (interfaces, default implementations, local overrides, and library publication).
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
