import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/form-fields";

export type TeamRole = "Approver" | "Analyst";

export type InviteRow = {
  id: string;
  email: string;
  role: TeamRole;
  /** Set by onboarding page after the invite API call resolves */
  sent?: boolean;
  error?: string;
};

const ROLE_OPTIONS = ["Approver", "Analyst"];

interface Step3Props {
  invites: InviteRow[];
  updateInviteRow: (id: string, updates: Partial<InviteRow>) => void;
  addInviteRow: () => void;
  removeInviteRow: (id: string) => void;
}

export function Step3InviteTeam({
  invites,
  updateInviteRow,
  addInviteRow,
  removeInviteRow,
}: Step3Props) {
  return (
    <div className="space-y-3">
      {invites.map((row, index) => {
        const isSent = row.sent === true;

        return (
          <div
            key={row.id}
            className={`relative rounded-xl border p-4 transition-colors ${
              isSent ? "border-green-200 bg-green-50/30" : "border-border/60 bg-background"
            }`}
          >
            {isSent ? (
              <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => removeInviteRow(row.id)}
                disabled={invites.length === 1 && index === 0}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="grid gap-3 pr-10 sm:grid-cols-[1fr_150px] sm:pr-0">
              <Field label="Email">
                <TextInput
                  type="email"
                  value={row.email}
                  onChange={(v) => updateInviteRow(row.id, { email: v })}
                  placeholder="teammate@company.com"
                  disabled={isSent}
                />
              </Field>

              <Field label="Role">
                <SelectInput
                  value={row.role}
                  onChange={(v) => updateInviteRow(row.id, { role: v as TeamRole })}
                  placeholder="Select role"
                  options={ROLE_OPTIONS}
                />
              </Field>
            </div>

            {row.error && (
              <p className="mt-2 text-xs text-destructive">{row.error}</p>
            )}
            {isSent && (
              <p className="mt-2 text-xs font-medium text-green-600">Invite sent</p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addInviteRow}
        className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add another
      </button>

      <div className="mt-2 flex gap-3 rounded-xl border border-border/50 bg-background p-3.5 text-xs text-muted-foreground">
        <span className="mt-0.5 text-base leading-none">💡</span>
        <p>
          <span className="font-medium text-foreground">Approvers</span> confirm payouts.{" "}
          <span className="font-medium text-foreground">Analysts</span> view reports only.
        </p>
      </div>
    </div>
  );
}
