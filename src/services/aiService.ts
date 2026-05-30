import { supabase } from "../lib/supabase";
import { demoAIResult } from "../data/mockData";
import type { AIAnalysisInput, AIAnalysisOutput } from "../types";

export async function requestAIAnalysis(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return demoAIResult;
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "AI analysis failed" }));
    throw new Error(error.message ?? "AI analysis failed");
  }

  return response.json();
}
