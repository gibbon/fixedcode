export default function RegenerationDetail() {
  return (
    <article className="max-w-3xl mx-auto px-6 pb-24 pt-8">
      <header className="mb-10">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">Essay</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
          How regenerating code stays out of your way
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          Most deterministic generators are fire-and-forget. Here are the four mechanisms that
          let FixedCode keep regenerating without ever overwriting your work.
        </p>
      </header>

      <div className="prose-content text-gray-300 leading-relaxed space-y-6 text-[17px]">
        <p>
          I wrote about{" "}
          <a href="/ai-sandwich" className="text-purple-400 hover:text-purple-300 underline">
            the AI sandwich
          </a>{" "}
          a couple of weeks ago. The core argument was that you should put a deterministic
          engine between two layers of AI: AI for the creative work, the engine for the
          structural code that has to be the same in every service.
        </p>
        <p>
          The argument only holds if the engine can run again, later, without erasing the
          customisations a human has written into the generated tree. That is the part most
          scaffolding tools fail at, and it is the part most people on Hacker News asked about.
          So this post is about that. Specifically, the four mechanisms FixedCode uses to keep
          regeneration safe: a credibility precedent (OpenAPI), a structural pattern (interface
          plus default implementation), a local override file the engine never touches, and
          optional library publication for sharing structural code across service instances.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. The OpenAPI precedent</h2>
        <p>
          Every developer who has shipped a typed API client already trusts deterministic
          codegen. You write an OpenAPI spec, you run{" "}
          <code className="text-gray-200">openapi-generator</code>, you get a typed client in
          TypeScript or Kotlin or Python. When the API changes, you update the spec, regenerate,
          and downstream code either compiles or fails fast at the type boundaries you wrote.
          Nobody hand-rolls the HTTP code anymore, because the spec to client transformation is
          too obviously a function to do by hand.
        </p>
        <p>
          OpenAPI works because the contract between the spec and the generated code is
          unambiguous, the regeneration loop is fast, and the cost of a hand-edit is high enough
          that nobody is tempted. None of that is unique to HTTP. The same property is available
          for auth, persistence, event publishing, audit, and the rest of the structural layer
          of a service. The bar for &ldquo;is this safe to regenerate?&rdquo; is whatever the
          bar is for OpenAPI clients today, which is to say: high enough that the entire
          industry already accepts it.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          2. Interfaces and default implementations
        </h2>
        <p>
          Inside the generated service, every meaningful behaviour lives behind an interface.
          The engine generates the interface and a default implementation. Both files. The
          interface is what the rest of the generated code talks to; the default implementation
          is what wires up by default if nothing else is registered.
        </p>
        <p>
          For a <code className="text-gray-200">Order</code> aggregate the engine generates,
          among other things:
        </p>

        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
{`// generated, owned by the engine
interface OrderBusinessService {
    fun create(cmd: CreateOrderCommand): Order
    fun update(cmd: UpdateOrderCommand): Order
    fun delete(id: UUID)
}

// generated, also owned by the engine
@Service
class DefaultOrderBusinessService(
    private val repo: OrderWriteRepository,
    private val outbox: OutboxRecorder,
) : OrderBusinessService {
    @Transactional
    override fun create(cmd: CreateOrderCommand): Order {
        val (order, events) = Order.create(cmd)
        repo.save(order)
        events.forEach(outbox::record)
        return order
    }
    // ... update, delete
}`}
        </pre>

        <p>
          Both files are regenerated on every run. You do not edit either. The repo&apos;s{" "}
          <code className="text-gray-200">.fixedcode-manifest.json</code> records the hash of
          each one; if you do edit one, the next run surfaces the drift and overwrites the
          change. The interface is the public surface, the default is the working baseline, and
          they always travel together.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Local overrides</h2>
        <p>
          The customisation layer is a separate file you write yourself. The engine creates an
          empty stub the first time and then never touches it again. If your override exists,
          Spring picks it up via{" "}
          <code className="text-gray-200">@Primary</code> or{" "}
          <code className="text-gray-200">@ConditionalOnMissingBean</code>; if it does not, the
          generated default runs.
        </p>
        <p>
          For an EU instance of the order service that needs GDPR-specific deletion logic:
        </p>

        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
{`// hand-written, lives in your repo, never overwritten
@Service
@Primary
class EuOrderBusinessService(
    private val default: DefaultOrderBusinessService,
    private val gdpr: GdprDeletionLog,
) : OrderBusinessService by default {

    override fun delete(id: UUID) {
        gdpr.recordDeletion(id, requesterCountry = "EU")
        default.delete(id)
    }
}`}
        </pre>

        <p>
          The Kotlin <code className="text-gray-200">by default</code> delegation means you only
          override the one method that is different. <code className="text-gray-200">create</code>{" "}
          and <code className="text-gray-200">update</code> continue to flow through the
          generated default. When the engine improves{" "}
          <code className="text-gray-200">DefaultOrderBusinessService</code> next quarter
          (say, better outbox handling), the EU service inherits the improvement on the next
          regeneration without anyone touching{" "}
          <code className="text-gray-200">EuOrderBusinessService</code>.
        </p>
        <p>
          This is the same shape as a three-way merge applied to code: a base, a default, and a
          local override layered on top. The merge happens at the dependency-injection layer
          rather than at the text-diff layer, which is what makes it survive renames and
          refactors that would defeat a textual merge.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">4. Library publication</h2>
        <p>The pattern scales beyond a single service.</p>
        <p>
          Once a domain spec generates clean output, you can package the entire generated tree
          as a publishable artifact. A JAR for Spring, a wheel for Python, an npm package for
          Node. The published artifact contains all the generated structural code: interfaces,
          default implementations, repositories, controllers, persistence, tests. Everything
          except the local overrides.
        </p>
        <p>Downstream services consume the artifact as a normal dependency:</p>

        <pre className="rounded-lg border border-border bg-surface/60 p-5 text-sm overflow-x-auto text-gray-300">
{`// build.gradle.kts in order-service-eu
dependencies {
    implementation("com.example:order-service-core:1.4.0")
    // ... your local overrides go in this repo
}`}
        </pre>

        <p>
          The downstream repo contains only the local overrides: the parts that are unique to
          this instance. Maybe ten files, maybe twenty. The other forty-seven files of the
          service live in the upstream JAR and do not need to be cloned, copied, or maintained
          per-instance.
        </p>
        <p>
          When upstream regenerates and publishes 1.4.1 (a template improvement, a new
          aggregate, an auth upgrade), the downstream services bump the dependency version and
          inherit the improvement. Local overrides keep working because they are written
          against the interface, which is part of the published contract.
        </p>
        <p>
          This is what lets a small platform team support hundreds of service instances. The
          structural code lives in one upstream artifact that all instances share. Each instance
          contributes only the bespoke parts. Drift at the structural-code level is impossible
          by construction, because every instance is reading the same JAR.
        </p>

        <h2 className="text-2xl font-bold text-white mt-12 mb-4">
          What this stack adds up to
        </h2>
        <p>
          OpenAPI codegen got you spec-driven HTTP clients across every service in the org. That
          alone removed an entire class of cross-service drift. The four mechanisms above extend
          the same property to the rest of the service:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Spec to generated structural code, deterministic the way OpenAPI is.</li>
          <li>Interface plus default implementation, so customisation has a place to attach.</li>
          <li>Local override files the engine never touches.</li>
          <li>
            Optional library publication, so multiple service instances share an upstream
            artifact instead of forking it.
          </li>
        </ul>
        <p>
          You can adopt them incrementally. Start with{" "}
          <code className="text-gray-200">fixedcode generate</code> for one service. Add
          overrides as you need them. Publish the artifact when you have a second instance that
          shares the same structural shape. Each step is independent, and each step is the
          smallest version of itself that is still useful.
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
          . <code className="text-gray-200">npm install fixedcode</code>. The original{" "}
          <a href="/ai-sandwich" className="text-purple-400 hover:text-purple-300 underline">
            AI Sandwich essay
          </a>{" "}
          covers the bigger architectural argument; this post is the implementation detail
          behind it.
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
