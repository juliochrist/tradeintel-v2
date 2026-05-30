import { FormEvent, useState } from "react";
import { Bot, Lock, Mail } from "lucide-react";
import { Navigate } from "react-router-dom";
import logo from "../assets/tradeintel-logo.png";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("john@tradeintel.app");
  const [password, setPassword] = useState("tradeintel-demo");
  const [fullName, setFullName] = useState("John Trader");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password, fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-text">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card/30 shadow-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[520px] bg-[radial-gradient(circle_at_45%_30%,rgba(59,130,246,0.18),transparent_30rem)] p-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TradeIntel" className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <p className="text-xl font-bold">Trade<span className="text-primary">Intel</span></p>
              <p className="text-xs text-muted">Your AI Trading Intelligence</p>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">AI Trading Intelligence</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">Professional trading journal for sharper decisions.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted">
              Track trades, review performance, and generate practical AI analysis with plan-based usage controls.
            </p>
          </div>

          <div className="absolute bottom-8 left-8 right-8 grid gap-3 sm:grid-cols-3">
            {["Smart journaling", "AI insights", "Private by design"].map((item) => (
              <div className="glass rounded-xl p-4" key={item}>
                <Bot size={18} className="text-primary" />
                <p className="mt-3 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 lg:p-10">
          <Card className="mx-auto max-w-md">
            <h2 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="mt-2 text-sm text-muted">Demo mode works instantly. Add Supabase env vars for production auth.</p>
            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-muted">Full name</span>
                  <input className="field" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </label>
              )}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted"><Mail size={14} /> Email</span>
                <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted"><Lock size={14} /> Password</span>
                <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {error && <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
              <Button variant="ai" className="w-full" disabled={loading}>
                {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <button className="mt-5 text-sm text-muted hover:text-text" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
