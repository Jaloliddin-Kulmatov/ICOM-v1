import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { radius, space, useColors } from "@/lib/theme";
import { Button, Input, Text } from "./ui";
import { useT } from "@/i18n";

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** A date as "YYYY-MM-DD": the phone's own date picker on iOS/Android, a text field on the web. */
export function DateField({ label, value, onChange, placeholder, minimumDate }: {
  label: string; value: string; onChange: (iso: string) => void; placeholder?: string; minimumDate?: Date;
}) {
  const c = useColors();
  const { t } = useT();
  const [showIos, setShowIos] = useState(false);
  const current = fromIso(value) || new Date();

  if (Platform.OS === "web") {
    return (
      <Input label={label} value={value} onChangeText={(v) => onChange(v.trim())} placeholder="YYYY-MM-DD" maxLength={10}
        error={value && !fromIso(value) ? t("Use the format YYYY-MM-DD.") : undefined} />
    );
  }

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: current, mode: "date", minimumDate, onValueChange: (_e, d) => onChange(toIso(d)) });
    } else {
      setShowIos((s) => !s);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{label}</Text>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${label}: ${value || "not set"}`}
        style={{ minHeight: 48, borderWidth: 1, borderColor: c.rule, borderRadius: radius.input, backgroundColor: c.inputBg,
          paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: value ? c.ink : c.muted }}>{value || placeholder || t("Choose a date")}</Text>
        <Ionicons name="calendar-outline" size={18} color={c.accent} />
      </Pressable>
      {Platform.OS === "ios" && showIos && (
        <View style={{ gap: space.sm }}>
          <DateTimePicker value={current} mode="date" display="inline" minimumDate={minimumDate} accentColor={c.accent}
            onValueChange={(_e, d) => onChange(toIso(d))} />
          <Button title={t("Done")} variant="secondary" onPress={() => setShowIos(false)} />
        </View>
      )}
      {value ? (
        <Pressable onPress={() => onChange("")} accessibilityRole="button" hitSlop={8}>
          <Text variant="small" color="muted">Clear date</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
