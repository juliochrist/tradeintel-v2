import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock, Crown, Lock, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TradingViewWidget } from "../components/TradingViewWidget";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../lib/format";
import { deleteAIAnalysis, fetchAIAnalyses, saveAIAnalysis } from "../services/aiHistoryService";
import { requestAIAnalysis } from "../services/aiService";
import type { AIAnalysisInput, AIAnalysisOutput, AIAnalysisRecord, AnalysisMethod, JournalDraft } from "../types";

const methods: Array<{ id: AnalysisMethod; title: string; description: string; pro?: boolean }> = [
  { id: "scalping", title: "Scalping", description: "Short-term quick trades" },
  { id: "smc", title: "SMC", description: "Smart money concepts", pro: true },
  { id: "trend", title: "Trend", description: "Trend following", pro: true },
  { id: "breakout", title: "Breakout", description: "Breakout strategy", pro: true },
];

export function AIAnalysisPage() {
  const { profile, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState<AIAnalysisInput>({ method: "scalping", pair: "XAUUSD", timeframe: "15m", notes: "", mode: "short-term", market_structure: "bullish", liquidity_event: "none", session: "london", news_risk: "low" });
  const [result, setResult] = useState<AIAnalysisOutput | null>(null);
  const [history, setHistory] = useState<AIAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const usage = useMemo(() => {
    const weekly = profile?.ai_usage_weekly ?? 1;
    const total = profile?.ai_usage_total ?? 7;
    return {
      weekly,
      total,
      weeklyPercent: Math.min((weekly / 3) * 100, 100),
      totalPercent: Math.min((total / 12) * 100, 100),
      locked: profile?.plan === "free" && (weekly >= 3 || total >= 12),
      isPro: profile?.plan === "pro",
    };
  }, [profile]);

  useEffect(() => {
    if (!user?.id || !usage.isPro) return;

    let active = true;
    setHistoryLoading(true);
    setHistoryError("");

    fetchAIAnalyses(user.id)
      .then((records) => {
        if (active) setHistory(records);
      })
      .catch((err) => {
        if (active) setHistoryError(err instanceof Error ? err.message : "Failed to load AI history");
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [usage.isPro, user?.id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (profile?.plan === "free" && methods.find((method) => method.id === input.method)?.pro) {
      setError("This method is available on the Pro plan.");
      return;
    }
    if (usage.locked) {
      setError("AI trial limit reached. Upgrade to Pro for unlimited analysis.");
      return;
    }

    setLoading(true);
    try {
      setResult(await requestAIAnalysis(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentResult() {
    if (!user?.id || !result || savingHistory) return;

    setSavingHistory(true);
    setHistoryError("");

    try {
      const record = await saveAIAnalysis(user.id, input, result);
      setHistory((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, 20));
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to save AI result");
    } finally {
      setSavingHistory(false);
    }
  }

  async function removeHistory(id: string) {
    setDeletingHistoryId(id);
    setHistoryError("");

    try {
      await deleteAIAnalysis(id);
      setHistory((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to delete AI history");
    } finally {
      setDeletingHistoryId(null);
    }
  }

  function loadHistoryResult(record: AIAnalysisRecord) {
    setInput({
      method: record.method,
      pair: record.pair,
      timeframe: record.timeframe,
      notes: record.notes,
      mode: record.mode,
    });
    setResult({
      bias: record.bias,
      entry: record.entry,
      stop_loss: record.stop_loss,
      take_profit: record.take_profit,
      confidence: record.confidence,
      reason: record.reason,
    });
  }

  function createJournalDraft() {
    if (!result) return;

    const draft: JournalDraft = {
      pair: input.pair,
      timeframe: input.timeframe,
      direction: result.bias,
      entry: parseFirstPrice(result.entry),
      sl: parseFirstPrice(result.stop_loss),
      tp: parseFirstPrice(result.take_profit),
      notes: `AI ${input.method} analysis: ${result.reason}`,
    };

    navigate("/journal", { state: { draft } });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <Card>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Short-Term Analysis</h2>
              <p className="mt-1 text-sm text-muted">Generate concise AI trade plans with controlled backend usage.</p>
            </div>
            <div className="flex items-center gap-3">
              {usage.isPro && <span className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent"><Crown size={14} /> Pro</span>}
              <button type="button" className="rounded-lg border border-border p-2 text-muted transition hover:text-text" onClick={refreshProfile} aria-label="Refresh profile"><RefreshCw size={16} /></button>
              <Sparkles className="text-accent" />
            </div>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <section>
              <p className="mb-3 text-sm font-semibold">1. Select Method</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {methods.map((method) => {
                  const disabled = profile?.plan === "free" && method.pro;
                  return (
                    <button
                      type="button"
                      key={method.id}
                      disabled={disabled}
                      onClick={() => setInput({ ...input, method: method.id })}
                      className={`rounded-xl border p-4 text-left transition duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 ${input.method === method.id ? "border-primary bg-primary/15" : "border-border bg-background/40"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{method.title}</p>
                        {disabled && <Lock size={15} className="text-muted" />}
                      </div>
                      <p className="mt-1 text-xs text-muted">{method.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-semibold">2. Market</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs text-muted">Symbol</span>
                  <input className="field" value={input.pair} onChange={(event) => setInput({ ...input, pair: event.target.value.toUpperCase() })} />
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">Timeframe</span>
                  <select className="field" value={input.timeframe} onChange={(event) => setInput({ ...input, timeframe: event.target.value })}>
                    {["1m", "5m", "15m", "1h", "4h", "1d"].map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">Current Price</span>
                  <input className="field" value={input.current_price ?? ""} onChange={(event) => setInput({ ...input, current_price: event.target.value })} placeholder="e.g. 1948.50" />
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">Key Level</span>
                  <input className="field" value={input.key_level ?? ""} onChange={(event) => setInput({ ...input, key_level: event.target.value })} placeholder="e.g. 1945 demand" />
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">Structure</span>
                  <select className="field" value={input.market_structure ?? "bullish"} onChange={(event) => setInput({ ...input, market_structure: event.target.value as AIAnalysisInput["market_structure"] })}>
                    {["bullish", "bearish", "ranging"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">Liquidity</span>
                  <select className="field" value={input.liquidity_event ?? "none"} onChange={(event) => setInput({ ...input, liquidity_event: event.target.value as AIAnalysisInput["liquidity_event"] })}>
                    {["none", "buy-side sweep", "sell-side sweep", "equal highs", "equal lows"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">Session</span>
                  <select className="field" value={input.session ?? "london"} onChange={(event) => setInput({ ...input, session: event.target.value as AIAnalysisInput["session"] })}>
                    {["asia", "london", "new-york", "overlap"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs text-muted">News Risk</span>
                  <select className="field" value={input.news_risk ?? "low"} onChange={(event) => setInput({ ...input, news_risk: event.target.value as AIAnalysisInput["news_risk"] })}>
                    {["low", "medium", "high"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-semibold">3. Additional Notes</p>
              <textarea className="field min-h-32 resize-none" maxLength={500} value={input.notes} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Tell the AI what you want to focus on..." />
              <p className="mt-2 text-right text-xs text-muted">{input.notes.length}/500</p>
            </section>

            <section className="space-y-3">
              {usage.isPro ? (
                <div className="rounded-xl border border-success/25 bg-success/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-success"><Crown size={16} /> Pro AI Access</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Unlimited AI usage, all methods, weekly analysis, and saved AI history.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold">Your AI Trial Usage</p>
                  <UsageBar label={`${usage.weekly} / 3 used this week`} value={usage.weeklyPercent} />
                  <UsageBar label={`Total ${usage.total} / 12 used`} value={usage.totalPercent} />
                </>
              )}
            </section>

            {error && <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
            <Button variant="ai" className="w-full" disabled={loading || usage.locked}>
              <Bot size={16} />
              {loading ? "Generating..." : usage.locked ? "AI Locked" : "Generate AI Analysis"}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Live Chart</h2>
          <TradingViewWidget pair={input.pair} timeframe={input.timeframe} />
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-bold">How it works</h2>
          <div className="mt-5 space-y-5">
            {["Choose method", "Provide context", "Get AI insight"].map((step, index) => (
              <div key={step} className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-sm">{index + 1}</div>
                <div>
                  <p className="font-semibold">{step}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {index === 0 ? "Select an analysis method you want to use." : index === 1 ? "Add market context and your trading idea." : "AI returns a short, actionable JSON trade plan."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">AI Result</h2>
            {result && usage.isPro && (
              <button className="rounded-lg border border-border p-2 text-muted transition hover:text-success disabled:opacity-50" onClick={saveCurrentResult} disabled={savingHistory} aria-label="Save AI result">
                {savingHistory ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              </button>
            )}
          </div>
          {result ? (
            <div className="space-y-4">
              <ResultRow label="Bias" value={result.bias.toUpperCase()} tone={result.bias === "buy" ? "success" : "danger"} />
              <ResultRow label="Entry Zone" value={result.entry} />
              <div className="grid grid-cols-2 gap-3">
                <ResultRow label="Stop Loss" value={result.stop_loss} tone="danger" />
                <ResultRow label="Take Profit" value={result.take_profit} />
              </div>
              <ResultRow label="Confidence" value={result.confidence} tone="success" />
              <p className="rounded-xl border border-border bg-background/40 p-4 text-sm leading-6 text-muted">{result.reason}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="ghost" className="w-full" onClick={saveCurrentResult} disabled={!usage.isPro || savingHistory}>
                  <CheckCircle2 size={16} /> {savingHistory ? "Saving..." : "Save History"}
                </Button>
                <Button variant="ai" className="w-full" onClick={createJournalDraft}>
                  Create Journal Draft
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border text-center">
              <div>
                <Bot className="mx-auto text-primary" />
                <p className="mt-3 font-semibold">No analysis yet</p>
                <p className="mt-1 text-sm text-muted">Generate a plan to see structured JSON output.</p>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">AI History</h2>
              <p className="mt-1 text-xs text-muted">Saved Pro analyses from newest to oldest.</p>
            </div>
            <Clock className="text-primary" />
          </div>

          {historyError && <p className="mb-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{historyError}</p>}

          {!usage.isPro ? (
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted">Upgrade to Pro to save and review AI history.</div>
          ) : historyLoading ? (
            <div className="grid place-items-center py-12 text-muted">
              <RefreshCw className="mb-3 animate-spin text-primary" />
              <p className="text-sm">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="font-semibold">No saved analyses</p>
              <p className="mt-1 text-sm text-muted">Generate and save your first AI result.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className="rounded-xl border border-border bg-background/40 p-4 transition hover:border-primary/50">
                  <button className="w-full text-left" onClick={() => loadHistoryResult(record)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{record.pair} · {record.timeframe}</p>
                        <p className="mt-1 text-xs capitalize text-muted">{record.method} · {formatDate(record.created_at)}</p>
                      </div>
                      <span className={record.bias === "buy" ? "text-sm font-bold uppercase text-success" : "text-sm font-bold uppercase text-danger"}>{record.bias}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{record.reason}</p>
                  </button>
                  <button className="mt-3 inline-flex items-center gap-2 text-xs text-muted transition hover:text-danger" onClick={() => removeHistory(record.id)} disabled={deletingHistoryId === record.id}>
                    {deletingHistoryId === record.id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function UsageBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-muted"><span>{label}</span><span>{Math.round(value)}%</span></div>
      <div className="h-2 rounded-full bg-border"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function ResultRow({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-semibold capitalize ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-text"}`}>{value}</p>
    </div>
  );
}

function parseFirstPrice(value: string) {
  const match = value.match(/-?d+(?:.d+)?/);
  return match ? Number(match[0]) : 0;
}
