import { useEffect, useRef } from "react";

const intervalMap: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

export function TradingViewWidget({ pair = "XAUUSD", timeframe = "15m" }: { pair?: string; timeframe?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget h-full";
    container.current.appendChild(widget);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: pair.includes(":") ? pair : `OANDA:${pair}`,
      interval: intervalMap[timeframe] ?? "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0B0F17",
      gridColor: "rgba(31,41,55,0.65)",
      hide_top_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
    });
    container.current.appendChild(script);
  }, [pair, timeframe]);

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-border bg-card">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(31,41,55,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(31,41,55,0.55)_1px,transparent_1px)] bg-[size:64px_48px]">
        <svg viewBox="0 0 900 360" className="h-full w-full opacity-90" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="fallbackChart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 285 C90 260 120 210 210 226 C290 238 330 176 418 188 C518 202 548 96 650 118 C760 143 770 66 900 84 L900 360 L0 360 Z" fill="url(#fallbackChart)" />
          <path d="M0 285 C90 260 120 210 210 226 C290 238 330 176 418 188 C518 202 548 96 650 118 C760 143 770 66 900 84" fill="none" stroke="#3B82F6" strokeWidth="4" />
        </svg>
        <div className="absolute left-5 top-5 rounded-xl border border-border bg-background/70 px-4 py-3">
          <p className="text-xs text-muted">TradingView</p>
          <p className="mt-1 font-semibold">{pair} · {timeframe}</p>
        </div>
      </div>
      <div ref={container} className="absolute inset-0" />
    </div>
  );
}
