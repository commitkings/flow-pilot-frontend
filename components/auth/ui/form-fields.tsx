"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  options: string[];
}) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 w-full appearance-none rounded-full border border-border bg-background px-5 text-sm text-foreground outline-none transition-all",
          "focus:border-brand focus:ring-1 focus:ring-brand/1",
          "disabled:opacity-50"
        )}
      >
        <option value="" disabled className="bg-background">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-background">
            {option}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
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
 * Password Input: Toggleable visibility
 */
export function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder = "••••••••",
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div className="relative group">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 rounded-full border-border bg-background px-5 pr-12 text-sm transition-all",
          "focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10"
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
 * OTP Input: Optimized for fixed width and centering
 */
export function OtpInput({
  length = 6,
  onChange,
}: {
  length?: number;
  onChange: (code: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

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
            "rounded-xl border border-border bg-background",
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