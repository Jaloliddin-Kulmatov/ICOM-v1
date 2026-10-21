import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Sign-in token and small settings. On phones this is the system keychain
// (SecureStore); on the web preview it falls back to localStorage.
const web = Platform.OS === "web";

export async function getItem(key: string): Promise<string | null> {
  if (web) { try { return localStorage.getItem(key); } catch { return null; } }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (web) { try { localStorage.setItem(key, value); } catch { /* storage off */ } return; }
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (web) { try { localStorage.removeItem(key); } catch { /* storage off */ } return; }
  await SecureStore.deleteItemAsync(key);
}
