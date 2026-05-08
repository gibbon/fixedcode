"use client";

export default function Footer() {
  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          <div>
            <a href="/" className="text-2xl font-bold text-gradient">
              FixedCode
            </a>
            <p className="text-gray-500 mt-2 text-sm">
              AI creates. FixedCode guarantees. You ship.
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
                    href="https://www.npmjs.com/package/fixedcode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    npm: fixedcode
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/blob/master/docs/architecture.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/blob/master/docs/bundles.md"
                    target="_blank"
                    rel="noopener noreferrer"
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
                    href="https://github.com/gibbon/fixedcode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/blob/master/CHANGELOG.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Changelog
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Issues
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Project
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/blob/master/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Apache-2.0 License
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/blob/master/SECURITY.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gibbon/fixedcode/blob/master/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Contributing
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
