import { Bot, CircleDollarSign, Target, TrendingUp, Wallet } from "lucide-react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, StatCard } from "../components/ui/Card";
import { demoAIResult, demoTrades, performanceData } from "../data/mockData";
import { currency, formatDate } from "../lib/format";

const pieData = [
  { name: "Win", value: demoTrades.filter((trade) => trade.result === "win").length, color: "#22C55E" },
  { name: "Loss", value: demoTrades.filter((trade) => trade.result === "loss").length, color: "#EF4444" },
  { name: "BE", value: demoTrades.filter((trade) => trade.result === "breakeven").length || 1, color: "#8B5CF6" },
];

export function DashboardPage() {
  const totalProfit = demoTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const wins = demoTrades.filter((trade) => trade.result === "win").length;
  const winrate = Math.round((wins / demoTrades.length) * 1000) / 10;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Profit" value={currency.format(totalProfit)} delta="+12.5% from last month">
          <Wallet className="text-primary" size={34} />
        </StatCard>
        <StatCard label="Winrate" value={`${winrate}%`} delta="+4.2% from last month">
          <Target className="text-accent" size={34} />
        </StatCard>
        <StatCard label="Total Trades" value={`${demoTrades.length * 21}`} delta="+18 from last month">
          <TrendingUp className="text-primary" size={34} />
        </StatCard>
        <StatCard label="This Week PnL" value="$210.30" delta="+8.3% from last week">
          <CircleDollarSign className="text-success" size={34} />
        </StatCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_0.8fr]">
        <Card className="min-h-[360px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Performance</h2>
            <div className="flex rounded-xl border border-border bg-background/60 p-1 text-xs text-muted">
              {["Daily", "Weekly", "Monthly", "All Time"].map((item, index) => (
                <button key={item} className={`rounded-lg px-3 py-1.5 ${index === 0 ? "bg-primary text-white" : ""}`}>{item}</button>
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
              <div>
                <p className="text-xs text-muted">Entry Zone</p>
                <p className="mt-1 font-semibold">{demoAIResult.entry}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Confidence</p>
                <p className="mt-1 font-semibold capitalize text-success">{demoAIResult.confidence}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Stop Loss</p>
                <p className="mt-1 font-semibold text-danger">{demoAIResult.stop_loss}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Take Profit</p>
                <p className="mt-1 font-semibold">{demoAIResult.take_profit}</p>
              </div>
            </div>
            <p className="leading-6 text-muted">{demoAIResult.reason}</p>
            <button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]">
              View Full Analysis
            </button>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Trades</h2>
            <a href="/journal" className="text-sm text-primary">View All</a>
          </div>
          <div className="space-y-3">
            {demoTrades.slice(0, 5).map((trade) => (
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
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Trades Overview</h2>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[190px_1fr]">
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={56} outerRadius={82} paddingAngle={4}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-3xl font-bold">{demoTrades.length * 21}</p>
                  <p className="text-xs text-muted">Total</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {pieData.map((item) => (
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
