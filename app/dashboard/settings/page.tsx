"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Camera,
  Loader2,
  LogOut,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  useOrgProfile,
  useConnections,
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
  useChangePassword,
  useUpdateOrgProfile,
  useExportAccountData,
} from "@/hooks/use-settings-queries";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const orgQuery = useOrgProfile();
  const connectionsQuery = useConnections();
  const updateProfile = useUpdateProfile();
  const uploadAvatarMut = useUploadAvatar();
  const removeAvatarMut = useRemoveAvatar();
  const changePasswordMut = useChangePassword();
  const updateOrg = useUpdateOrgProfile();
  const exportData = useExportAccountData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [jobTitle, setJobTitle] = useState(user?.job_title ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [tz, setTz] = useState(user?.timezone ?? "Africa/Lagos");

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Org edit state
  const [orgEditing, setOrgEditing] = useState(false);
  const [orgForm, setOrgForm] = useState<Record<string, string>>({});

  const org = orgQuery.data;
  const connections = connectionsQuery.data?.connections ?? [];

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || user?.display_name?.slice(0, 2).toUpperCase() || "??";

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMut.mutate(file, {
        onSuccess: () => refreshUser(),
      });
    }
  };

  const handleProfileSave = () => {
    updateProfile.mutate(
      {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        job_title: jobTitle || undefined,
        department: department || undefined,
        phone: phone || undefined,
        timezone: tz || undefined,
      } as any,
      { onSuccess: () => refreshUser() }
    );
  };

  const handlePasswordChange = () => {
    if (newPw !== confirmPw) return;
    changePasswordMut.mutate(
      { current: currentPw, next: newPw },
      {
        onSuccess: () => {
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        },
      }
    );
  };

  const handleOrgSave = () => {
    updateOrg.mutate(orgForm, {
      onSuccess: () => setOrgEditing(false),
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 md:space-y-12 pb-16">
      <PageHeader
        title="Settings"
        description="Profile and workspace preferences."
      />

      <div className="space-y-8 md:space-y-10">
        <Section title="Profile Photo" description="Update your avatar or business logo.">
          <div className="flex items-center gap-6">
            <span className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground shadow-sm overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
              <span
                className="absolute bottom-0 right-0 inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-full bg-brand p-1.5 text-white shadow-md transition-transform hover:scale-105"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </span>
            </span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Upload a square image, minimum 200x200px. JPG or PNG only.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  className="rounded-full shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMut.isPending}
                >
                  {uploadAvatarMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upload New Photo
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeAvatarMut.mutate(undefined, { onSuccess: () => refreshUser() })}
                  disabled={removeAvatarMut.isPending}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Personal Information" description="Review or update your identity details.">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Last Name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-xl" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Email Address</label>
              <div className="relative">
                <Input defaultValue={user?.email ?? ""} disabled className="h-10 rounded-xl pr-28" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  <StatusBadge status="verified" label="Verified" />
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Job Title</label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Timezone</label>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
                <option value="Africa/Accra">Africa/Accra (GMT, UTC+0)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New York (EST/EDT)</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              className="rounded-full bg-brand px-6 text-white shadow-sm transition-all hover:opacity-90"
              onClick={handleProfileSave}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </Section>

        <Section title="Business Information" description="Official company details and registration.">
          {orgQuery.isLoading ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : orgEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
              {["business_name", "business_type", "rc_number", "tax_id", "city", "state", "country", "phone"].map((field) => (
                <div key={field} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground capitalize">{field.replace(/_/g, " ")}</label>
                  <Input
                    className="h-10 rounded-xl"
                    defaultValue={(org as any)?.[field] ?? ""}
                    onChange={(e) => setOrgForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="md:col-span-2 mt-2 flex gap-3 justify-end">
                <Button variant="ghost" className="rounded-full" onClick={() => setOrgEditing(false)}>Cancel</Button>
                <Button className="rounded-full bg-brand text-white" onClick={handleOrgSave} disabled={updateOrg.isPending}>
                  {updateOrg.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Business Name", org?.business_name],
                  ["Business Type", org?.business_type],
                  ["RC Number", org?.rc_number],
                  ["Tax ID", org?.tax_id],
                  ["City", org?.city],
                  ["State", org?.state],
                  ["Country", org?.country],
                  ["Phone", org?.phone],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <p className="mt-0.5 font-semibold text-foreground">{(value as string) || "—"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button variant="outline" className="rounded-full shadow-sm" onClick={() => setOrgEditing(true)}>
                  Edit Business Information
                </Button>
              </div>
            </>
          )}
        </Section>

        <Section title="Connected Accounts" description="Manage single sign-on and external integrations.">
          <div className="space-y-3">
            {connectionsQuery.isLoading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              connections.map((conn) => (
                <div key={conn.provider} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30">
                  <div>
                    <p className="font-semibold text-foreground capitalize">{conn.provider}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{conn.connected ? conn.email : "Not connected"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={conn.connected ? "active" : "pending"} label={conn.connected ? "Connected" : "Not connected"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="Security & Authentication" description="Manage passwords and authorized sessions.">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Change Password</h3>
              <div className="grid gap-3 sm:max-w-md">
                <Input
                  type="password"
                  placeholder="Current Password"
                  className="h-10 rounded-xl"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  className="h-10 rounded-xl"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  className="h-10 rounded-xl"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                <div>
                  <Button
                    className="mt-2 rounded-full px-6 shadow-sm"
                    onClick={handlePasswordChange}
                    disabled={changePasswordMut.isPending || !currentPw || !newPw || newPw !== confirmPw}
                  >
                    {changePasswordMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Danger Zone" description="Irreversible and destructive actions." variant="danger">
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-foreground">Export All Data</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Download your workspace data in JSON format.
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0 rounded-full"
                onClick={() => exportData.mutate()}
                disabled={exportData.isPending}
              >
                {exportData.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Export Data
              </Button>
            </div>

            <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-foreground">Sign Out</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Sign out of your current session on this device.
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-destructive">Delete Account</p>
                <p className="mt-0.5 text-sm text-destructive/80">
                  Permanent deletion of account and all associated data.
                </p>
              </div>
              <Button variant="destructive" className="relative shrink-0 overflow-hidden rounded-full shadow-sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  variant = 'default'
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <div className={`space-y-5 py-6 md:rounded-3xl md:p-8 transition-all ${variant === 'danger' ? '' : ''}`}>
      <div>
        <h2 className={`text-xl font-bold tracking-tight ${variant === 'danger' ? 'text-destructive' : 'text-foreground'}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-1 text-sm ${variant === 'danger' ? 'text-destructive/80' : 'text-muted-foreground'}`}>
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
