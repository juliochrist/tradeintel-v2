import type { AIAnalysisInput, AnalysisMethod } from "../types";

export const basePrompt =
  "You are TradeIntel, a professional trading decision-support analyst. Keep the answer short, practical, and return only valid JSON.";

export const methodPrompts: Record<AnalysisMethod, string> = {
  scalping: "Analyze for short-term scalping. Prioritize immediate liquidity, volatility, and precise invalidation.",
  smc: "Analyze using smart money concepts: liquidity sweeps, order blocks, imbalance, displacement, and structure.",
  trend: "Analyze trend direction, pullbacks, continuation quality, and momentum confirmation.",
  breakout: "Analyze breakout quality, retest conditions, trapped liquidity, and failure risk.",
};

export function buildAnalysisPrompt(input: AIAnalysisInput) {
  return {
    basePrompt,
    methodPrompt: methodPrompts[input.method],
    userInput: {
      mode: input.mode,
      symbol: input.pair,
      timeframe: input.timeframe,
      notes: input.notes,
      required_json_shape: {
        bias: "buy or sell",
        entry: "price zone",
        stop_loss: "price",
        take_profit: "price",
        confidence: "low/medium/high",
        reason: "short explanation",
      },
    },
  };
}
