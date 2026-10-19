import Constants from "expo-constants";

// Backend address. Set "extra.apiUrl" in app.json to point a build at another server.
export const API_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || "https://icom-v1.onrender.com/api";

export const WEB_URL = "https://icom.ai.kr";
export const APP_VERSION: string = Constants.expoConfig?.version || "1.0.0";
