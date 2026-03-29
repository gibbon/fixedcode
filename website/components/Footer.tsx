"use client";

export default function Footer() {
  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          <div>
            <a href="#" className="text-2xl font-bold text-gradient">
              FixedCode
            </a>
            <p className="text-gray-500 mt-2 text-sm">
              Built for the AI era. Not by it.
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#schemas"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Schemas
                  </a>
                </li>
                <li>
                  <a
                    href="#bundles"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Bundles
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Slides
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Community
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} FixedCode. All rights reserved.
          </p>
          <p className="text-xs text-gray-700">
            Spec-driven. Deterministic. Regeneration-safe.
          </p>
        </div>
      </div>
    </footer>
  );
}
