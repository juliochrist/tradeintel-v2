import { Lock, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TradingViewWidget } from "../components/TradingViewWidget";
import { useAuth } from "../context/AuthContext";

export function WeeklyAnalysisPage() {
  const { profile } = useAuth();
  const isPro = profile?.plan === "pro";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Weekly Analysis</h2>
            <p className="mt-1 text-sm text-muted">Higher-timeframe intelligence for planning the trading week.</p>
          </div>
          <TrendingUp className="text-primary" />
        </div>
        <TradingViewWidget pair="XAUUSD" timeframe="4h" />
      </Card>

      <Card className="relative overflow-hidden">
        {!isPro && <div className="absolute inset-0 z-10 grid place-items-center bg-background/75 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-primary to-accent"><Lock /></div>
            <h2 className="mt-5 text-2xl font-bold">Weekly Analysis is Pro</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Upgrade to unlock higher-timeframe AI reviews, saved AI history, and unlimited usage.</p>
            <Button variant="ai" className="mt-6 w-full">Upgrade to Pro</Button>
          </div>
        </div>}
        <h2 className="text-lg font-bold">AI Weekly Brief</h2>
        <div className="mt-5 space-y-4 blur-[0px]">
          {[
            ["Bias", "Bullish while price holds above 1938.00"],
            ["Key Zone", "1945.00 - 1948.00 demand retest"],
            ["Invalidation", "Daily close below 1930.00"],
            ["Plan", "Wait for sweep and displacement before entry"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
