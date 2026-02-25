"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// const links = [
//   { id: "features", label: "Features" },
//   { id: "how-it-works", label: "How It Works" },
//   { id: "pricing", label: "Pricing" },
//   { id: "about", label: "About" },
// ];

export function LandingNav() {
  return (
    <header
      className={cn(
        "w-full transition-all duration-300 py-3"
      )}
    >
      <div className="mx-auto flex max-w-600 items-center justify-between px-6 md:px-15">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-[#0F0F0F]"
          >
            LOGO
          </Link>

          {/* <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="group relative text-sm font-medium text-[#5C5C5C] transition-colors hover:text-[#0F0F0F]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#0F0F0F] transition-all group-hover:width-full" />
              </button>
            ))}
          </nav> */}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden px-4 py-2 text-sm font-medium text-[#5C5C5C] transition-colors hover:text-[#0F0F0F] hover:bg-gray-50 rounded-full sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center hover:underline-[#e86727] justify-center rounded-full text-black px-6 text-sm font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
