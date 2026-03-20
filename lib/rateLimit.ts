/**
 * lib/rateLimit.ts
 * Simple client-side rate limiting to prevent spamming actions.
 */

const actionTimestamps: Record<string, number[]> = {};

/**
 * Checks if an action is within rate limits.
 * @param action - Unique identifier for the action (e.g., 'like', 'post', 'message')
 * @param maxCount - Max number of allowed actions in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  action: string,
  maxCount: number,
  windowMs: number
): boolean {
  const now = Date.now();
  if (!actionTimestamps[action]) {
    actionTimestamps[action] = [];
  }

  // Remove timestamps outside the sliding window
  actionTimestamps[action] = actionTimestamps[action].filter(
    (t) => now - t < windowMs
  );

  if (actionTimestamps[action].length >= maxCount) {
    return false; // Rate limited
  }

  actionTimestamps[action].push(now);
  return true; // Allowed
}
