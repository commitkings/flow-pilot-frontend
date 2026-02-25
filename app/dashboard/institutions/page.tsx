import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { institutions } from "@/lib/mock-data";

export default function InstitutionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Institutions</h1>
        <p className="mt-1 text-sm text-slate-600">Receiving institutions loaded for payout validation.</p>
      </div>
      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution) => (
            <div key={institution} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700">
              <Building2 className="h-4 w-4 text-blue-700" />
              {institution}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
