import { supabase } from "../lib/supabase";
import type { AIAnalysisInput, AIAnalysisOutput, AIAnalysisRecord } from "../types";

export async function fetchAIAnalyses(userId: string): Promise<AIAnalysisRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data as AIAnalysisRecord[];
}

export async function saveAIAnalysis(userId: string, input: AIAnalysisInput, output: AIAnalysisOutput): Promise<AIAnalysisRecord> {
  const record = {
    user_id: userId,
    method: input.method,
    mode: input.mode,
    pair: input.pair,
    timeframe: input.timeframe,
    notes: input.notes,
    bias: output.bias,
    entry: output.entry,
    stop_loss: output.stop_loss,
    take_profit: output.take_profit,
    confidence: output.confidence,
    reason: output.reason,
  };

  if (!supabase) {
    return {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase.from("ai_analyses").insert(record).select().single();
  if (error) throw error;
  return data as AIAnalysisRecord;
}

export async function deleteAIAnalysis(id: string) {
  if (!supabase) return;

  const { error } = await supabase.from("ai_analyses").delete().eq("id", id);
  if (error) throw error;
}
