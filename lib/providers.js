import { decryptSecret } from "@/lib/secrets";

// Fixed BYOK provider map. All four expose OpenAI-compatible endpoints, so a
// single ChatOpenAI code path serves every row. Adding a provider = one row.
// NOTE: provider ids here must stay in sync with the aiProvider enum in models/User.js.
export const PROVIDERS = Object.freeze(
  Object.assign(Object.create(null), {
    nvidia: {
      label: "NVIDIA NIM",
      baseURL: "https://integrate.api.nvidia.com/v1",
      defaultModel: () => process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
      keyPrefixes: ["nvapi-"],
    },
    openai: {
      label: "OpenAI",
      baseURL: "https://api.openai.com/v1",
      defaultModel: () => "gpt-4o-mini",
      keyPrefixes: ["sk-"],
    },
    gemini: {
      label: "Google Gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      defaultModel: () => "gemini-flash-latest",
      keyPrefixes: ["AQ.", "AIza"],
    },
    anthropic: {
      // Official OpenAI SDK compatibility layer.
      label: "Anthropic Claude",
      baseURL: "https://api.anthropic.com/v1/",
      defaultModel: () => "claude-haiku-4-5-20251001",
      keyPrefixes: ["sk-ant-"],
    },
  })
);

export const MODEL_NAME_RE = /^[A-Za-z0-9._:/-]{1,100}$/;

// Resolve a user's BYOK config from a User doc loaded with `+aiApiKey`.
// Returns { apiKey, baseURL, model, provider, label } or null when the user
// has no usable key (missing, unknown provider, or undecryptable).
export function resolveByok(user) {
  const p = PROVIDERS[user?.aiProvider];
  if (!p || !user?.aiApiKey) return null;
  const apiKey = decryptSecret(user.aiApiKey);
  if (!apiKey) return null;
  return {
    apiKey,
    baseURL: p.baseURL,
    model: user.aiModel || p.defaultModel(),
    provider: user.aiProvider,
    label: p.label,
  };
}
