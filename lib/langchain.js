import { ChatOpenAI } from "@langchain/openai";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { MongoClient } from "mongodb";
import { PROVIDERS } from "@/lib/providers";

const SYSTEM_PROMPT = `You are VOCA, a strictly focused vocabulary learning assistant built into the VOCA platform.

You ONLY respond to questions about:
- English word meanings, definitions, etymology, pronunciation
- Synonyms, antonyms, and related words
- Example sentences and contextual usage
- Vocabulary learning tips and word recommendations
- Nuances between commonly confused words
- Word categories: Academic, Business, Literature, Science, Daily Use

STRICT RULE: If the user asks ANYTHING outside English vocabulary and word learning — including sports, news, general knowledge, math, coding, history, travel, or any other topic — respond with only this message:
"I'm VOCA, your vocabulary assistant. I can only help with English words and language learning. Try asking me about a word's meaning, pronunciation, or ask for word recommendations! 📚"

Never answer off-topic questions even briefly or partially. Never make exceptions.

For vocabulary questions:
- Be concise (3-5 sentences max unless detail is requested)
- Never use em dashes (—) in your replies; use commas, colons, or separate sentences instead
- ALWAYS wrap every vocabulary word, phrase, or idiom you teach, define, or recommend in double asterisks, like **serendipity** or **a blessing in disguise**. This includes items in numbered or bulleted lists. The app uses this to let the user save it, so never omit it.
- For word definitions always include: pronunciation, part of speech, and one example sentence
- Format word explanations as:
  **Word** /pronunciation/ (part of speech)
  Definition: ...
  Example: "..."
  Tip: ...`;

// Reuse MongoDB client across requests (singleton)
let clientPromise;
function getMongoClient() {
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    // Reset on failure — otherwise one bad handshake caches a rejected
    // promise and poisons this serverless instance forever.
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

// Returns MongoDBChatMessageHistory for a given userId session
async function getHistory(sessionId) {
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");

  return new MongoDBChatMessageHistory({
    collection,
    sessionId,
  });
}

// Owner-key config (NVIDIA). BYOK requests pass their own {apiKey, baseURL, model}.
function ownerConfig() {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set in .env.local");
  }
  return {
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: PROVIDERS.nvidia.baseURL,
    model: PROVIDERS.nvidia.defaultModel(),
  };
}

// Google's OpenAI-compat endpoint rejects unknown fields with a 400
// ("Unknown name \"frequency_penalty\": Cannot find field"). LangChain 0.2.x
// always sends the penalty defaults, so strip them for Gemini requests.
class GeminiChatOpenAI extends ChatOpenAI {
  invocationParams(options) {
    const params = super.invocationParams(options);
    delete params.frequency_penalty;
    delete params.presence_penalty;
    return params;
  }
}

// BYOK configs carry `provider`; the owner config (NVIDIA) does not.
function modelClassFor(cfg) {
  return cfg.provider === "gemini" ? GeminiChatOpenAI : ChatOpenAI;
}

// `sessionId` identifies a single conversation thread (a conversationId).
// Async generator: yields the reply as text chunks. History is managed
// manually (not via RunnableWithMessageHistory) so the user + AI messages are
// persisted only after streaming ends — including a partial reply if the
// stream is cut off, so stored history always matches what the user saw.
// `ai` (optional): {apiKey, baseURL, model} from a user's own key; null = owner key.
export async function* streamVocaChat(userMessage, sessionId, ai = null) {
  const cfg = ai || ownerConfig();
  const ModelClass = modelClassFor(cfg);
  const model = new ModelClass({
    model: cfg.model,
    apiKey: cfg.apiKey,
    temperature: 0.7,
    maxTokens: 1024,
    streaming: true,
    streamUsage: false,
    configuration: { baseURL: cfg.baseURL },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const history = await getHistory(sessionId);
  // Window what goes upstream: full history is still stored, but only the
  // last 12 messages ride along per request, capping token cost per call.
  const past = (await history.getMessages()).slice(-12);

  let full = "";
  try {
    const stream = await prompt.pipe(model).stream({ history: past, input: userMessage });
    for await (const chunk of stream) {
      const text = typeof chunk.content === "string" ? chunk.content : "";
      if (text) {
        full += text;
        yield text;
      }
    }
  } finally {
    // Persist whatever was generated (also runs when the client disconnects
    // mid-stream). Nothing generated → nothing saved, so the user can retry.
    if (full) {
      try {
        await history.addUserMessage(userMessage);
        await history.addAIMessage(full);
      } catch (err) {
        console.error("Failed to persist chat history:", err);
      }
    }
  }
}

// One-off helper: example sentences + a mnemonic for a single word (no history).
export async function generateWordHelp(word, ai = null) {
  const cfg = ai || ownerConfig();
  const ModelClass = modelClassFor(cfg);
  const model = new ModelClass({
    model: cfg.model,
    apiKey: cfg.apiKey,
    temperature: 0.8,
    maxTokens: 400,
    configuration: { baseURL: cfg.baseURL },
  });

  const prompt = `For the English word "${word}", reply in EXACTLY this format and nothing else:

**Examples**
1. <a natural sentence using "${word}">
2. <another natural sentence using "${word}">

**Memory trick**
<one short, vivid mnemonic to remember what "${word}" means>`;

  const res = await model.invoke(prompt);
  return res.content;
}

// Load the last `limit` messages for a conversation (keyed by sessionId).
export async function loadChatHistory(sessionId, limit = 50) {
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");

  const doc = await collection.findOne({ sessionId });
  if (!doc || !doc.messages) return [];

  // Each stored message: { type: "human"|"ai", data: { content } }
  const msgs = doc.messages.slice(-limit);
  return msgs.map((m) => ({
    role:    m.type === "human" ? "user" : "assistant",
    content: m.data?.content || "",
  }));
}

// Whether any NON-EMPTY stored history exists for a session (used by the lazy
// migration). Requires a non-empty messages array so we don't register an
// "Earlier chat" entry that would open to nothing.
export async function historyExists(sessionId) {
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");
  const doc = await collection.findOne(
    { sessionId, messages: { $exists: true, $ne: [] } },
    { projection: { _id: 1 } }
  );
  return Boolean(doc);
}

// Clear the stored messages for a single conversation.
export async function clearChatHistory(sessionId) {
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");
  await collection.deleteOne({ sessionId });
}

// Bulk-delete histories for many sessions (used on account deletion).
export async function deleteHistories(sessionIds) {
  if (!Array.isArray(sessionIds) || sessionIds.length === 0) return;
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");
  await collection.deleteMany({ sessionId: { $in: sessionIds } });
}
