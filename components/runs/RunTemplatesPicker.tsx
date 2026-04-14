"use client";

import { useState } from "react";
import { Bookmark, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRunTemplates } from "@/hooks/use-run-templates";

interface RunTemplatesPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (objective: string) => void;
}

export function RunTemplatesPicker({
  open,
  onClose,
  onSelect,
}: RunTemplatesPickerProps) {
  const { templates, saveTemplate, deleteTemplate } = useRunTemplates();
  const [templateName, setTemplateName] = useState("");

  if (!open) return null;

  const handleSave = () => {
    const trimmed = templateName.trim();
    if (!trimmed) return;
    saveTemplate(trimmed, "");
    setTemplateName("");
    toast.success("Template saved.");
  };

  const handleDelete = (id: string, name: string) => {
    deleteTemplate(id);
    toast.success(`Template "${name}" deleted.`);
  };

  const handleSelect = (objective: string) => {
    onSelect(objective);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card px-6 py-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Run Templates
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saved run configurations for quick reuse.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Bookmark className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-base font-black text-foreground">
                No templates saved yet
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Save a run as a template from the runs list to quickly reuse
                common objectives.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 shadow-sm transition-all hover:border-brand/30"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-bold text-foreground">
                      {template.name}
                    </span>
                    {template.objective ? (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {template.objective}
                      </span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground/60">
                        No objective saved
                      </span>
                    )}
                    <span className="mt-1 text-[10px] text-muted-foreground/50">
                      Saved{" "}
                      {new Date(template.savedAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-full bg-brand px-3 text-xs text-white hover:opacity-90"
                      onClick={() => handleSelect(template.objective)}
                    >
                      Use
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(template.id, template.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: save new template */}
        <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">
            Save new template
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Template name..."
              className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10 placeholder:text-muted-foreground"
            />
            <Button
              size="sm"
              className="h-10 rounded-full bg-brand px-4 text-white hover:opacity-90"
              disabled={!templateName.trim()}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
