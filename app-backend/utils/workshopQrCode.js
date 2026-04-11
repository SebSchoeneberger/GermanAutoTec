import crypto from "crypto";

/**
 * Stateless time-window codes for workshop QR check-in.
 * Same secret + window index always yields the same code (no DB).
 */

const DEFAULT_STEP_SECONDS = 60;
const CODE_BYTE_LENGTH = 8; // 16 hex chars — short enough for QR, long enough against guessing

/**
 * @param {string} secret - WORKSHOP_QR_SECRET
 * @param {number} windowId - floor(unixSeconds / stepSeconds)
 * @returns {string} lowercase hex code
 */
export function deriveCode(secret, windowId) {
  if (!secret || typeof secret !== "string") {
    throw new Error("WORKSHOP_QR_SECRET is not configured");
  }
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(String(windowId));
  return hmac.digest("hex").slice(0, CODE_BYTE_LENGTH * 2);
}

export function unixSecondsToWindowId(unixSeconds, stepSeconds) {
  return Math.floor(unixSeconds / stepSeconds);
}

/**
 * @param {number} windowId
 * @param {number} stepSeconds
 * @returns {Date} UTC instant when this window ends (exclusive boundary for "valid until")
 */
export function windowEndDate(windowId, stepSeconds) {
  const endSec = (windowId + 1) * stepSeconds;
  return new Date(endSec * 1000);
}

/**
 * Validates submitted code against current, previous, and next time windows (clock skew + scan at boundary).
 *
 * @param {string} secret
 * @param {string} submitted - from query/body (trimmed)
 * @param {Date} [now=new Date()]
 * @param {number} [stepSeconds]
 * @returns {boolean}
 */
export function isValidWorkshopCode(secret, submitted, now = new Date(), stepSeconds = DEFAULT_STEP_SECONDS) {
  const normalized = typeof submitted === "string" ? submitted.trim().toLowerCase() : "";
  if (!normalized || normalized.length < 16) {
    return false;
  }

  const unixSeconds = Math.floor(now.getTime() / 1000);
  const currentWindow = unixSecondsToWindowId(unixSeconds, stepSeconds);

  for (const delta of [-1, 0, 1]) {
    const expected = deriveCode(secret, currentWindow + delta);
    if (timingSafeEqualHex(normalized, expected)) {
      return true;
    }
  }
  return false;
}

/**
 * @returns {{ windowId: number, code: string, validUntil: Date }}
 */
export function getCurrentDisplayPayload(secret, now = new Date(), stepSeconds = DEFAULT_STEP_SECONDS) {
  const unixSeconds = Math.floor(now.getTime() / 1000);
  const windowId = unixSecondsToWindowId(unixSeconds, stepSeconds);
  const code = deriveCode(secret, windowId);
  const validUntil = windowEndDate(windowId, stepSeconds);
  return { windowId, code, validUntil };
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function getStepSeconds() {
  const raw = process.env.WORKSHOP_QR_STEP_SECONDS;
  if (raw === undefined || raw === "") {
    return DEFAULT_STEP_SECONDS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 15 || n > 3600) {
    return DEFAULT_STEP_SECONDS;
  }
  return n;
}
