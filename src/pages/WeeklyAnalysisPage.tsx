import { FormEvent, useState } from "react";
import { Bot, CheckCircle2, Crown, Lock, RefreshCw, Save, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TradingViewWidget } from "../components/TradingViewWidget";
import { useAuth } from "../context/AuthContext";
import { saveAIAnalysis } from "../services/aiHistoryService";
import { requestAIAnalysis } from "../services/aiService";
import type { AIAnalysisInput, AIAnalysisOutput } from "../types";

export function WeeklyAnalysisPage() {
  const { profile, user } = useAuth();
  const isPro = profile?.plan === "pro";
  const [input, setInput] = useState<AIAnalysisInput>({
    method: "trend",
    mode: "weekly",
    pair: "XAUUSD",
    timeframe: "4h",
    notes: "",
    market_structure: "bullish",
    liquidity_event: "none",
    session: "london",
    news_risk: "medium",
  });
  const [result, setResult] = useState<AIAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isPro) return;

    setLoading(true);
    setError("");

    try {
      setResult(await requestAIAnalysis(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Weekly analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveWeeklyResult() {
    if (!user?.id || !result) return;

    setSaving(true);
    setError("");

    try {
      await saveAIAnalysis(user.id, input, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weekly analysis");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Weekly Analysis</h2>
              <p className="mt-1 text-sm text-muted">Higher-timeframe intelligence for planning the trading week.</p>
            </div>
            {isPro ? <span className="inline-flex items-center gap-2 rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent"><Crown size={16} /> Pro</span> : <TrendingUp className="text-primary" />}
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs text-muted">Symbol</span>
                <input className="field" value={input.pair} onChange={(event) => setInput({ ...input, pair: event.target.value.toUpperCase() })} />
              </label>
              <label>
                <span className="mb-2 block text-xs text-muted">Higher Timeframe</span>
                <select className="field" value={input.timeframe} onChange={(event) => setInput({ ...input, timeframe: event.target.value })}>
                  {["1h", "4h", "1d"].map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs text-muted">Weekly Bias Context</span>
                <select className="field" value={input.market_structure ?? "bullish"} onChange={(event) => setInput({ ...input, market_structure: event.target.value as AIAnalysisInput["market_structure"] })}>
                  {["bullish", "bearish", "ranging"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs text-muted">Key Weekly Level</span>
                <input className="field" value={input.key_level ?? ""} onChange={(event) => setInput({ ...input, key_level: event.target.value })} placeholder="e.g. 1945 weekly demand" />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs text-muted">Weekly Notes</span>
              <textarea className="field min-h-28 resize-none" maxLength={500} value={input.notes} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Add macro context, key levels, or expected weekly scenario..." />
            </label>

            {error && <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
            <Button variant="ai" className="w-full" disabled={!isPro || loading}>
              <Bot size={16} /> {loading ? "Generating..." : "Generate Weekly Analysis"}
            </Button>
          </form>
        </Card>

        <Card>
          <TradingViewWidget pair={input.pair} timeframe={input.timeframe} />
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        {!isPro && <div className="absolute inset-0 z-10 grid place-items-center bg-background/75 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-primary to-accent"><Lock /></div>
            <h2 className="mt-5 text-2xl font-bold">Weekly Analysis is Pro</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Upgrade to unlock higher-timeframe AI reviews, saved AI history, and unlimited usage.</p>
            <Button variant="ai" className="mt-6 w-full">Upgrade to Pro</Button>
          </div>
        </div>}
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">AI Weekly Brief</h2>
          {result && <button className="rounded-lg border border-border p-2 text-muted transition hover:text-success" onClick={saveWeeklyResult} disabled={saving} aria-label="Save weekly analysis">{saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}</button>}
        </div>
        {result ? (
          <div className="space-y-4">
            <BriefRow label="Bias" value={result.bias.toUpperCase()} tone={result.bias === "buy" ? "success" : "danger"} />
            <BriefRow label="Entry Zone" value={result.entry} />
            <BriefRow label="Stop Loss" value={result.stop_loss} tone="danger" />
            <BriefRow label="Take Profit" value={result.take_profit} />
            <BriefRow label="Confidence" value={result.confidence} tone="success" />
            <p className="rounded-xl border border-border bg-background/40 p-4 text-sm leading-6 text-muted">{result.reason}</p>
            <Button variant="ghost" className="w-full" onClick={saveWeeklyResult} disabled={saving}><CheckCircle2 size={16} /> {saving ? "Saving..." : "Save to AI History"}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              ["Bias", "Generate weekly analysis to build a higher-timeframe plan"],
              ["Key Zone", "Add key levels and market structure context"],
              ["Invalidation", "AI will return a concise stop-loss area"],
              ["Plan", "Save the result into AI History for Pro review"],
            ].map(([label, value]) => <BriefRow key={label} label={label} value={value} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function BriefRow({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-2 font-semibold capitalize ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-text"}`}>{value}</p>
    </div>
  );
}
