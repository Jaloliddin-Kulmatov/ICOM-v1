# ICOM Mobile — React Native app for icom.ai.kr

The official ICOM mobile app (iOS + Android), built with **Expo SDK 57**, **TypeScript**, **expo-router**, and **NativeWind** (Tailwind for React Native). It talks to the same Flask API that powers the [ICOM website](https://icom.ai.kr) — no backend changes required.

## What's inside

| Screen | What it does | API |
|---|---|---|
| Login / Register | Email + password auth, JWT stored in device SecureStore | `POST /auth/login`, `POST /auth/register` |
| Home | Greeting, member count, top hiring companies, JBNU news | `/admin/jobs/top-companies`, `/news`, `/track/stats` |
| Internships | Live listings with search + field filter, email-alerts toggle | `GET /admin/jobs`, `GET/POST /admin/jobs/alerts` |
| Internship detail | Full description, visa info, deadline, Apply link with click tracking | `GET /admin/jobs/:id`, `POST /admin/jobs/:id/apply-click` |
| Community Q&A | All-Korea + university-scoped questions, answers, delete own content | `GET/POST /chat/posts`, `POST /chat/posts/:id/answers` |
| AI Assistant | Groq-powered chat about visa / housing / banking with suggested prompts | `POST /ai/chat` |
| Profile | View + edit profile, push-notification opt-in, sign out | `GET/PATCH /auth/me` |

## Project structure

```
mobile/
├── app/                      # expo-router file-based routes
│   ├── _layout.tsx           # Root stack + AuthProvider
│   ├── index.tsx             # Redirects to tabs or login
│   ├── (auth)/               # login.tsx, register.tsx
│   ├── (tabs)/               # home, internships, chat, ai, profile
│   ├── internships/[id].tsx  # Internship detail
│   └── chat/                 # [id].tsx thread, new.tsx create-question modal
├── src/
│   ├── lib/                  # api.ts, auth.tsx, storage.ts, types.ts, notifications.ts
│   └── components/ui.tsx     # Button, Input, Card, Badge, Avatar, …
├── global.css                # Tailwind entry (NativeWind)
├── tailwind.config.js        # ICOM brand palette (mirrors the web app)
└── app.json                  # Expo config (name, icons, plugins)
```

## Run it — step by step

### 1. Prerequisites
- Node.js 20+
- The **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Install dependencies
```bash
cd mobile
npm install
```

### 3. Point it at an API
By default the app uses the production backend (`https://icom-backend.onrender.com/api`, set in `app.json → extra.apiUrl`) — **no setup needed**.

To develop against a local Flask backend instead, create `mobile/.env.local`:
```env
# Use your computer's LAN IP, not localhost — the phone can't reach your localhost.
EXPO_PUBLIC_API_URL=http://192.168.0.10:5001/api
```

### 4. Start the dev server
```bash
npm start
```
Scan the QR code with Expo Go (Android) or the Camera app (iOS). The app hot-reloads as you edit.

Other targets:
```bash
npm run web        # run in the browser
npm run android    # open on a connected Android device/emulator
npm run ios        # open on an iOS simulator (macOS only)
npm run typecheck  # tsc --noEmit
```

### 5. Build store binaries (when you're ready to ship)
```bash
npm install -g eas-cli
eas login
eas build --platform android   # .aab for Play Store
eas build --platform ios       # needs an Apple Developer account
```
Bundle IDs are already configured in `app.json` (`kr.ai.icom.app`).

## Notes & known limitations

- **Cold starts** — Render's free tier sleeps after 15 min; the first API call can take ~30 s. The error copy tells users to retry. Consider the $7/mo Starter plan before launch.
- **Push notifications** — the client-side registration is done (`src/lib/notifications.ts`, wired to the Profile screen). It POSTs the Expo push token to `/auth/push-token`, which doesn't exist on the backend yet; the call fails silently until you add that endpoint plus a sender (Expo's push API is free).
- **Google sign-in** — not included yet; the web app's `POST /auth/google` flow expects a browser OAuth token. Add `expo-auth-session` when needed.
- **Image upload for questions** — the thread screen displays post images, but composing with images (web uses base64 data URLs) isn't wired up yet; add `expo-image-picker` when needed.
