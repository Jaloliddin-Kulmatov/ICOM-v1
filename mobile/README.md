# ICOM phone app (iOS and Android)

One Expo (React Native) app for both stores, talking to the same API as
icom.ai.kr. Expo SDK 58, Expo Router (screens live in `src/app/`).

| Tab | What it does |
|---|---|
| Home | Visa countdown, arrival checklist, internships that match you, upcoming club events |
| Jobs | Internships sorted by best match, search and field filters, "Korean needed" / "Visa support" hints |
| Guide | Arrival checklist (synced with the website), visa reminders, guides that work offline |
| Chat | Questions and answers, accept the answer that helped, report |
| Clubs | Campus clubs and nationwide communities, join, events, KakaoTalk link for members |

Messages (with people search) and Profile (career and visa details, CV upload,
job alerts, sign out, delete account) open from the top bar.

## Run it on your phone (Expo Go)

```bash
cd mobile
npm install
npx expo start
```

Install **Expo Go** from the App Store or Google Play and scan the QR code.
Everything works except push notifications on Android, which need a
development build (below). Visa reminders are local notifications and work.

To use a local backend instead of the live one:

```bash
EXPO_PUBLIC_API_URL=http://YOUR-COMPUTER-IP:5001/api npx expo start
```

## Builds with EAS (no Mac or Android Studio needed)

```bash
npx eas-cli@latest login          # your Expo account
npx eas-cli@latest init           # links the project and adds extra.eas.projectId to app.json
npx eas-cli@latest build --profile development --platform android   # dev build with push
npx eas-cli@latest build --profile preview --platform android       # APK for testers
npx eas-cli@latest build --profile production --platform all        # store builds
npx eas-cli@latest submit --platform ios                            # to App Store Connect
```

Push notifications start working as soon as `extra.eas.projectId` exists:
the app registers the phone with `POST /api/devices`, and the backend pushes
new direct messages and answers to your questions through Expo.

## Before store submission

- Apple: Apple Developer Program (US$99/year). Add Sign in with Apple if
  Google or Kakao sign-in is added (guideline 4.8).
- Google Play: developer account (US$25). New personal accounts need a closed
  test with at least 12 testers for 14 days before going public.
- Both: privacy labels / data safety form, screenshots, a demo account for
  reviewers. Account deletion, report and block are already in the app.

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

`src/data/guides.json` is a copy of `backend/data/guides.json`; run
`npm run sync-guides` after the guide pages change.
