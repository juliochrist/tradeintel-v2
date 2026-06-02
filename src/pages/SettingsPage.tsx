import { Crown, RefreshCw, Shield, Sparkles, User } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";

export function SettingsPage() {
  const { profile, refreshProfile, signOut } = useAuth();

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card>
        <User className="text-primary" />
        <h2 className="mt-4 text-lg font-bold">Profile</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs text-muted">Full name</span>
            <input className="field" value={profile?.full_name ?? ""} readOnly />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs text-muted">Email</span>
            <input className="field" value={profile?.email ?? ""} readOnly />
          </label>
        </div>
      </Card>

      <Card>
        <Sparkles className="text-accent" />
        <h2 className="mt-4 text-lg font-bold">Plan</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Current plan: <span className="font-semibold uppercase text-text">{profile?.plan ?? "free"}</span></p>
        {profile?.plan === "pro" && <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent"><Crown size={16} /> Pro enabled</p>}
        <div className="mt-5 rounded-xl border border-border bg-background/40 p-4 text-sm text-muted">
          <p>Weekly AI usage: {profile?.ai_usage_weekly ?? 1} / 3</p>
          <p className="mt-2">Total AI usage: {profile?.ai_usage_total ?? 7} / 12</p>
        </div>
        {profile?.plan === "pro" ? (
          <Button variant="ghost" className="mt-5 w-full" onClick={refreshProfile}><RefreshCw size={16} /> Refresh Profile</Button>
        ) : (
          <Button variant="ai" className="mt-5 w-full">Upgrade to Pro</Button>
        )}
      </Card>

      <Card>
        <Shield className="text-success" />
        <h2 className="mt-4 text-lg font-bold">Security</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Supabase Auth, Row Level Security, protected routes, and backend-only AI keys are built into the architecture.</p>
        <Button variant="ghost" className="mt-5 w-full" onClick={signOut}>Sign Out</Button>
      </Card>
    </div>
  );
}
