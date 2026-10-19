import { useColorScheme } from "react-native";

// "Seoul Morning" tokens from the ICOM master plan. Action green #007f3b keeps
// white text at 5.12:1; line green #00994a is for the logo and large fills only.
const light = {
  bg: "#fbfbf8", card: "#ffffff", ink: "#16213a", muted: "#5c6b80", rule: "#e3e7e1",
  accent: "#007f3b", accentSoft: "#e7f5ec", onAccent: "#ffffff", line: "#00994a",
  coral: "#c4402c", coralSoft: "#fdecea", teal: "#0c6e5e", tealSoft: "#e5f4f1",
  warnSoft: "#fff4e5", warn: "#8a5a12", inputBg: "#ffffff",
};
const dark: typeof light = {
  bg: "#0b1220", card: "#121a2b", ink: "#e8edf3", muted: "#9aa6b8", rule: "#24304a",
  accent: "#2fb36f", accentSoft: "#12301f", onAccent: "#0b1220", line: "#2fb36f",
  coral: "#ff8577", coralSoft: "#3a1d1a", teal: "#3fc7ab", tealSoft: "#0f2a26",
  warnSoft: "#2b2112", warn: "#f0c27a", inputBg: "#0f1626",
};
export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { card: 14, chip: 999, input: 12 };
export const font = { display: 28, title: 20, body: 16, small: 13, label: 11 };
