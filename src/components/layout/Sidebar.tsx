import { BarChart3, Bot, BookOpen, LayoutDashboard, Settings, TrendingUp, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/tradeintel-logo.png";
import { useAuth } from "../../context/AuthContext";
import { clsx } from "../../lib/format";
import { Button } from "../ui/Button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/ai-analysis", label: "AI Analysis", icon: Bot },
  { to: "/weekly-analysis", label: "Weekly Analysis", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();

  return (
    <>
      <button
        aria-label="Close sidebar"
        className={clsx("fixed inset-0 z-30 bg-black/60 lg:hidden", open ? "block" : "hidden")}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 p-4 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TradeIntel" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-lg font-bold leading-none text-text">Trade<span className="text-primary">Intel</span></p>
              <p className="mt-1 text-[11px] text-muted">Your AI Trading Intelligence</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-muted lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted transition duration-200 hover:scale-[1.02] hover:bg-primary/10 hover:text-text",
                  isActive && "bg-gradient-to-r from-primary/30 to-accent/20 text-white shadow-[0_10px_30px_rgba(59,130,246,0.16)]",
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-sm font-semibold text-text">Upgrade to Pro</p>
            <p className="mt-1 text-xs leading-5 text-muted">Unlock unlimited AI analysis and weekly intelligence.</p>
            <Button variant="ai" className="mt-4 w-full py-2 text-xs">Upgrade Now</Button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/55 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold">JT</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{profile?.full_name ?? "John Trader"}</p>
              <p className="text-xs capitalize text-muted">{profile?.plan ?? "free"} Plan</p>
            </div>
            <BarChart3 size={17} className="text-muted" />
          </div>
        </div>
      </aside>
    </>
  );
}
