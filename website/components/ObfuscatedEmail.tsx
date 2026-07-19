"use client";

import { useEffect, useState } from "react";

// Assembled client-side so the address never appears in the prerendered HTML
// that scrapers crawl. Kept in two parts so it is not greppable in the bundle.
const USER = "info";
const DOMAIN = ["fixedcode", "ai"].join(".");

export default function ObfuscatedEmail({ subject }: { subject: string }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(`${USER}@${DOMAIN}`);
  }, []);

  if (!address) {
    return (
      <span className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium bg-gradient opacity-90 select-none">
        Email me
      </span>
    );
  }

  return (
    <a
      href={`mailto:${address}?subject=${encodeURIComponent(subject)}`}
      className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-medium bg-gradient hover:opacity-90 transition-opacity"
    >
      Email {address}
    </a>
  );
}
