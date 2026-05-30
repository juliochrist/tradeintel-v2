import { demoTrades } from "../data/mockData";
import { supabase } from "../lib/supabase";
import type { Trade } from "../types";

export async function fetchTrades(userId: string): Promise<Trade[]> {
  if (!supabase) return demoTrades;

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Trade[];
}

export async function createTrade(trade: Omit<Trade, "id" | "created_at">): Promise<Trade> {
  if (!supabase) {
    return {
      ...trade,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase.from("trades").insert(trade).select().single();
  if (error) throw error;
  return data as Trade;
}

export async function updateTrade(id: string, trade: Partial<Trade>): Promise<Trade> {
  if (!supabase) return { ...demoTrades[0], ...trade, id };

  const { data, error } = await supabase.from("trades").update(trade).eq("id", id).select().single();
  if (error) throw error;
  return data as Trade;
}

export async function deleteTrade(id: string) {
  if (!supabase) return;

  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw error;
}
