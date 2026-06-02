export type Plan = "free" | "pro";
export type TradeResult = "win" | "loss" | "breakeven";
export type Direction = "buy" | "sell";
export type AnalysisMethod = "scalping" | "smc" | "trend" | "breakout";
export type Confidence = "low" | "medium" | "high";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  plan: Plan;
  ai_usage_weekly: number;
  ai_usage_total: number;
  ai_usage_reset_date: string;
  created_at?: string;
}

export interface Trade {
  id: string;
  user_id: string;
  pair: string;
  timeframe: string;
  direction: Direction;
  entry: number;
  sl: number;
  tp: number;
  result: TradeResult;
  profit: number;
  notes: string;
  created_at: string;
}

export interface AIAnalysisInput {
  method: AnalysisMethod;
  pair: string;
  timeframe: string;
  notes: string;
  mode: "short-term" | "weekly";
}

export interface AIAnalysisOutput {
  bias: Direction;
  entry: string;
  stop_loss: string;
  take_profit: string;
  confidence: Confidence;
  reason: string;
}

export interface AIAnalysisRecord extends AIAnalysisInput, AIAnalysisOutput {
  id: string;
  user_id: string;
  created_at: string;
}

export interface AIUsageState {
  allowed: boolean;
  reason?: string;
  weeklyRemaining: number;
  totalRemaining: number;
}
