"use client";

import Link from "next/link";
import { ReceiptRussianRuble } from "lucide-react";
import BlobShape from "./blob/BlobShape";
import { blobs } from "./blob/constants";

type BlobAsideProps = {
  focused: boolean;
  passwordFocused: boolean;
  showPassword: boolean;
  invalid: boolean;
  success: boolean;
};

export function BlobAside({ focused, passwordFocused, showPassword, invalid, success }: BlobAsideProps) {
  return (
    <aside className="hidden md:flex md:flex-col h-full bg-[#111] relative overflow-hidden">
      <div className="px-10 pt-10 z-10 relative">
        <Link href="/" className="flex items-center gap-1 text-xl font-bold tracking-tight text-white">
          <ReceiptRussianRuble size={28} className="text-white fill-[#e86727]" />
          FLOWPILOT
        </Link>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-center overflow-hidden pointer-events-none md:pointer-events-auto">
        <div className="relative w-full h-137.5">
          {blobs.map((spec) => (
            <BlobShape
              key={spec.kind}
              spec={spec}
              showPassword={showPassword}
              focused={focused}
              passwordFocused={passwordFocused}
              invalid={invalid}
              success={success}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
