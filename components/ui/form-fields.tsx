"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, ChevronDown, Eye, EyeOff, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Standard Text Input: For names, emails, etc.
 */
export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-12 rounded-full border-border bg-background px-5 text-sm transition-all focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10",
        className
      )}
      {...props}
    />
  );
}

export type SelectOption =
  | string
  | {
    label: string;
    value: string;
  };

/**
 * Select Input: Styled for both modes
 */
export function SelectInput({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
}) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 w-full appearance-none rounded-full border border-border bg-background px-2 text-sm text-foreground outline-none transition-all",
          "focus:border-brand focus:ring-1 focus:ring-brand/10",
          "disabled:opacity-50"
        )}
      >
        <option value="" disabled className="bg-background">
          {placeholder}
        </option>
        {options.map((option) => {
          const normalizedOption =
            typeof option === "string"
              ? { label: option, value: option }
              : option;

          return (
            <option
              key={normalizedOption.value}
              value={normalizedOption.value}
              className="bg-background"
            >
              {normalizedOption.label}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}

/**
 * BankSelectInput: Searchable combobox for institution/bank selection
 */
export function BankSelectInput({
  value,
  onChange,
  placeholder = "Search bank…",
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o
  );

  const selectedLabel = normalized.find((o) => o.value === value)?.label ?? "";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? normalized.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.value.toLowerCase().includes(query.toLowerCase())
      )
    : normalized;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputFocus = () => {
    setOpen(true);
    setQuery("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange("");
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-full border border-border bg-background px-4 transition-all",
          "focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/10",
          open && "border-brand ring-1 ring-brand/10"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={open ? query : selectedLabel}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={value ? selectedLabel : placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {value ? (
          <button type="button" onClick={handleClear} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No banks found{query ? ` for "${query}"` : ""}
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => handleSelect(o.value)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                  value === o.value && "bg-brand/10 font-semibold text-brand"
                )}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Checkbox: Branded checkbox with label and optional description
 */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2", className)}>
      <div className="relative mt-1.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[5px] border transition-all duration-150",
            "border-border bg-background",
            "peer-checked:border-brand peer-checked:bg-brand",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/20 peer-focus-visible:ring-offset-1"
          )}
        >
          <svg
            viewBox="0 0 12 10"
            className={cn(
              "h-2 w-2 stroke-white stroke-2 transition-opacity duration-150",
              checked ? "opacity-100" : "opacity-0"
            )}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 5 4.5 8.5 11 1" />
          </svg>
        </div>
      </div>
      <div className="space-y-0.3">
        <span className="text-[12px] text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </label>
  );
}

/**
 * Numeric Input: Digits only (add decimal={true} to also allow a decimal point)
 */
export function NumericInput({
  value,
  onChange,
  placeholder,
  className,
  decimal = false,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange: (value: string) => void;
  decimal?: boolean;
}) {
  const filter = decimal
    ? (v: string) => v.replace(/[^0-9.]/g, "").replace(/(\..*?)\./g, "$1")
    : (v: string) => v.replace(/\D/g, "");
  return (
    <Input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      value={value}
      onChange={(e) => onChange(filter(e.target.value))}
      placeholder={placeholder}
      className={cn(
        "h-12 rounded-full border-border bg-background px-5 text-sm transition-all focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10",
        className
      )}
      {...props}
    />
  );
}

/**
 * Amount Input: Digits + commas + decimal for currency values (e.g. 5,000,000)
 */
export function AmountInput({
  value,
  onChange,
  placeholder,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange: (value: string) => void;
}) {
  function format(raw: string): string {
    const clean = raw.replace(/[^0-9.]/g, "");
    const [integer, ...rest] = clean.split(".");
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return rest.length > 0 ? `${formatted}.${rest.join("")}` : formatted;
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(format(e.target.value))}
      placeholder={placeholder}
      className={cn(
        "h-12 rounded-full border-border bg-background px-5 text-sm transition-all focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10",
        className
      )}
      {...props}
    />
  );
}

/**
 * Textarea Input: Multi-line styled to match TextInput
 */
export function TextareaInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "min-h-32 w-full rounded-2xl border border-border bg-background p-3 text-[12px] outline-none transition-all resize-none",
        "focus:border-brand focus:ring-1 focus:ring-brand/10",
        className
      )}
    />
  );
}

/**
 * Phone Input: Prefixed with country code
 */
export function PhoneInput({
  value,
  onChange,
  prefix = "🇳🇬 +234",
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <div className={cn(
      "flex h-12 overflow-hidden rounded-full border border-border bg-background transition-all",
      "focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/10"
    )}>
      <span className="inline-flex shrink-0 items-center border-r border-border px-4 text-sm text-muted-foreground">
        {prefix}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="tel"
        className="w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/**
 * Password Input: Toggleable visibility
 */
export function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder = "••••••••",
  error = false,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  error?: boolean;
  required?: boolean;
}) {
  return (
    <div className="relative group">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(
          "h-12 rounded-full border-border bg-background px-5 pr-12 text-sm transition-all",
          "focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10",
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10"
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-brand"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * Search Input: Icon-prefixed search bar
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-12 rounded-full border border-border bg-muted/20 px-3 py-2 transition-all",
        "focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/10",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/**
 * Date Input: Custom-formatted date picker (shows as "2,Oct,2025")
 */
export function DateInput({
  value,
  onChange,
  placeholder = "Select date",
  className,
  max,
  min,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  max?: string;
  min?: string;
}) {
  const formatted = value
    ? new Date(value + "T00:00:00")
      .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      .replace(/ /g, ",")
    : null;

  return (
    <div
      className={cn(
        "relative h-12 min-w-36 cursor-pointer rounded-full border border-border bg-background transition-all",
        "focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/10",
        className
      )}
    >
      <div className="pointer-events-none flex h-full items-center justify-between px-4">
        {formatted ? (
          <span className="text-sm text-foreground">{formatted}</span>
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={min}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/**
 * DateRange Input: Two date pickers for a from/to range
 */
export function DateRangeInput({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
}) {
  const fmt = (value: string) =>
    value
      ? new Date(value + "T00:00:00")
        .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        .replace(/ /g, ",")
      : null;

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:gap-0 sm:h-12 sm:overflow-hidden sm:rounded-full sm:border sm:border-border sm:bg-background sm:transition-all sm:focus-within:border-brand sm:focus-within:ring-1 sm:focus-within:ring-brand/10", className)}>
      {/* From */}
      <div
        className="relative flex h-12 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 transition-all focus-within:border-brand sm:flex-1 sm:rounded-none sm:border-0 sm:focus-within:border-0"
      >
        <span className="pointer-events-none shrink-0 text-[10px] font-black uppercase tracking-wider text-muted-foreground">From</span>
        <span className="pointer-events-none flex-1 text-sm">
          {fmt(from) ? (
            <span className="text-foreground">{fmt(from)}</span>
          ) : (
            <span className="text-muted-foreground">Start date</span>
          )}
        </span>
        <Calendar className="pointer-events-none h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>

      {/* Separator — desktop only */}
      <div className="hidden sm:flex items-center border-x border-border px-2.5 text-muted-foreground">
        <ArrowRight className="h-3 w-3" />
      </div>

      {/* To */}
      <div
        className="relative flex h-12 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 transition-all focus-within:border-brand sm:flex-1 sm:rounded-none sm:border-0 sm:focus-within:border-0"
      >
        <span className="pointer-events-none shrink-0 text-[10px] font-black uppercase tracking-wider text-muted-foreground">To</span>
        <span className="pointer-events-none flex-1 text-sm">
          {fmt(to) ? (
            <span className="text-foreground">{fmt(to)}</span>
          ) : (
            <span className="text-muted-foreground">End date</span>
          )}
        </span>
        <Calendar className="pointer-events-none h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>
    </div>
  );
}

/**
 * OTP Input: Optimized for fixed width and centering
 */
export function OtpInput({
  length = 6,
  value = "",
  onChange,
}: {
  length?: number;
  /** Controlled value — pass an empty string to programmatically reset the input */
  value?: string;
  onChange: (code: string) => void;
}) {
  const toDigits = (v: string, len: number) =>
    Array.from({ length: len }, (_, i) => v?.[i] ?? "");

  const [digits, setDigits] = useState<string[]>(() => toDigits(value ?? "", length));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Reset internal digits when the controlled value is cleared externally
  useEffect(() => {
    setDigits(toDigits(value ?? "", length));
  }, [value, length]);

  const update = (next: string[]) => {
    setDigits(next);
    onChange(next.join(""));
  };

  const onDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    update(next);
    if (cleaned && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = [...digits];
    pasted.split("").forEach((char, i) => { if (i < length) next[i] = char; });
    update(next);
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  const allFilled = digits.every((d) => d.length === 1);

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          value={digit}
          onChange={(e) => onDigitChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          maxLength={1}
          inputMode="numeric"
          className={cn(
            // Sizing: Use fixed aspect ratio boxes
            "h-12 w-10 sm:w-12 text-center text-xl font-bold transition-all outline-none",
            "rounded-full border border-border bg-background",
            // States
            "focus:border-brand focus:ring-1 focus:ring-brand/10",
            allFilled && "border-brand shadow-sm shadow-brand/10",
            digit !== "" && "border-brand/50 bg-brand/5"
          )}
        />
      ))}
    </div>
  );
}