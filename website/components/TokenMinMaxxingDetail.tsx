export default function TokenMinMaxxingDetail() {
  return (
    <article className="max-w-3xl mx-auto px-6 pb-24 pt-8">
      <header className="mb-10">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">Essay</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
          Token min-maxxing
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          Tokenmaxxing is spending more tokens to get better output. Min-maxxing is
          getting the same output for a fraction of the spend.
        </p>
      </header>

      <div className="prose-content text-gray-300 leading-relaxed space-y-6 text-[17px]">
        <p>
          There is a genre of post going around where someone shows an agent burning
          through hundreds of millions of tokens and the number itself is the
          achievement. The craze has a name, tokenmaxxing, and the logic behind it is
          simple: tokens buy intelligence, intelligence compounds, so spend more.
        </p>
        <p>
          The logic is half right. Tokens spent on judgment are leverage. Tokens spent
          emitting predictable text are the most expensive compiler invocation in the
          history of computing.
        </p>
        <p>
          Min-maxxing is the older and better idea. In RPGs it means dumping the stats
          that do not affect your build so you can max the ones that win the game.
          Applied to AI-assisted engineering: minimise tokens spent on code that is a
          pure function of its inputs, and maximise the tokens that go where the
          model&apos;s judgment actually changes the outcome.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          Where tokens go to die
        </h2>
        <p>
          Watch where the output tokens actually go when an agent builds a backend
          service. Auth wiring. DTOs. Pagination. Migrations. Logging config. CRUD
          endpoints. The tests for all of it. This code is predictable in the strict
          sense: given the data model and the org&apos;s conventions, there is one
          right answer, and the model produces it token by token at model prices.
        </p>
        <p>
          And you do not pay once. You pay to generate it, you pay every time an agent
          re-reads it into context, you pay a human or a review agent to check the
          diff, and you pay again next month when the second service needs the same
          code with a different aggregate name.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">The measured version</h2>
        <p>
          Here is the spring-domain example that ships in the FixedCode repo. The spec
          is 87 lines of YAML describing an Order aggregate: attributes, commands,
          queries, events. Running the engine on it produces a complete domain slice.
        </p>

        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
          {`spec        87 lines of YAML      ~600 tokens   the model writes this
generated   25 files, 1,123 lines  ~8,000 tokens  the engine writes this

middle step: 0 tokens, 0.2 seconds`}
        </pre>

        <p>
          The model writes 600 tokens of spec instead of 8,000 tokens of Kotlin, SQL
          and config. That is more than thirteen times fewer output tokens for the
          same shipped code, before you count retries. And generated code does not
          retry.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">The multipliers</h2>
        <p>
          The headline ratio is the smallest part of the win. The compounding effects
          are where min-maxxing actually pays.
        </p>
        <p>
          <strong className="text-white">Retries hit the small artifact.</strong> When
          the model gets something wrong, it gets a schema validation error pointing
          at a line in an 87-line spec, and the retry costs hundreds of tokens
          instead of thousands. <code className="text-gray-300">fixedcode draft</code>{" "}
          runs this loop automatically.
        </p>
        <p>
          <strong className="text-white">Context stays small.</strong> An agent
          working on the service needs the spec and the extension points in context,
          not 1,123 lines of generated structure. Every downstream request is cheaper
          and sharper because the window is not full of boilerplate the model must
          not touch anyway.
        </p>
        <p>
          <strong className="text-white">Regeneration is free.</strong> Rename a
          field, add a command, rerun the engine. Zero tokens, forever. In a
          pure-LLM codebase every change to structural code is another spend and
          another diff someone has to review.
        </p>
        <p>
          <strong className="text-white">Review collapses.</strong> Review the
          template once and you have reviewed every service generated from it. Fifty
          services later, this term dominates everything else in the equation.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Maxing the other stat</h2>
        <p>
          Minimising is only half the build. The max half is leverage per token. In
          the example above, one line of spec commands about thirteen lines of
          generated code, and the ratio grows with every convention the bundle
          encodes. A field marked optional flows into the DTO, the migration, the
          validation and the tests without the model spending anything on any of
          them.
        </p>
        <p>
          The tokens you still spend go where the model earns its price: translating
          intent into a spec at the top, and writing the validation rules, pricing
          functions and integrations in the extension points at the bottom. This is{" "}
          <a
            href="/ai-sandwich"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            the AI sandwich
          </a>{" "}
          seen through a cost lens: two creative slices around a middle that costs
          nothing.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">What this is not</h2>
        <p>
          It is not an argument for spending less on hard problems. Blow the budget
          on the gnarly business logic, the design work, the adversarial review of
          bespoke code. That is exactly the spend that tokenmaxxing gets right.
        </p>
        <p>
          It is an argument against paying model prices for compiler work. If a file
          can be produced by a template and a for-loop, it should cost zero tokens,
          and it should keep costing zero tokens every time you regenerate it.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Try the numbers yourself</h2>
        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
          {`$ fixedcode draft spring-domain "order service with line items" -o order.yaml
$ fixedcode generate order.yaml -o build     # 0 tokens
$ fixedcode enrich build/                    # tokens only on extension points`}
        </pre>
        <p className="pt-2">
          The repo is at{" "}
          <a
            href="https://github.com/gibbon/fixedcode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            github.com/gibbon/fixedcode
          </a>
          . <code className="text-gray-300">npm install fixedcode</code>. If your
          team is tracking token spend and you have numbers from a different shape of
          pipeline, I would genuinely like to compare.
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
