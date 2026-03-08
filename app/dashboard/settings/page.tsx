"use client";

import { useAuth } from "@/context/auth-context";
import {
  Camera,
  LogOut,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-16">
      <PageHeader
        title="Settings"
        description="Profile and workspace preferences."
      />

      <div className="space-y-10">
        <Section title="Profile Photo" description="Update your avatar or business logo.">
          <div className="flex items-center gap-6">
            <span className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground shadow-sm">
              OA
              <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-full bg-brand p-1.5 text-white shadow-md transition-transform hover:scale-105">
                <Camera className="h-4 w-4" />
              </span>
            </span>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Upload a square image, minimum 200x200px. JPG or PNG only.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button variant="outline" className="rounded-full shadow-sm">
                  Upload New Photo
                </Button>
                <Button variant="ghost" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
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
              <Input defaultValue="Oluwaseun" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Last Name</label>
              <Input defaultValue="Adeyemi" className="h-10 rounded-xl" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Email Address</label>
              <div className="relative">
                <Input defaultValue="oluwaseun@acmecorp.com" className="h-10 rounded-xl pr-28" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  <StatusBadge status="verified" label="Verified" />
                </span>
              </div>
              <button className="mt-1 text-sm font-medium text-brand hover:underline">
                Change email address
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Job Title</label>
              <Input defaultValue="Chief Financial Officer" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Department</label>
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                <option>Finance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mobile Phone</label>
              <Input defaultValue="+234 0801 234 5678" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Office Phone</label>
              <Input defaultValue="+234 0801 000 0000" className="h-10 rounded-xl" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Timezone</label>
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                <option>Africa/Lagos (WAT, UTC+1)</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button className="rounded-full bg-brand px-6 text-white shadow-sm transition-all hover:opacity-90">
              Save Changes
            </Button>
          </div>
        </Section>

        <Section title="Business Information" description="Official company details and registration.">
          <div className="grid gap-4 md:grid-cols-2">
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
              <div key={label} className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <p className="mt-0.5 font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Button variant="outline" className="rounded-full shadow-sm">
              Edit Business Information
            </Button>
          </div>
        </Section>

        <Section title="Dashboard Preferences" description="Customize how information is displayed to you.">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Default Landing Page</label>
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                <option>Runs</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Default Table Size</label>
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                <option>25 Rows</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date Format</label>
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                <option>DD/MM/YYYY</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Display Currency</label>
              <select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                <option>₦ Nigerian Naira (NGN)</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Connected Accounts" description="Manage single sign-on and external integrations.">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30">
              <div>
                <p className="font-semibold text-foreground">Google</p>
                <p className="mt-0.5 text-sm text-muted-foreground">oluwaseun@acmecorp.com</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="active" label="Connected" />
                <button className="text-sm font-medium text-destructive hover:underline">
                  Disconnect
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30">
              <div>
                <p className="font-semibold text-foreground">Slack</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Not connected</p>
              </div>
              <Button variant="outline" className="rounded-full shadow-sm">
                Connect Slack
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Security & Authentication" description="Manage passwords, 2FA, and authorized sessions.">
          <div className="space-y-8">
            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Change Password</h3>
              <div className="grid gap-3 sm:max-w-md">
                <Input type="password" placeholder="Current Password" className="h-10 rounded-xl" />
                <Input type="password" placeholder="New Password" className="h-10 rounded-xl" />
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-green-500" />
                </div>
                <Input type="password" placeholder="Confirm New Password" className="h-10 rounded-xl" />
                <div className="mt-1 tracking-tight text-xs text-muted-foreground">
                  <span className="mr-1 font-bold text-green-600">✓</span> Minimum 8 characters
                  <br />
                  <span className="mr-1 font-bold text-green-600">✓</span> Uppercase & Lowercase
                  <br />
                  <span className="mr-1 font-bold text-green-600">✓</span> Number & Special character
                </div>
                <div>
                  <Button className="mt-2 rounded-full px-6 shadow-sm">Update Password</Button>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Two-Factor */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Two-Factor Authentication</h3>
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Authenticator App configured</p>
                  <p className="text-xs text-muted-foreground">
                    Your account is highly secure. Last verified 2 days ago.
                  </p>
                </div>
                <Button variant="outline" className="shrink-0 rounded-full shadow-sm">
                  Manage 2FA
                </Button>
              </div>
            </div>

            <hr className="border-border/60" />

            {/* Active Sessions */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Active Sessions</h3>
              <div className="space-y-3">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Chrome on macOS</p>
                    <p className="text-xs text-muted-foreground">
                      Lagos, Nigeria · Current session · 105.112.44.201
                    </p>
                  </div>
                  <StatusBadge status="active" label="Active Now" />
                </div>
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Safari on iPhone</p>
                    <p className="text-xs text-muted-foreground">
                      Lagos, Nigeria · Last active 3 hours ago · 105.112.44.198
                    </p>
                  </div>
                  <button className="shrink-0 text-sm font-bold text-destructive hover:underline">
                    Revoke Access
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-full"
                >
                  Sign out of all other sessions
                </Button>
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
                  Download your workspace data in CSV/JSON format.
                </p>
              </div>
              <Button variant="outline" className="shrink-0 rounded-full">
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
    <div className={`space-y-5 rounded-3xl p-6 md:p-8 transition-all ${variant === 'danger' ? '' : ''}`}>
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
