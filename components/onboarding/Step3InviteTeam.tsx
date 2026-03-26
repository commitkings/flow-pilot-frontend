import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/form-fields";

export type TeamRole = "Approver" | "Analyst";

export type InviteRow = {
  id: string;
  email: string;
  role: TeamRole;
};

const ROLE_OPTIONS = ["Approver", "Analyst"];

interface Step3Props {
  invites: InviteRow[];
  updateInviteRow: (id: string, updates: Partial<InviteRow>) => void;
  addInviteRow: () => void;
  removeInviteRow: (id: string) => void;
}

export function Step3InviteTeam({
  invites, updateInviteRow, addInviteRow, removeInviteRow,
}: Step3Props) {
  return (
    <div className="space-y-4">
      {invites.map((row, index) => {
        return (
          <div
            key={row.id}
            className="relative rounded-2xl border border-border bg-muted/30 p-4"
          >
            {/* Trash — always top-right */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeInviteRow(row.id)}
              disabled={invites.length === 1 && index === 0}
              className="absolute right-3 top-3 h-8 w-8 rounded-full border-border text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <div className="grid gap-4 pr-10 sm:grid-cols-[1fr_160px] sm:pr-0">
              <Field label="Email Address">
                <TextInput
                  type="email"
                  value={row.email}
                  onChange={(v) => updateInviteRow(row.id, { email: v })}
                  placeholder="teammate@company.com"
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
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addInviteRow}
        className="rounded-full border-brand/30 text-brand hover:bg-brand-muted hover:border-brand"
      >
        <Plus className="h-4 w-4" />
        Add Another
      </Button>

      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Approvers</strong> can create runs and approve payouts.{" "}
        <strong className="text-foreground">Analysts</strong> can view runs, transactions, and reports only.
      </div>
    </div>
  );
}
