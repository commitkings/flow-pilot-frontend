"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

// const links = [
//   { id: "features", label: "Features" },
//   { id: "how-it-works", label: "How It Works" },
//   { id: "pricing", label: "Pricing" },
//   { id: "about", label: "About" },
// ];

export function LandingNav() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 10);
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "w-full sticky top-0 z-60 transition-transform duration-300 py-2",
        visible ? "translate-y-0 bg-[#FAF8F4]/96 backdrop-blur-sm" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex max-w-600 items-center justify-between px-4 md:px-15">
        <div className="flex items-center gap-10">
          <Link href="/">
            <Logo variant="icon" size="md" color="darkblue" className="md:hidden" />
            <Logo variant="full" size="md" color="darkblue" className="hidden md:block" />
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
            className="group relative hidden px-4 py-2 text-sm font-semibold text-[#0F0F0F] sm:block"
          >
            Log in
            <span className="absolute inset-x-4 bottom-1.5 h-0.5 origin-left scale-x-0 bg-[#e86727] transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center hover:border-[#e86727] rounded-full text-black bg-gray-100 px-4 text-sm font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
