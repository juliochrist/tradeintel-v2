import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, RefreshCw, Target, TrendingUp, Wallet } from "lucide-react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, StatCard } from "../components/ui/Card";
import { demoAIResult } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { currency, formatDate } from "../lib/format";
import { fetchTrades } from "../services/tradeService";
import type { Trade } from "../types";

const resultColors = {
  Win: "#22C55E",
  Loss: "#EF4444",
  BE: "#8B5CF6",
};

export function DashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    setLoading(true);
    setError("");

    fetchTrades(user.id)
      .then((data) => {
        if (active) setTrades(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const metrics = useMemo(() => {
    const totalProfit = trades.reduce((sum, trade) => sum + Number(trade.profit), 0);
    const wins = trades.filter((trade) => trade.result === "win").length;
    const losses = trades.filter((trade) => trade.result === "loss").length;
    const breakeven = trades.filter((trade) => trade.result === "breakeven").length;
    const winrate = trades.length ? Math.round((wins / trades.length) * 1000) / 10 : 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyProfit = trades
      .filter((trade) => new Date(trade.created_at).getTime() >= weekAgo)
      .reduce((sum, trade) => sum + Number(trade.profit), 0);

    return { totalProfit, wins, losses, breakeven, winrate, weeklyProfit };
  }, [trades]);

  const performanceData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let cumulative = 0;
    const points = sorted.map((trade) => {
      cumulative += Number(trade.profit);
      return {
        date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(trade.created_at)),
        value: Math.round(cumulative * 100) / 100,
      };
    });

    return points.length ? points : [{ date: "Start", value: 0 }];
  }, [trades]);

  const pieData = useMemo(() => [
    { name: "Win", value: metrics.wins, color: resultColors.Win },
    { name: "Loss", value: metrics.losses, color: resultColors.Loss },
    { name: "BE", value: metrics.breakeven, color: resultColors.BE },
  ].filter((item) => item.value > 0), [metrics]);

  const chartPieData = pieData.length ? pieData : [{ name: "No Data", value: 1, color: "#1F2937" }];

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Profit" value={currency.format(metrics.totalProfit)} delta={loading ? "Loading trades..." : `${metrics.totalProfit >= 0 ? "+" : ""}${currency.format(metrics.totalProfit)} account P/L`}>
          {loading ? <RefreshCw className="animate-spin text-primary" size={34} /> : <Wallet className="text-primary" size={34} />}
        </StatCard>
        <StatCard label="Winrate" value={`${metrics.winrate}%`} delta={`${metrics.wins} wins from ${trades.length} trades`}>
          <Target className="text-accent" size={34} />
        </StatCard>
        <StatCard label="Total Trades" value={`${trades.length}`} delta={`${metrics.losses} losses · ${metrics.breakeven} breakeven`}>
          <TrendingUp className="text-primary" size={34} />
        </StatCard>
        <StatCard label="This Week PnL" value={currency.format(metrics.weeklyProfit)} delta="Rolling last 7 days" tone={metrics.weeklyProfit >= 0 ? "success" : "danger"}>
          <CircleDollarSign className={metrics.weeklyProfit >= 0 ? "text-success" : "text-danger"} size={34} />
        </StatCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_0.8fr]">
        <Card className="min-h-[360px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Performance</h2>
            <div className="flex rounded-xl border border-border bg-background/60 p-1 text-xs text-muted">
              {[
                "Daily",
                "Weekly",
                "Monthly",
                "All Time",
              ].map((item, index) => (
                <button key={item} className={`rounded-lg px-3 py-1.5 ${index === 3 ? "bg-primary text-white" : ""}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fill="url(#performanceFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">AI Insight</h2>
            <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-xs text-primary">Scalping</span>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted">Bias</p>
              <p className="mt-1 text-2xl font-bold uppercase text-success">{demoAIResult.bias}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
              <div><p className="text-xs text-muted">Entry Zone</p><p className="mt-1 font-semibold">{demoAIResult.entry}</p></div>
              <div><p className="text-xs text-muted">Confidence</p><p className="mt-1 font-semibold capitalize text-success">{demoAIResult.confidence}</p></div>
              <div><p className="text-xs text-muted">Stop Loss</p><p className="mt-1 font-semibold text-danger">{demoAIResult.stop_loss}</p></div>
              <div><p className="text-xs text-muted">Take Profit</p><p className="mt-1 font-semibold">{demoAIResult.take_profit}</p></div>
            </div>
            <p className="leading-6 text-muted">{demoAIResult.reason}</p>
            <a href="/ai-analysis" className="block w-full rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-center text-sm font-semibold text-white transition hover:scale-[1.02]">
              Generate AI Analysis
            </a>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Trades</h2>
            <a href="/journal" className="text-sm text-primary">View All</a>
          </div>
          {trades.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">No journal trades yet.</div>
          ) : (
            <div className="space-y-3">
              {trades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-border/70 bg-background/35 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{trade.pair}</p>
                    <p className="text-xs text-muted">{formatDate(trade.created_at)}</p>
                  </div>
                  <span className={trade.direction === "buy" ? "text-success" : "text-danger"}>{trade.direction}</span>
                  <span className={trade.profit >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>{currency.format(trade.profit)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Trades Overview</h2>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[190px_1fr]">
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartPieData} dataKey="value" innerRadius={56} outerRadius={82} paddingAngle={4}>
                    {chartPieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-3xl font-bold">{trades.length}</p>
                  <p className="text-xs text-muted">Total</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {(pieData.length ? pieData : [{ name: "No trades", value: 0, color: "#64748B" }]).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                  <span className="text-muted">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
