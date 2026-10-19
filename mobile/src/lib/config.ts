import Constants from "expo-constants";

// Backend address: EXPO_PUBLIC_API_URL (e.g. a local backend while
// developing), else "extra.apiUrl" in app.json, else the live server.
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL
  || (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl
  || "https://icom-v1.onrender.com/api";

export const WEB_URL = "https://icom.ai.kr";
export const APP_VERSION: string = Constants.expoConfig?.version || "1.0.0";
