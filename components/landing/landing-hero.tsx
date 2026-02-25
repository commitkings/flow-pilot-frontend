import Link from "next/link";
import { PipelineSection } from "../ui/landing/PassportCard";
import {
  ArrowRight,
} from "lucide-react";

export function LandingHero() {
  return (
    <section className="bg-white px-6 pb-20 pt-20 md:px-10 md:pb-28 md:pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e86727]/60 bg-white/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e86727] opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#e86727]"></span>
            </span>
            Powered by Interswitch APIs
          </span>
        </div>

        <h1 className="mx-auto mt-7 max-w-3xl text-center text-5xl font-extrabold leading-[1.06] tracking-tight text-[#0F0F0F] md:text-7xl">
          Treasury execution,{" "}
          <span className="text-[#e86727]">without the drag.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-[#6B6B6B] md:text-lg">
          FlowPilot turns operator goals into supervised runs. Agents reconcile,
          score risk, verify recipients, and execute approved payouts — with
          full traceability.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-3">
          <Link
            href="/signup"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0F0F0F] px-8 text-sm font-bold text-white transition-all hover:bg-[#2A2A2A] hover:shadow-xl hover:shadow-black/10 active:scale-[0.98] sm:w-auto"
          >
            Start Free
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="#how-it-works"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#D9D4C8] bg-white/50 px-8 text-sm font-semibold text-[#0F0F0F] backdrop-blur-sm transition-all hover:border-[#BFBAB0] hover:bg-white hover:shadow-md active:scale-[0.98] sm:w-auto"
          >
            See How It Works
          </Link>
        </div>

        {/* <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#9A9A9A]">
          <span>Built for SMEs</span>
          <span className="h-1 w-1 rounded-full bg-[#D9D4C8]" />
          <span>Human-approved payouts</span>
          <span className="h-1 w-1 rounded-full bg-[#D9D4C8]" />
          <span>Audit ready by default</span>
        </div> */}

        <PipelineSection/>
      </div>
    </section>
  );
}
