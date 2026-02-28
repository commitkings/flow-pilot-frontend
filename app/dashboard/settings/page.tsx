"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { teamMembers } from "@/lib/mock-data";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const active = searchParams.get("section") ?? "profile";
  const [tab, setTab] = useState<"info" | "prefs">("info");
  const [teamQuery, setTeamQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filteredMembers = useMemo(
    () => teamMembers.filter((member) => member.name.toLowerCase().includes(teamQuery.toLowerCase())),
    [teamQuery]
  );

  return (
    <div>
      {active === "team" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Team Members</h1>
              <p className="mt-1 text-sm text-slate-600">Manage who has access to your FlowPilot workspace and control what they can do.</p>
            </div>
            <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => setInviteOpen(true)}>
              <Plus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            FlowPilot has two roles. Analysts can view runs, transactions, and reports but cannot approve payouts or start runs. Approvers have full access including creating runs and approving disbursements.
          </div>

          <Card className="mt-6 rounded-xl border-slate-200 bg-white">
            <CardContent className="space-y-4 py-5">
              <Input value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} placeholder="Search team members..." className="h-10 rounded-lg" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-245 text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2">Member</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Date Added</th>
                      <th className="py-2">Last Active</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.email} className={`border-b border-slate-100 ${member.status === "Invited" ? "bg-amber-50/40" : member.status === "Suspended" ? "bg-red-50/40" : ""}`}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{member.initials}</span>
                            <div>
                              <p className="font-medium text-slate-900">{member.name} {member.owner ? "👑" : ""}</p>
                              <p className="text-xs text-slate-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2"><StatusBadge status={member.role === "Approver" ? "planning" : "pending"} label={member.role} /></td>
                        <td className="py-2"><StatusBadge status={member.status.toLowerCase() as "active" | "invited" | "suspended"} /></td>
                        <td className="py-2">{member.dateAdded}</td>
                        <td className="py-2">{member.lastActive}</td>
                        <td className="py-2"><button type="button" className="text-slate-500">•••</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-xl border-slate-200 bg-white">
          <CardContent className="space-y-6 py-5">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
              <p className="mt-1 text-sm text-slate-600">Profile and workspace preferences.</p>
            </div>

            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <button type="button" className={`px-2 py-1 text-sm font-medium ${tab === "info" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500"}`} onClick={() => setTab("info")}>Personal Info</button>
              <button type="button" className={`px-2 py-1 text-sm font-medium ${tab === "prefs" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500"}`} onClick={() => setTab("prefs")}>Preferences</button>
            </div>

            {tab === "info" ? (
              <div className="space-y-6">
                <Section title="Profile Photo">
                  <div className="flex items-center gap-4">
                    <span className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white">
                      OA
                      <span className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"><Camera className="h-4 w-4" /></span>
                    </span>
                    <div>
                      <p className="text-sm text-slate-600">Upload a square image, minimum 200x200px. JPG or PNG only.</p>
                      <div className="mt-2 flex gap-2">
                        <Button variant="outline" className="rounded-lg">Upload New Photo</Button>
                        <Button variant="ghost" className="rounded-lg text-red-600">Remove</Button>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Personal Information">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input defaultValue="Oluwaseun" />
                    <Input defaultValue="Adeyemi" />
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Input defaultValue="oluwaseun@acmecorp.com" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2"><StatusBadge status="verified" label="Verified" /></span>
                      </div>
                      <a href="#" className="mt-1 inline-block text-sm text-blue-700">Change email address</a>
                    </div>
                    <Input defaultValue="Chief Financial Officer" />
                    <select className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option>Finance</option></select>
                    <Input defaultValue="+234 0801 234 5678" />
                    <Input defaultValue="+234 0801 000 0000" />
                    <select className="h-9 rounded-md border border-slate-300 px-3 text-sm md:col-span-2"><option>Africa/Lagos (WAT, UTC+1)</option></select>
                  </div>
                </Section>

                <Section title="Business Information">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Business Name", "Acme Corp Ltd"],
                      ["Business Type", "Manufacturing"],
                      ["RC Number", "RC-1234567"],
                      ["Tax ID", "TIN-987654321"],
                      ["City", "Lagos"],
                      ["State", "Lagos State"],
                      ["Country", "Nigeria"],
                      ["Business Phone", "+234 801 000 0000"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700"><span className="text-xs text-slate-500">{label}</span><p className="font-medium text-slate-900">{value}</p></div>
                    ))}
                  </div>
                  <Button variant="outline" className="rounded-lg">Edit Business Information</Button>
                </Section>

                <Section title="Connected Accounts">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div><p className="font-medium">Google</p><p className="text-slate-500">oluwaseun@acmecorp.com</p></div>
                      <div className="flex items-center gap-2"><StatusBadge status="active" label="Connected" /><button className="text-red-600">Disconnect</button></div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div><p className="font-medium">Slack</p><p className="text-slate-500">Not connected</p></div>
                      <Button variant="outline" className="rounded-lg">Connect Slack</Button>
                    </div>
                  </div>
                </Section>

                <Section title="Change Password">
                  <div className="space-y-3">
                    <Input placeholder="Current Password" />
                    <Input placeholder="New Password" />
                    <div className="h-2 rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full bg-emerald-500" /></div>
                    <Input placeholder="Confirm New Password" />
                    <div className="text-sm text-slate-600">✓ Minimum 8 characters · ✓ Uppercase · ✓ Number · ✓ Special character</div>
                    <div className="flex justify-end"><Button className="rounded-lg bg-slate-900 text-white hover:bg-slate-800">Update Password</Button></div>
                  </div>
                </Section>

                <Section title="Two-Factor Authentication">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p>Your account is protected with authenticator app 2FA. Last verified 2 days ago.</p>
                    <Button variant="outline" className="rounded-lg">Manage 2FA</Button>
                  </div>
                </Section>

                <Section title="Active Sessions">
                  <div className="space-y-2 text-sm">
                    <div className="rounded-lg border border-slate-200 p-3"><p className="font-medium">Chrome on macOS</p><p className="text-slate-500">Lagos, Nigeria · Current session · 105.112.44.201</p><StatusBadge status="active" label="Active Now" /></div>
                    <div className="rounded-lg border border-slate-200 p-3"><p className="font-medium">Safari on iPhone</p><p className="text-slate-500">Lagos, Nigeria · Last active 3 hours ago · 105.112.44.198</p><button className="text-red-600">Revoke</button></div>
                    <Button variant="outline" className="rounded-lg border-red-300 text-red-700 hover:bg-red-50">Sign out of all other sessions</Button>
                  </div>
                </Section>
              </div>
            ) : (
              <div className="space-y-6">
                <Section title="Dashboard Preferences">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option>Runs</option></select>
                    <select className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option>25</option></select>
                    <select className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option>DD/MM/YYYY</option></select>
                    <select className="h-9 rounded-md border border-slate-300 px-3 text-sm"><option>₦ Nigerian Naira (NGN)</option></select>
                  </div>
                </Section>

                <Section title="Run Defaults">
                  <input type="range" min={0} max={1} step={0.01} defaultValue={0.35} className="w-full" />
                  <Input placeholder="Default Budget Cap" />
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p>Auto-select All Safe</p>
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">ON</span>
                  </div>
                </Section>

                <Section title="Notification Preferences">
                  <div className="space-y-2 text-sm">
                    {[
                      "Run Completed",
                      "Approval Required",
                      "Payout Failed",
                      "Risk Threshold Exceeded",
                      "New Team Member",
                      "Weekly Summary",
                    ].map((name, index) => (
                      <div key={name} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                        <p>{name}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${index === 4 ? "bg-slate-200 text-slate-700" : "bg-emerald-500 text-white"}`}>{index === 4 ? "OFF" : "ON"}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            <div className="rounded-xl border border-red-300 bg-red-50 p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-red-700"><AlertIcon />Danger Zone</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-red-200 pb-3">
                  <div><p className="font-medium text-slate-900">Export All Data</p><p className="text-slate-600">Download your workspace data.</p></div>
                  <Button variant="outline" className="rounded-lg">Export Data</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-red-700">Delete Account</p><p className="text-slate-600">Permanent deletion of account and data.</p></div>
                  <Button variant="outline" className="rounded-lg border-red-300 text-red-700"><Trash2 className="h-4 w-4" />Delete Account</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-[480px] rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Invite a Team Member.</h3>
              <Button variant="ghost" size="icon" onClick={() => setInviteOpen(false)}>x</Button>
            </div>
            <p className="mt-1 text-sm text-slate-600">They will receive an email invitation to join your FlowPilot workspace.</p>
            <div className="mt-4 space-y-3">
              <Input placeholder="Full Name" />
              <Input placeholder="Email Address" />
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" className="rounded-xl border border-slate-300 p-3 text-left text-sm">
                  <p className="font-medium">Analyst</p>
                  <p className="text-xs text-slate-600">Can view runs, transactions, reports, and forecasts.</p>
                </button>
                <button type="button" className="rounded-xl border-2 border-blue-600 bg-blue-50 p-3 text-left text-sm">
                  <p className="font-medium">Approver</p>
                  <p className="text-xs text-slate-600">Can create runs and approve payouts.</p>
                </button>
              </div>
              <p className="text-xs text-slate-500">You can change a member&apos;s role at any time from the Team Members settings.</p>
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-lg" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button className="rounded-lg bg-blue-600 text-white hover:bg-blue-700">Send Invitation</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-slate-200 pb-5 last:border-0 last:pb-0">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function AlertIcon() {
  return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-700">!</span>;
}
