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
            className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-[1fr_180px_auto]"
          >
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

            <div className="flex items-end pb-0.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeInviteRow(row.id)}
                disabled={invites.length === 1 && index === 0}
                className="h-12 w-12 rounded-full border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
