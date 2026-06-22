import mongoose from "mongoose";

// Metadata for each AI chat conversation. The messages themselves live in the
// native-driver "chat_histories" collection (managed by LangChain), keyed by
// `conversationId` (used as the LangChain sessionId). This model just lets us
// list a user's recent conversations without scanning message arrays.
const ChatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversationId: { type: String, required: true, unique: true },
    title: { type: String, default: "New chat" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ChatConversation ||
  mongoose.model("ChatConversation", ChatConversationSchema);
