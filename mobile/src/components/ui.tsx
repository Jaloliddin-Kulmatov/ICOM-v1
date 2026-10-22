import React from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text as RNText, TextInput,
  View, type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { font, radius, space, useColors } from "@/lib/theme";
import { useT } from "@/i18n";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function Screen({ children, scroll = true, refreshing, onRefresh, edges = ["bottom"] as const }: {
  children: React.ReactNode; scroll?: boolean; refreshing?: boolean; onRefresh?: () => void;
  edges?: readonly ("top" | "bottom" | "left" | "right")[];
}) {
  const c = useColors();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.accent} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : children}
    </SafeAreaView>
  );
}

export function Text({ children, style, variant = "body", color, numberOfLines }: {
  children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number;
  variant?: "display" | "title" | "heading" | "body" | "small" | "label"; color?: "ink" | "muted" | "accent" | "coral" | "onAccent";
}) {
  const c = useColors();
  const v = {
    display: { fontSize: font.display, fontWeight: "800" as const, lineHeight: 34 },
    title: { fontSize: font.title, fontWeight: "800" as const, lineHeight: 26 },
    heading: { fontSize: 16, fontWeight: "700" as const, lineHeight: 22 },
    body: { fontSize: font.body, lineHeight: 23 },
    small: { fontSize: font.small, lineHeight: 18 },
    label: { fontSize: font.label, fontWeight: "700" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
  }[variant];
  const colour = { ink: c.ink, muted: c.muted, accent: c.accent, coral: c.coral, onAccent: c.onAccent }[color || (variant === "small" || variant === "label" ? "muted" : "ink")];
  return <RNText numberOfLines={numberOfLines} style={[v, { color: colour }, style]}>{children}</RNText>;
}

export function Card({ children, style, onPress, accessibilityLabel }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string;
}) {
  const c = useColors();
  const base = [styles.card, { backgroundColor: c.card, borderColor: c.rule }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Button({ title, onPress, variant = "primary", icon, loading, disabled, style }: {
  title: string; onPress: () => void; variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = { primary: c.accent, secondary: c.card, ghost: "transparent", danger: c.coralSoft }[variant];
  const fg = { primary: c.onAccent, secondary: c.ink, ghost: c.accent, danger: c.coral }[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor: variant === "secondary" ? c.rule : bg },
        (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.8 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <RNText style={{ color: fg, fontSize: 16, fontWeight: "700" }}>{title}</RNText>
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone = "muted", icon }: {
  label: string; selected?: boolean; onPress?: () => void; tone?: "muted" | "good" | "urgent" | "teal"; icon?: IconName;
}) {
  const c = useColors();
  const tones = {
    muted: { bg: c.bg, fg: c.muted, border: c.rule },
    good: { bg: c.accentSoft, fg: c.accent, border: c.accentSoft },
    urgent: { bg: c.coralSoft, fg: c.coral, border: c.coralSoft },
    teal: { bg: c.tealSoft, fg: c.teal, border: c.tealSoft },
  }[tone];
  const sel = selected ? { bg: c.accent, fg: c.onAccent, border: c.accent } : tones;
  const body = (
    <View style={[styles.chip, { backgroundColor: sel.bg, borderColor: sel.border, alignSelf: "flex-start" }]}>
      {icon && <Ionicons name={icon} size={12} color={sel.fg} />}
      <RNText style={{ color: sel.fg, fontSize: 12, fontWeight: "600" }}>{label}</RNText>
    </View>
  );
  if (!onPress) return body;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} hitSlop={6}>{body}</Pressable>;
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}

export function Input(props: TextInputProps & { label?: string; error?: string }) {
  const c = useColors();
  const { label, error, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label && <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{label}</Text>}
      <TextInput placeholderTextColor={c.muted} {...rest}
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: error ? c.coral : c.rule, color: c.ink }, style]} />
      {error ? <Text variant="small" color="coral">{error}</Text> : null}
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Icon({ name, size = 18, color }: { name: IconName; size?: number; color?: string }) {
  const c = useColors();
  return <Ionicons name={name} size={size} color={color || c.accent} />;
}

export function Loading() {
  const c = useColors();
  return <View style={{ padding: space.xxl, alignItems: "center" }}><ActivityIndicator color={c.accent} /></View>;
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ alignItems: "center", padding: space.xl, gap: space.sm }}>
      <View style={[styles.emptyIcon, { backgroundColor: c.accentSoft }]}><Ionicons name={icon} size={24} color={c.accent} /></View>
      <Text variant="heading" style={{ textAlign: "center" }}>{title}</Text>
      {body ? <Text variant="small" style={{ textAlign: "center" }}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useColors();
  const { t } = useT();
  return (
    <View style={[styles.card, { backgroundColor: c.coralSoft, borderColor: c.coralSoft, gap: space.sm }]} accessibilityRole="alert">
      <Text color="coral">{message}</Text>
      {onRetry && <Button title={t("Try again")} variant="secondary" icon="refresh" onPress={onRetry} />}
    </View>
  );
}

export function PressableRow({ children, onPress, ...rest }: PressableProps & { children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.lg, gap: space.sm },
  button: { minHeight: 48, borderRadius: radius.input, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: space.lg },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 5 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 14, fontSize: 16 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});

/** Two or three side-by-side choices, e.g. "All students | JBNU only". */
export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string; icon?: IconName }[]; onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", padding: 3, borderRadius: radius.input, borderWidth: 1, borderColor: c.rule, backgroundColor: c.card }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10,
              borderRadius: radius.input - 2, backgroundColor: on ? c.accent : "transparent" }}>
            {o.icon && <Ionicons name={o.icon} size={16} color={on ? c.onAccent : c.muted} />}
            <RNText numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: on ? c.onAccent : c.muted }}>{o.label}</RNText>
          </Pressable>
        );
      })}
    </View>
  );
}
