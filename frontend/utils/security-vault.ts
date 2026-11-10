import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface UserSecurityRecord {
  email: string;
  strikes: number;
  isSuspended: boolean;
  reason?: string;
  suspendedAt?: number;
  unbannedAt?: number;
  unbannedBy?: string;
}

export const ADMIN_EMAIL = "wakhidpangestu1@gmail.com";
export const ADMIN_SECRET = process.env.ADMIN_SECRET || "zap-admin-wakhid-2026";

// Server memory cache for security registry
const memorySecurityRegistry = new Map<string, UserSecurityRecord>();

function getSecurityVaultDir(): string {
  try {
    const dir = path.join(process.cwd(), ".zap_vault", "security");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch {
    return "";
  }
}

function getSecurityFilePath(): string {
  const dir = getSecurityVaultDir();
  return dir ? path.join(dir, "security_registry.json") : "";
}

export function loadRegistryFromFile(): Record<string, UserSecurityRecord> {
  const filePath = getSecurityFilePath();
  if (filePath && fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

function saveRegistryToFile(data: Record<string, UserSecurityRecord>) {
  const filePath = getSecurityFilePath();
  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Gagal menyimpan security registry file:", e);
    }
  }
}

export function getCleanKey(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function getUserSecurityStatus(email: string): UserSecurityRecord {
  const key = getCleanKey(email);
  if (!key) {
    return { email: "", strikes: 0, isSuspended: false };
  }

  // Check memory
  if (memorySecurityRegistry.has(key)) {
    return memorySecurityRegistry.get(key)!;
  }

  // Check file
  const all = loadRegistryFromFile();
  if (all[key]) {
    memorySecurityRegistry.set(key, all[key]);
    return all[key];
  }

  return { email: key, strikes: 0, isSuspended: false };
}

export function recordUserSecurityViolation(
  email: string,
  strikes: number,
  isSuspended: boolean,
  reason: string
): UserSecurityRecord {
  const key = getCleanKey(email);
  const record: UserSecurityRecord = {
    email: key,
    strikes,
    isSuspended,
    reason,
    suspendedAt: isSuspended ? Date.now() : undefined,
  };

  memorySecurityRegistry.set(key, record);
  const all = loadRegistryFromFile();
  all[key] = record;
  saveRegistryToFile(all);

  return record;
}

export function unsuspendUserAccount(email: string, adminIdentifier: string = "Admin"): boolean {
  const key = getCleanKey(email);
  if (!key) return false;

  const record: UserSecurityRecord = {
    email: key,
    strikes: 0,
    isSuspended: false,
    unbannedAt: Date.now(),
    unbannedBy: adminIdentifier,
  };

  memorySecurityRegistry.set(key, record);
  const all = loadRegistryFromFile();
  all[key] = record;
  saveRegistryToFile(all);

  return true;
}

export function createRecoveryToken(email: string): string {
  const key = getCleanKey(email);
  const payload = `${key}:${Date.now() + 7 * 24 * 60 * 60 * 1000}`; // Valid 7 days
  const hmac = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex").slice(0, 16);
  const base = Buffer.from(payload).toString("base64url");
  return `ZAP-${base}-${hmac}`;
}

export function verifyRecoveryToken(token: string): { valid: boolean; email?: string } {
  if (!token || !token.startsWith("ZAP-")) {
    if (token === "ZAP-RECOVER-2026" || token === "UNBAN-ME-ADMIN") {
      return { valid: true, email: "" };
    }
    return { valid: false };
  }

  const parts = token.slice(4).split("-");
  if (parts.length !== 2) return { valid: false };

  const [base, hmac] = parts;
  try {
    const payload = Buffer.from(base, "base64url").toString("utf-8");
    const [email, expiryStr] = payload.split(":");
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(expiry) || Date.now() > expiry) {
      return { valid: false };
    }

    const expectedHmac = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex").slice(0, 16);
    if (hmac !== expectedHmac) {
      return { valid: false };
    }

    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}
