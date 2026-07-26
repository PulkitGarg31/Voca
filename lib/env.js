// Validates environment configuration once at server startup. Throws on missing
// required vars in production; warns in development so the app still boots.
const REQUIRED = ["MONGODB_URI", "NEXTAUTH_SECRET", "NVIDIA_API_KEY"];
const RECOMMENDED = ["NEXTAUTH_URL"];

let done = false;

export function validateEnv() {
  if (done) return;
  done = true;

  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    const msg = `Missing required environment variables: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "production") throw new Error(msg);
    console.warn("⚠️  " + msg + " — set them in .env.local");
  }

  const recMissing = RECOMMENDED.filter((k) => !process.env[k]);
  if (recMissing.length) {
    console.warn("⚠️  Missing recommended environment variables: " + recMissing.join(", "));
  }
}
