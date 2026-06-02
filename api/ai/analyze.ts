import { createClient } from "@supabase/supabase-js";

type Plan = "free" | "pro";
type Direction = "buy" | "sell";
type AnalysisMethod = "scalping" | "smc" | "trend" | "breakout";
type Confidence = "low" | "medium" | "high";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  plan: Plan;
  ai_usage_weekly: number;
  ai_usage_total: number;
  ai_usage_reset_date: string;
  created_at?: string;
}

interface AIAnalysisInput {
  method: AnalysisMethod;
  pair: string;
  timeframe: string;
  notes: string;
  mode: "short-term" | "weekly";
  current_price?: string;
  market_structure?: "bullish" | "bearish" | "ranging";
  key_level?: string;
  liquidity_event?: "none" | "buy-side sweep" | "sell-side sweep" | "equal highs" | "equal lows";
  session?: "asia" | "london" | "new-york" | "overlap";
  news_risk?: "low" | "medium" | "high";
}

interface AIAnalysisOutput {
  bias: Direction;
  entry: string;
  stop_loss: string;
  take_profit: string;
  confidence: Confidence;
  reason: string;
}

const WEEKLY_LIMIT = 3;
const TOTAL_LIMIT = 12;
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 183;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const basePrompt =
  "You are TradeIntel, a professional trading decision-support analyst. Keep the answer short, practical, and return only valid JSON.";

const methodPrompts: Record<AnalysisMethod, string> = {
  scalping: "Analyze for short-term scalping. Prioritize immediate liquidity, volatility, and precise invalidation.",
  smc: "Analyze using smart money concepts: liquidity sweeps, order blocks, imbalance, displacement, and structure.",
  trend: "Analyze trend direction, pullbacks, continuation quality, and momentum confirmation.",
  breakout: "Analyze breakout quality, retest conditions, trapped liquidity, and failure risk.",
};

const fallbackResult: AIAnalysisOutput = {
  bias: "buy",
  entry: "1945.00 - 1948.00",
  stop_loss: "1938.00",
  take_profit: "1960.00",
  confidence: "high",
  reason: "Price is rebounding from support with bullish liquidity confirmation.",
};

export default async function handler(request: any, response: any) {
  try {
    if (request.method !== "POST") {
      return json(response, { message: "Method not allowed" }, 405);
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(response, { message: "Missing Supabase server environment variables" }, 500);
    }

    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.replace("Bearer ", "");
    if (!accessToken) return json(response, { message: "Unauthorized. Please login first." }, 401);

    const body = parseBody(request.body) as AIAnalysisInput;
    const validationError = validateInput(body);
    if (validationError) return json(response, { message: validationError }, 400);

    const authClient = createClient(supabaseUrl, anonKey);
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
    if (userError || !userData.user) return json(response, { message: "Unauthorized. Please login again." }, 401);

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile) {
      return json(response, { message: "Profile not found. Sign out, sign up again, or check the Supabase profile trigger." }, 404);
    }

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

    const result = await runOpenAIAnalysis(body);

    if (normalizedProfile.plan === "free") {
      const usagePatch = {
        ai_usage_weekly: normalizedProfile.ai_usage_weekly + 1,
        ai_usage_total: normalizedProfile.ai_usage_total + 1,
        ai_usage_reset_date: normalizedProfile.ai_usage_reset_date,
      };
      const { error: updateError } = await adminClient.from("profiles").update(usagePatch).eq("id", userData.user.id);
      if (updateError) console.error("AI usage update failed", updateError.message);
    }

    return json(response, result);
  } catch (error) {
    console.error("AI analyze failed", error);
    const message = error instanceof Error ? error.message : "AI analysis failed";
    return json(response, { message }, 500);
  }
}

function parseBody(body: unknown) {
  if (typeof body === "string") return JSON.parse(body);
  return body;
}

function resetWeeklyIfNeeded(profile: Profile): Profile {
  const resetDate = profile.ai_usage_reset_date ? new Date(profile.ai_usage_reset_date) : new Date(0);
  if (resetDate.getTime() > Date.now()) return profile;

  const nextReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { ...profile, ai_usage_weekly: 0, ai_usage_reset_date: nextReset };
}

async function runOpenAIAnalysis(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY on the server");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      instructions: `${basePrompt}\n${methodPrompts[input.method]}`,
      input: JSON.stringify({
        mode: input.mode,
        symbol: input.pair,
        timeframe: input.timeframe,
        notes: input.notes || "No extra notes provided.",
        current_price: input.current_price || "not provided",
        market_structure: input.market_structure || "not provided",
        key_level: input.key_level || "not provided",
        liquidity_event: input.liquidity_event || "not provided",
        session: input.session || "not provided",
        news_risk: input.news_risk || "not provided",
      }),
      text: {
        format: {
          type: "json_schema",
          name: "tradeintel_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              bias: { type: "string", enum: ["buy", "sell"] },
              entry: { type: "string" },
              stop_loss: { type: "string" },
              take_profit: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
              reason: { type: "string" },
            },
            required: ["bias", "entry", "stop_loss", "take_profit", "confidence", "reason"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 240)}`);
  }

  const data = await response.json();
  const outputText = data.output_text || extractOutputText(data);
  if (!outputText) throw new Error("OpenAI returned an empty response");

  return normalizeOutput(JSON.parse(outputText));
}

function extractOutputText(data: any) {
  return data.output
    ?.flatMap((item: any) => item.content || [])
    ?.find((content: any) => content.type === "output_text")
    ?.text;
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
  if (!input || !methods.includes(input.method)) return "Invalid analysis method";
  if (!input.pair || input.pair.length > 20) return "Invalid pair";
  if (!input.timeframe || input.timeframe.length > 10) return "Invalid timeframe";
  if (input.notes && input.notes.length > 500) return "Notes are too long";
  if (input.current_price && input.current_price.length > 40) return "Current price is too long";
  if (input.key_level && input.key_level.length > 80) return "Key level is too long";
  return "";
}

function json(response: any, body: unknown, status = 200) {
  return response.status(status).json(body);
}
