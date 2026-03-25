import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// PillSelect — multi-select pill/chip toggle group
// ---------------------------------------------------------------------------

interface PillSelectProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
}

export function PillSelect({ options, selected, onToggle, className }: PillSelectProps) {
  return (
    <div className={cn("flex flex-wrap gap-2 pt-1", className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              "rounded-full border px-2 py-1.5 text-[12px] font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
              isSelected
                ? "border-brand bg-brand text-white"
                : "text-foreground hover:border-brand/50 hover:text-brand"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardSelect — single-select card grid (icon + title + description)
// ---------------------------------------------------------------------------

export type CardSelectOption<T extends string = string> = {
  value: T;
  title: string;
  description: string;
  icon: React.ReactNode;
};

interface CardSelectProps<T extends string = string> {
  options: CardSelectOption<T>[];
  selected: T | "";
  onChange: (value: T) => void;
  className?: string;
}

export function CardSelect<T extends string = string>({
  options,
  selected,
  onChange,
  className,
}: CardSelectProps<T>) {
  return (
    <div className={cn("grid gap-3 pt-1", `md:grid-cols-${options.length}`, className)}>
      {options.map((opt) => (
        <SelectCard
          key={opt.value}
          title={opt.title}
          description={opt.description}
          icon={opt.icon}
          selected={selected === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectCard — individual card used inside CardSelect (also exportable standalone)
// ---------------------------------------------------------------------------

interface SelectCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function SelectCard({ title, description, icon, selected, onClick, className }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-brand bg-brand-muted"
          : "border-border bg-background hover:border-brand/40",
        className
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
          <Check className="h-3 w-3 stroke-2" />
        </span>
      )}
      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted">
        {icon}
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </button>
  );
}
