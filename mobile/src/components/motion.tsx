import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from "react-native";

// Small entrance animations built on React Native's Animated (works in Expo Go).
// All of them are skipped when the phone's "Reduce Motion" setting is on.
const native = Platform.OS !== "web";

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (live) setReduce(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => { live = false; sub.remove(); };
  }, []);
  return reduce;
}

function useEntrance(delay: number, duration: number, spring = false) {
  const reduce = useReduceMotion();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const anim = spring
      ? Animated.spring(v, { toValue: 1, delay, friction: 6, tension: 70, useNativeDriver: native })
      : Animated.timing(v, { toValue: 1, delay, duration, easing: Easing.out(Easing.cubic), useNativeDriver: native });
    anim.start();
    return () => anim.stop();
  }, [v, delay, duration, spring, reduce]);
  return v;
}

/** Fades in and rises a little. Give siblings increasing `order` for a staggered list. */
export function Rise({ children, order = 0, style }: { children: React.ReactNode; order?: number; style?: StyleProp<ViewStyle> }) {
  const v = useEntrance(80 + order * 70, 420);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Slides a whole page in from the right (dir 1, going forward) or the left (dir -1, going back). */
export function SlideIn({ children, dir, style }: { children: React.ReactNode; dir: 1 | -1; style?: StyleProp<ViewStyle> }) {
  const v = useEntrance(0, 320);
  return (
    <Animated.View style={[{ flex: 1 }, style, { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dir * 48, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Springs in from small to full size, for a logo or icon. */
export function Pop({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useEntrance(delay, 0, true);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}
