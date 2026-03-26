"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer id="about" className="border-t border-[#E8E4DC] bg-black py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-xl font-black tracking-tighter text-white">
              FLOWPILOT<span className="text-[#e86727]">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#6B6B6B]">
              The execution layer for modern SME treasury. Supervised AI that reconciles, 
              scores risk, and executes payouts with total traceability.
            </p>
            {/* Live System Status Indicator */}
            <div className="mt-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                Systems Operational
              </span>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Product</h4>
            <ul className="mt-6 space-y-4 text-sm font-medium text-[#6B6B6B]">
              <li><Link href="/dashboard/runs" className="transition hover:text-[#e86727]">Live Dashboard</Link></li>
              <li><a href="#features" className="transition hover:text-[#e86727]">Features</a></li>
              <li><a href="#how-it-works" className="transition hover:text-[#e86727]">How it Works</a></li>
              <li><a href="#pricing" className="transition hover:text-[#e86727]">Pricing</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Legal</h4>
            <ul className="mt-6 space-y-4 text-sm font-medium text-[#6B6B6B]">
              <li><a href="#" className="transition hover:text-[#e86727]">Privacy Policy</a></li>
              <li><a href="#" className="transition hover:text-[#e86727]">Terms of Service</a></li>
              <li><a href="#" className="transition hover:text-[#e86727]">Security Audit</a></li>
              <li><a href="mailto:support@flowpilot.ai" className="transition hover:text-[#e86727]">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-[#E8E4DC] pt-8 md:flex-row">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D9D4C8] bg-[#FAF8F4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5C5C5C]">
              <div className="h-1 w-1 rounded-full bg-[#e86727]" />
              Powered by Interswitch APIs
            </span>
          </div>
          
          <p className="text-[11px] font-medium text-[#9A9A9A]">
            © {new Date().getFullYear()} FlowPilot Technologies. Built for the next generation of African SMEs.
          </p>
        </div>
      </div>
    </footer>
  );
}