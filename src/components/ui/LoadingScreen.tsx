import logo from "../../assets/tradeintel-logo.png";

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-text">
      <div className="flex flex-col items-center gap-4">
        <img src={logo} alt="TradeIntel" className="h-24 w-24 rounded-2xl object-cover" />
        <div className="h-1 w-44 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary to-accent" />
        </div>
      </div>
    </div>
  );
}
