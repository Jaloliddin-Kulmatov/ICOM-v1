import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

// ICOM "Metro Stop" mark (same artwork as the website's public/logo.svg).
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="ICOM">
      <Rect width={64} height={64} rx={15} fill="#00994a" />
      <Rect x={18} y={12} width={7} height={40} rx={3.5} fill="#fff" fillOpacity={0.35} />
      <Circle cx={21.5} cy={17} r={5} fill="#fff" />
      <Path d="M21.5 32H32" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
      <Circle cx={41} cy={32} r={11} stroke="#fff" strokeWidth={7} fill="none" />
      <Circle cx={41} cy={32} r={3.2} fill="#ff6b5a" />
    </Svg>
  );
}
