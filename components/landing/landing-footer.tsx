"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer id="about" className="border-t border-white/10 bg-black py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-black tracking-tighter text-white">
              FLOWPILOT<span className="text-[#e86727]">.</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">
              Smart bulk payment automation for individuals and businesses across Africa. Verify recipients, catch fraud,
              approve payouts, and stay compliant — all in one place.
            </p>
            {/* Live System Status */}
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Product</h4>
            <ul className="mt-5 space-y-3.5 text-sm font-medium text-white/50">
              <li><Link href="/dashboard/runs" className="transition-colors duration-200 hover:text-[#e86727]">Live Dashboard</Link></li>
              <li><Link href="/docs" className="transition-colors duration-200 hover:text-[#e86727]">API Docs</Link></li>
              <li><a href="#features" className="transition-colors duration-200 hover:text-[#e86727]">Features</a></li>
              <li><a href="#how-it-works" className="transition-colors duration-200 hover:text-[#e86727]">How it Works</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Legal</h4>
            <ul className="mt-5 space-y-3.5 text-sm font-medium text-white/50">
              <li><Link href="/privacy" className="transition-colors duration-200 hover:text-[#e86727]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition-colors duration-200 hover:text-[#e86727]">Terms of Service</Link></li>
              <li><Link href="/security" className="transition-colors duration-200 hover:text-[#e86727]">Security Audit</Link></li>
              <li><a href="mailto:support@flowpilot.ai" className="transition-colors duration-200 hover:text-[#e86727]">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <div className="h-1.5 w-1.5 rounded-full bg-[#e86727]" />
            Powered by Interswitch APIs
          </span>

          <p className="text-[11px] font-medium text-white/30">
            © {new Date().getFullYear()} FlowPilot Technologies. Built for every African who moves money.
          </p>
        </div>
      </div>
    </footer>
  );
}