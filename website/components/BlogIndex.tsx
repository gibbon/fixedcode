import Link from "next/link";

const posts = [
  {
    date: "2026-07-20",
    title: "Token min-maxxing",
    href: "/token-min-maxxing",
    lede: "Tokenmaxxing is spending more tokens to get better output. Min-maxxing is getting the same output for a fraction of the spend.",
  },
  {
    date: "2026-05-10",
    title: "How regenerating code stays out of your way",
    href: "/blog/regeneration",
    lede: "Most deterministic generators are fire-and-forget. The four mechanisms that let FixedCode keep regenerating without ever overwriting your work.",
  },
  {
    date: "2026-03-29",
    title: "The AI Sandwich",
    href: "/ai-sandwich",
    lede: "AI is good at writing code. It is bad at writing the same code twice.",
  },
];

export default function BlogIndex() {
  return (
    <div className="max-w-3xl mx-auto px-6 pb-24 pt-8">
      <header className="mb-14">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">Blog</h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          Writing on spec-driven generation, regeneration contracts, and putting AI
          on both sides of an engine you can trust.
        </p>
      </header>

      <ul className="border-y border-border divide-y divide-border">
        {posts.map((post) => (
          <li key={post.href} className="py-7">
            <p className="font-mono text-sm text-gray-500 mb-2">{post.date}</p>
            <h2 className="text-2xl font-bold mb-2">
              <Link
                href={post.href}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-400 text-[15px] leading-relaxed">{post.lede}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
