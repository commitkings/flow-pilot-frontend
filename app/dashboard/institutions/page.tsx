"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { listInstitutions } from "@/lib/api-client";
import type { Institution } from "@/lib/api-types";

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listInstitutions()
      .then((res) => { if (!cancelled) setInstitutions(res.data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Institutions</h1>
        <p className="mt-1 text-sm text-slate-600">Receiving institutions loaded for payout validation.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load institutions.</p>
      ) : (
      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((inst) => (
            <div key={inst.institutionCode} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700">
              <Building2 className="h-4 w-4 text-blue-700" />
              {inst.institutionName}
            </div>
          ))}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
