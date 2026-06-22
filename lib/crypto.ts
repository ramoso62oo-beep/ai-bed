import crypto from "crypto";

// Clé de chiffrement dérivée de AUTH_SECRET (déjà présent dans l'environnement)
function key() {
  const secret = process.env.AUTH_SECRET || "fallback-dev-secret-change-me";
  return crypto.createHash("sha256").update(secret).digest(); // 32 octets
}

// Chiffre une chaîne (AES-256-GCM). Renvoie iv:tag:ciphertext en base64.
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [ivB, tagB, dataB] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
}
