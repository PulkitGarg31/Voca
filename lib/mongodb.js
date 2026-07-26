import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

// Cached connection to avoid creating a new one on every hot reload in dev
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // A cached connection can go stale between serverless invocations (frozen
  // instance, Atlas closing idle sockets). With bufferCommands:false a query
  // on a dead connection throws instantly, so only trust readyState 1.
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  cached.conn = null;
  // Keep an in-flight connect promise only while actually connecting (2).
  if (cached.promise && mongoose.connection.readyState !== 2) cached.promise = null;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
