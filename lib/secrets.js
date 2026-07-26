import crypto from "crypto";

// AES-256-GCM with a key derived from NEXTAUTH_SECRET.
// Stored format: "iv:tag:ciphertext" (each base64).
function derivedKey() {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not set");
  return crypto.createHash("sha256").update(process.env.NEXTAUTH_SECRET).digest();
}

export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

// Returns the plaintext, or null when the value is missing, corrupt, or was
// encrypted under a rotated NEXTAUTH_SECRET — callers treat null as "no key".
export function decryptSecret(stored) {
  try {
    const [iv, tag, data] = String(stored).split(":").map((p) => Buffer.from(p, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
