import { FormEvent, useMemo, useState } from "react";
import { Filter, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { demoTrades } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { currency, formatDate } from "../lib/format";
import type { Direction, Trade, TradeResult } from "../types";

type TradeForm = Omit<Trade, "id" | "created_at" | "user_id">;

const emptyTrade: TradeForm = {
  pair: "XAUUSD",
  timeframe: "15m",
  direction: "buy",
  entry: 0,
  sl: 0,
  tp: 0,
  result: "win",
  profit: 0,
  notes: "",
};

export function JournalPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>(demoTrades);
  const [filter, setFilter] = useState<"all" | TradeResult>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Trade | null>(null);
  const [form, setForm] = useState<TradeForm>(emptyTrade);

  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => filter === "all" || trade.result === filter)
      .filter((trade) => trade.pair.toLowerCase().includes(query.toLowerCase()) || trade.notes.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filter, query, trades]);

  function resetForm() {
    setEditing(null);
    setForm(emptyTrade);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (editing) {
      setTrades((current) => current.map((trade) => (trade.id === editing.id ? { ...editing, ...form } : trade)));
    } else {
      setTrades((current) => [
        {
          ...form,
          id: crypto.randomUUID(),
          user_id: user?.id ?? "demo-user",
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);
    }
    resetForm();
  }

  function editTrade(trade: Trade) {
    setEditing(trade);
    setForm({
      pair: trade.pair,
      timeframe: trade.timeframe,
      direction: trade.direction,
      entry: trade.entry,
      sl: trade.sl,
      tp: trade.tp,
      result: trade.result,
      profit: trade.profit,
      notes: trade.notes,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-xl border border-border bg-background/60 p-1 text-xs">
            {(["all", "win", "loss", "breakeven"] as const).map((item) => (
              <button key={item} className={`rounded-lg px-4 py-2 capitalize transition ${filter === item ? "bg-primary text-white" : "text-muted hover:text-text"}`} onClick={() => setFilter(item)}>
                {item === "breakeven" ? "BE" : item}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-muted">
              <Search size={16} />
              <input className="w-full bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search trades..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <Button variant="ghost"><Filter size={16} /> Filter</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                {["Pair", "Timeframe", "Direction", "Entry", "SL", "TP", "Result", "P/L", "Date", ""].map((head) => (
                  <th key={head} className="px-3 py-3 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-border/60 transition hover:bg-white/[0.03]">
                  <td className="px-3 py-4 font-semibold">{trade.pair}</td>
                  <td className="px-3 py-4 text-muted">{trade.timeframe}</td>
                  <td className={trade.direction === "buy" ? "px-3 py-4 capitalize text-success" : "px-3 py-4 capitalize text-danger"}>{trade.direction}</td>
                  <td className="px-3 py-4">{trade.entry}</td>
                  <td className="px-3 py-4">{trade.sl}</td>
                  <td className="px-3 py-4">{trade.tp}</td>
                  <td className={trade.result === "loss" ? "px-3 py-4 capitalize text-danger" : "px-3 py-4 capitalize text-success"}>{trade.result}</td>
                  <td className={trade.profit >= 0 ? "px-3 py-4 font-semibold text-success" : "px-3 py-4 font-semibold text-danger"}>{currency.format(trade.profit)}</td>
                  <td className="px-3 py-4 text-muted">{formatDate(trade.created_at)}</td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-border p-2 text-muted hover:text-primary" onClick={() => editTrade(trade)} aria-label="Edit trade"><Pencil size={15} /></button>
                      <button className="rounded-lg border border-border p-2 text-muted hover:text-danger" onClick={() => setTrades((current) => current.filter((item) => item.id !== trade.id))} aria-label="Delete trade"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrades.length === 0 && (
          <div className="grid place-items-center py-16 text-center">
            <p className="text-lg font-semibold">No trades found</p>
            <p className="mt-2 text-sm text-muted">Try a different filter or add a new setup.</p>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{editing ? "Edit Trade" : "Add Trade"}</h2>
            <p className="mt-1 text-sm text-muted">Record the setup, risk, result, and notes.</p>
          </div>
          <Plus className="text-primary" />
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pair" value={form.pair} onChange={(value) => setForm({ ...form, pair: value.toUpperCase() })} />
            <Select label="Timeframe" value={form.timeframe} options={["1m", "5m", "15m", "1h", "4h", "1d"]} onChange={(value) => setForm({ ...form, timeframe: value })} />
            <Select label="Direction" value={form.direction} options={["buy", "sell"]} onChange={(value) => setForm({ ...form, direction: value as Direction })} />
            <Select label="Result" value={form.result} options={["win", "loss", "breakeven"]} onChange={(value) => setForm({ ...form, result: value as TradeResult })} />
            <NumberField label="Entry" value={form.entry} onChange={(value) => setForm({ ...form, entry: value })} />
            <NumberField label="Stop Loss" value={form.sl} onChange={(value) => setForm({ ...form, sl: value })} />
            <NumberField label="Take Profit" value={form.tp} onChange={(value) => setForm({ ...form, tp: value })} />
            <NumberField label="Profit/Loss" value={form.profit} onChange={(value) => setForm({ ...form, profit: value })} />
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-muted">Notes</span>
            <textarea className="field min-h-28 resize-none" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Why did you take this trade?" />
          </label>
          <div className="flex gap-3">
            <Button variant="ai" className="flex-1" type="submit">{editing ? "Save Trade" : "Add Trade"}</Button>
            {editing && <Button variant="ghost" type="button" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">{label}</span>
      <input className="field" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">{label}</span>
      <input className="field" type="number" step="any" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
