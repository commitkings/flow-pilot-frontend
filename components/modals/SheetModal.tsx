"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface SheetModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function SheetModal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: SheetModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 bottom-0 flex flex-col bg-card shadow-2xl md:border-l md:border-border"
        style={{ width: "min(100vw, 520px)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 md:px-6 md:py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3 md:px-6 md:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
