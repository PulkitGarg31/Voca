import { ChatOpenAI } from "@langchain/openai";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { MongoClient } from "mongodb";

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
    clientPromise = client.connect();
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

// `sessionId` identifies a single conversation thread (a conversationId).
export async function runVocaChat(userMessage, sessionId) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set in .env.local");
  }

  const model = new ChatOpenAI({
    // NVIDIA NIM is OpenAI-compatible; override the model via env.
    model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,
    temperature: 0.7,
    maxTokens: 1024,
    configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const chain = prompt.pipe(model);

  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: (sessionId) => getHistory(sessionId),
    inputMessagesKey: "input",
    historyMessagesKey: "history",
  });

  const response = await chainWithHistory.invoke(
    { input: userMessage },
    { configurable: { sessionId } }
  );

  return response.content;
}

// One-off helper: example sentences + a mnemonic for a single word (no history).
export async function generateWordHelp(word) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set in .env.local");
  }
  const model = new ChatOpenAI({
    model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,
    temperature: 0.8,
    maxTokens: 400,
    configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
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
