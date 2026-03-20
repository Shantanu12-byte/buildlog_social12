# BUILDLOG — Audit & Bug Hunt Report (2026-03-20)

## Summary
A comprehensive security audit, bug hunt, and performance review was conducted. Below are the issues identified and resolved.

---

## AREA 1: CRITICAL BUG FIXES

### Authentication & Sessions
- **[FIXED] BUG-001: Session Persistence**: Verified standard Supabase + AsyncStorage configuration. Improved `RootLayout` loading states.
- **[FIXED] BUG-005: Exposed Auth Errors**: Masked raw Supabase errors in `login.tsx` to prevent account enumeration and provide user-friendly feedback.

### Feed & Interaction
- **[FIXED] BUG-007: Pull to Refresh UI**: Fixed the "white flash" by preventing the full-screen loader from showing during a pull-to-refresh action in `index.tsx`.
- **[FIXED] BUG-008: Like Button Double-Tap**: Added a local `isLiking` state to `FeedPostCard` to debounce interactions and prevent duplicate hype counts.
- **[FIXED] BUG-010: Content Overflow**: Added `numberOfLines` truncation to post titles and descriptions in the feed.

### Profiles & Onboarding
- **[FIXED] BUG-012/014: Username Rules**: Enforced 3-20 character length and alphanumeric-only restriction using `lib/sanitize.ts`.
- **[FIXED] BUG-015: Duplicate Username**: Added a proactive check in `CompleteProfileScreen.tsx` to handle "Username Taken" errors gracefully.

### Chat (Secret Scroll)
- **[FIXED] BUG-016: Message Sent Twice**: Added `sending` state locks to `handleSend` in both `messages.tsx` and `inbox.tsx`.
- **[FIXED] BUG-018: Realtime Leak**: Improved `removeChannel` logic in `openRoom` to ensure old subscriptions are cleared when switching rooms.
- **[FIXED] BUG-020: Empty Message Guard**: Added strict `.trim()` checks before allowing any message transmission.

---

## AREA 2: SECURITY VULNERABILITIES

- **[IMPLEMENTED] SEC-001: Row Level Security (RLS)**: Prepared a comprehensive SQL migration (`supabase/migrations/20260320_audit.sql`) covering `profiles`, `posts`, `dm_rooms`, and `messages`.
- **[IMPLEMENTED] SEC-003: Input Sanitization**: Created `lib/sanitize.ts` to provide centralized sanitization for usernames, bios, and URLs.
- **[IMPLEMENTED] SEC-004: Rate Limiting**: Created `lib/rateLimit.ts` and integrated it into Like and Message actions (Client-side protection).
- **[VERIFIED] SEC-002: Secret Management**: Audited `.env` and `.gitignore` to ensure no sensitive Supabase keys are exposed in client bundles.
- **[HARDENED] SEC-010: E2EE Stability**: Wrapped encryption/decryption in `try-catch` blocks and added `safeDecode` to prevent app-wide crashes on malformed keys.

---

## AREA 3: PERFORMANCE OPTIMIZATIONS

- **[OPTIMIZED] PERF-001: DB Indexes**: Added indexes for `gravity_score`, `user_id`, and `room_id` in the audit migration.
- **[OPTIMIZED] PERF-003: Pagination**: Increased Feed page size to 10 and verified `onEndReached` implementation.
- **[OPTIMIZED] PERF-004: Image Loading**: Configured `expo-image` with `transition` and `cachePolicy="memory-disk"` for a smoother, premium feel.
- **[VERIFIED] PERF-002: Realtime Cleanup**: Audited all `useEffect` hooks for proper `removeChannel` calls.

---

## NEXT STEPS FOR PRODUCTION
1. **Apply Migration**: Run the content of `supabase/migrations/20260320_audit.sql` in the Supabase SQL Editor.
2. **Global Key Sync**: Remind legacy users to log in once to generate their E2EE public keys (automatically handled by the new `RootLayout` logic).
3. **Monitor Sentry**: Check for any remaining `ENCRYPTION_CRASH` logs to identify users with corrupted local storage.
