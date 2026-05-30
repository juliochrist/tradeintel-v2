import { createClient } from "@supabase/supabase-js";
import type { AIAnalysisInput, AIAnalysisOutput, Profile } from "../../src/types";
import { buildAnalysisPrompt } from "../../src/services/promptBuilder";

const WEEKLY_LIMIT = 3;
const TOTAL_LIMIT = 12;
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 183;

const fallbackResult: AIAnalysisOutput = {
  bias: "buy",
  entry: "1945.00 - 1948.00",
  stop_loss: "1938.00",
  take_profit: "1960.00",
  confidence: "high",
  reason: "Price is rebounding from support with bullish liquidity confirmation.",
};

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    return json(response, { message: "Method not allowed" }, 405);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(response, fallbackResult);
  }

  const authHeader = request.headers.authorization;
  const accessToken = authHeader?.replace("Bearer ", "");
  if (!accessToken) return json(response, { message: "Unauthorized" }, 401);

  const authClient = createClient(supabaseUrl, anonKey);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
  if (userError || !userData.user) return json(response, { message: "Unauthorized" }, 401);

  const body = request.body as AIAnalysisInput;
  const validationError = validateInput(body);
  if (validationError) return json(response, { message: validationError }, 400);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) return json(response, { message: "Profile not found" }, 404);

  const normalizedProfile = resetWeeklyIfNeeded(profile as Profile);
  const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const trialExpired = Date.now() - createdAt > SIX_MONTHS_MS;

  if (normalizedProfile.plan === "free") {
    if (trialExpired) return json(response, { message: "AI trial expired. Upgrade to Pro." }, 402);
    if (normalizedProfile.ai_usage_weekly >= WEEKLY_LIMIT) return json(response, { message: "Weekly AI trial limit reached. Upgrade to Pro." }, 402);
    if (normalizedProfile.ai_usage_total >= TOTAL_LIMIT) return json(response, { message: "Total AI trial limit reached. Upgrade to Pro." }, 402);
    if (body.mode === "weekly") return json(response, { message: "Weekly Analysis is available on Pro." }, 402);
    if (body.method !== "scalping") return json(response, { message: "This AI method is available on Pro." }, 402);
  }

  const usagePatch =
    normalizedProfile.plan === "free"
      ? {
          ai_usage_weekly: normalizedProfile.ai_usage_weekly + 1,
          ai_usage_total: normalizedProfile.ai_usage_total + 1,
          ai_usage_reset_date: normalizedProfile.ai_usage_reset_date,
        }
      : {};

  const result = await runOpenAIAnalysis(body);

  if (normalizedProfile.plan === "free") {
    await adminClient.from("profiles").update(usagePatch).eq("id", userData.user.id);
  }

  return json(response, result);
}

function resetWeeklyIfNeeded(profile: Profile): Profile {
  const resetDate = profile.ai_usage_reset_date ? new Date(profile.ai_usage_reset_date) : new Date(0);
  if (resetDate.getTime() > Date.now()) return profile;

  const nextReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { ...profile, ai_usage_weekly: 0, ai_usage_reset_date: nextReset };
}

async function runOpenAIAnalysis(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  if (!process.env.OPENAI_API_KEY) return fallbackResult;

  const prompt = buildAnalysisPrompt(input);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${prompt.basePrompt}\n${prompt.methodPrompt}` },
        { role: "user", content: JSON.stringify(prompt.userInput) },
      ],
    }),
  });

  if (!response.ok) return fallbackResult;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return fallbackResult;

  try {
    return normalizeOutput(JSON.parse(content));
  } catch {
    return fallbackResult;
  }
}

function normalizeOutput(value: Partial<AIAnalysisOutput>): AIAnalysisOutput {
  return {
    bias: value.bias === "sell" ? "sell" : "buy",
    entry: String(value.entry ?? fallbackResult.entry),
    stop_loss: String(value.stop_loss ?? fallbackResult.stop_loss),
    take_profit: String(value.take_profit ?? fallbackResult.take_profit),
    confidence: value.confidence === "low" || value.confidence === "medium" || value.confidence === "high" ? value.confidence : "medium",
    reason: String(value.reason ?? fallbackResult.reason).slice(0, 180),
  };
}

function validateInput(input: AIAnalysisInput) {
  const methods = ["scalping", "smc", "trend", "breakout"];
  if (!methods.includes(input.method)) return "Invalid analysis method";
  if (!input.pair || input.pair.length > 20) return "Invalid pair";
  if (!input.timeframe || input.timeframe.length > 10) return "Invalid timeframe";
  if (input.notes && input.notes.length > 500) return "Notes are too long";
  return "";
}

function json(response: any, body: unknown, status = 200) {
  return response.status(status).json(body);
}
