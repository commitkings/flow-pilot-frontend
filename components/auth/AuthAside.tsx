import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

type AuthAsideProps = {
  title: string;
  subtitle?: string;
  features?: string[];
  testimonial?: {
    quote: string;
    author: string;
  };
};

export function AuthAside({ title, subtitle, features, testimonial }: AuthAsideProps) {
  return (
    <aside className="hidden bg-slate-950 px-10 py-12 text-white md:flex md:flex-col h-screen">
      <Link href="/">
        <Logo variant="full" size="md" />
      </Link>

      <div className="mt-16 flex-1">
        <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-sm text-slate-300">{subtitle}</p>}
        {features && features.length > 0 && (
          <ul className="mt-8 space-y-4 text-sm text-slate-200">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {testimonial && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
          <p className="leading-relaxed">&quot;{testimonial.quote}&quot;</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{testimonial.author}</p>
        </div>
      )}
    </aside>
  );
}
