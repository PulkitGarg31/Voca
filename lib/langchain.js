import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { MongoClient } from "mongodb";

const SYSTEM_PROMPT = `You are Voca — a strictly focused vocabulary learning assistant built into the Voca platform.

You ONLY respond to questions about:
- English word meanings, definitions, etymology, pronunciation
- Synonyms, antonyms, and related words
- Example sentences and contextual usage
- Vocabulary learning tips and word recommendations
- Nuances between commonly confused words
- Word categories: Academic, Business, Literature, Science, Daily Use

STRICT RULE: If the user asks ANYTHING outside English vocabulary and word learning — including sports, news, general knowledge, math, coding, history, travel, or any other topic — respond with only this message:
"I'm Voca, your vocabulary assistant. I can only help with English words and language learning. Try asking me about a word's meaning, pronunciation, or ask for word recommendations! 📚"

Never answer off-topic questions even briefly or partially. Never make exceptions.

For vocabulary questions:
- Be concise (3-5 sentences max unless detail is requested)
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

export async function runVocaChat(userMessage, userId) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env.local");
  }

  const model = new ChatGoogleGenerativeAI({
    // Overridable via env in case the default model name is unavailable
    // for the installed @langchain/google-genai version / API endpoint.
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
    maxOutputTokens: 1024,
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
    { configurable: { sessionId: userId } }
  );

  return response.content;
}

// One-off helper: example sentences + a mnemonic for a single word (no history).
export async function generateWordHelp(word) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env.local");
  }
  const model = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.8,
    maxOutputTokens: 400,
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

// Load the last `limit` messages for a user from MongoDB
export async function loadChatHistory(userId, limit = 50) {
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");

  const doc = await collection.findOne({ sessionId: userId });
  if (!doc || !doc.messages) return [];

  // Each stored message: { type: "human"|"ai", data: { content } }
  const msgs = doc.messages.slice(-limit);
  return msgs.map((m) => ({
    role:    m.type === "human" ? "user" : "assistant",
    content: m.data?.content || "",
  }));
}

// Clear history for a user
export async function clearChatHistory(userId) {
  const client     = await getMongoClient();
  const collection = client.db("voca").collection("chat_histories");
  await collection.deleteOne({ sessionId: userId });
}
