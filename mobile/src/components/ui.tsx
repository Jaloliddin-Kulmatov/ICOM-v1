import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

// Small shared building blocks so screens stay consistent. Styling follows
// the web app's dark theme (near-black background, indigo #6366f1 accents).

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  className = "",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost" | "danger";
  className?: string;
}) {
  const base = "rounded-xl px-5 py-3.5 items-center justify-center flex-row";
  const styles: Record<string, string> = {
    primary: "bg-icon-500 active:bg-icon-600",
    outline: "border border-border bg-transparent active:bg-card",
    ghost: "bg-transparent active:bg-card",
    danger: "bg-red-600/90 active:bg-red-700",
  };
  const text: Record<string, string> = {
    primary: "text-white",
    outline: "text-icon-300",
    ghost: "text-muted",
    danger: "text-white",
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${styles[variant]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
    >
      {loading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
      <Text className={`font-semibold text-base ${text[variant]}`}>{title}</Text>
    </Pressable>
  );
}

export function Input({
  label,
  error,
  className = "",
  ...props
}: TextInputProps & { label?: string; error?: string; className?: string }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="text-muted text-sm mb-1.5 font-medium">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#5c5c73"
        className={`bg-card border rounded-xl px-4 py-3.5 text-white text-base ${
          error ? "border-red-500" : "border-border"
        }`}
        {...props}
      />
      {error ? <Text className="text-red-400 text-xs mt-1">{error}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`bg-card border border-border rounded-2xl p-4 ${className}`}>
      {children}
    </View>
  );
}

export function Badge({
  label,
  tone = "indigo",
}: {
  label: string;
  tone?: "indigo" | "green" | "amber" | "gray";
}) {
  const tones: Record<string, { bg: string; text: string }> = {
    indigo: { bg: "bg-icon-500/15", text: "text-icon-300" },
    green: { bg: "bg-emerald-500/15", text: "text-emerald-300" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-300" },
    gray: { bg: "bg-white/10", text: "text-muted" },
  };
  const t = tones[tone];
  return (
    <View className={`${t.bg} rounded-full px-2.5 py-1 mr-1.5 mb-1.5`}>
      <Text className={`${t.text} text-xs font-medium`}>{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 mb-4">
      <Text className="text-red-300 text-sm">{message}</Text>
    </View>
  );
}

export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">{children}</View>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <Centered>
      <ActivityIndicator size="large" color="#6366f1" />
      {message ? <Text className="text-muted mt-4 text-center">{message}</Text> : null}
    </Centered>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="items-center py-16 px-8">
      <Text className="text-white text-lg font-semibold text-center">{title}</Text>
      {subtitle ? <Text className="text-muted text-sm text-center mt-2">{subtitle}</Text> : null}
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <View
      className="bg-icon-500/25 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Text className="text-icon-200 font-bold" style={{ fontSize: size * 0.38 }}>
        {letters || "?"}
      </Text>
    </View>
  );
}
