# CodeNid Application Architecture

CodeNid is a modern, community-driven social platform for developers and builders, built with **React Native (Expo)** and **Supabase**. It focuses on real-time campus collaboration, project sharing, and developer news.

---

## 🏗️ High-Level Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React Native / Expo (SDK 51+) |
| **Navigation** | Expo Router (File-based routing) |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **Middle-tier Server** | Node.js / Express (Hosted on Vercel) |
| **Global State** | Zustand (`userStore`) |
| **Local Persistence** | AsyncStorage |
| **Styling** | Vanilla StyleSheet / NativeWind (Tailwind) |

---

## 📂 Project Structure Overview

### 1. Core Application (`/app`)
Utilizes **Expo Router** for nested, file-based navigation.
- `(auth)/`: Authentication flow (Login, Signup, Profile Completion).
- `(tabs)/`: Main 4-tab dashboard navigation.
  - `index.tsx`: Home Feed (Projects & Dev News).
  - `tavern.tsx`: The "Campus Chat" real-time hub.
  - `explore.tsx`: Discovering new communities.
  - `profile.tsx`: User settings and portfolio.
- `_layout.tsx`: Root layout handling global synchronization and deep linking.

### 2. Components (`/components`)
Modular UI elements used across the app.
- `DevNewsFeed.tsx`: Handles fetching and caching dev news from external APIs.
- `RoomCard.tsx`: Optimized list item for chat rooms.
- `MinecraftLoader.tsx`: Custom themed loading animation.
- `WebSidebar.tsx`: Navigation bridge for desktop/web users.

### 3. State & Logic (`/store`, `/context`, `/lib`)
- **`userStore.ts` (Zustand)**: Serves as the global source of truth for the user's profile, including campus affiliation and verified skills.
- **`AuthContext.tsx`**: Manages the persistent session and onboarding status.
- **`lib/supabase.ts`**: Configures the Supabase client with local storage persistence.
- **`lib/push-notifications.ts`**: Bridge for Expo Push Notifications.

---

## 📡 Data Flow & Infrastructure

### Authentication Flow
1. **App Initializer (`App.js`)**: Recovers the session and checks if the profile is complete.
2. **Supabase Auth**: Handles JWT tokens, MFA, and social logins.
3. **Route Guard**: `_layout.tsx` redirects unauthenticated users to `/login` or incomplete profiles to `/CompleteProfileScreen`.

### Real-time Engine (The Tavern)
The Campus Chat uses **Supabase Realtime** (broadcast & postgres_changes):
- **Messages**: Listens for `INSERT` and `DELETE` events on the `messages` table for specific `room_id`s.
- **Member Count**: Subscribes to the `room_members` table changes to update online/total counts instantly across all clients.

### Background Services (`/server`)
A custom Node.js server handles business logic that shouldn't reside on the client:
- **Push Notifications**: Uses VAPID keys to communicate with Google/Apple push services.
- **Profile Invalidation**: Cleans up cached profile data when usernames change.
- **Cron Jobs**: (Optional) For periodic maintenance or data aggregation.

---

## 🛠️ Database Schema (Key Tables)

| Table | Purpose |
| :--- | :--- |
| `profiles` | User metadata, bio, avatar, and onboarding status. |
| `chat_rooms` | Metadata for communities (name, description, type). |
| `room_members` | Joins users to rooms; tracks join dates and permissions. |
| `messages` | Content, sender_id, and timestamps for all chats. |
| `push_subscriptions` | Stores device tokens linked to user IDs. |

---

## 🚀 Key Architectural Features
- **Offline-First News**: Uses a hybrid approach where we serve cached news from `AsyncStorage` immediately while silently fetching fresh data in the background.
- **Optimistic UI**: Chat messages are added to the local state immediately for a "zero-latency" feel while the database confirms the transaction.
- **Adaptive UI**: The sidebar logic in `_layout.tsx` ensures a premium experience on both mobile devices and wide desktop browsers.
