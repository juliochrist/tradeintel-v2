import { Bell, Bot, Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "../ui/Button";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/journal": "Journal",
  "/ai-analysis": "AI Analysis",
  "/weekly-analysis": "Weekly Analysis",
  "/settings": "Settings",
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const location = useLocation();
  const title = titles[location.pathname] ?? "TradeIntel";

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-border p-2 text-text lg:hidden" onClick={onMenu} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div>
            <p className="text-xl font-bold text-text">{title}</p>
            <p className="hidden text-xs text-muted sm:block">Your AI Trading Intelligence</p>
          </div>
        </div>

        <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-muted md:flex">
          <Search size={16} />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-muted" placeholder="Search trades..." />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ai" className="hidden px-3 py-2 text-xs sm:flex">
            <Bot size={15} />
            AI Analysis
          </Button>
          <button className="rounded-xl border border-border bg-card/50 p-2.5 text-muted transition hover:text-text" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
