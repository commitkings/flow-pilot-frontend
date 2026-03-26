export function LandingIntegrations() {
  return (
    <section className="bg-[#FAF8F4] py-20 border-t border-[#E8E4DC]">
      <div className="mx-auto max-w-7xl px-6 md:px-10 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9A9A9A]">
          Direct Protocol Access
        </span>
        <h3 className="mt-4 text-2xl font-bold text-[#0F0F0F] md:text-3xl">
          Connected to the Interswitch Ecosystem
        </h3>
        
        {/* Grid: 2 columns on mobile, auto-flow on desktop */}
        <div className="mt-12 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-center md:gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
           {["Transaction Search", "Customer Lookup", "Disbursements", "Institution Directory"].map((api) => (
             <div 
              key={api} 
              className="flex items-center justify-center md:justify-start gap-2 rounded-xl border border-[#D9D4C8] bg-white px-3 py-3 md:py-2 shadow-sm"
             >
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e86727]" />
                <span className="text-[11px] md:text-[12px] font-bold text-[#0F0F0F] leading-tight">
                  {api}
                </span>
             </div>
           ))}
        </div>
        
        <p className="mt-10 text-[10px] md:text-xs font-medium text-[#6B6B6B]">
          Using 256-bit encryption for all Interswitch API handshakes.
        </p>
      </div>
    </section>
  );
}