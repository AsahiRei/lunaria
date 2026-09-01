import { View } from "react-native";
import { Svg, Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors } from "../constants/theme";

export function SparklineChart({ data }: { data: number[] }) {
  const width = 300;
  const height = 160;
  const padding = 8;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (val - min) / range) * (height - padding * 2),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const lastPoint = points[points.length - 1];

  return (
    <View className="items-center justify-center bg-midnight rounded-lg overflow-hidden">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaGrad)" />
        <Path
          d={linePath}
          fill="none"
          stroke={Colors.primaryLight}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={Colors.primary} />
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="7"
          fill={Colors.primary}
          opacity="0.2"
        />
      </Svg>
    </View>
  );
}
