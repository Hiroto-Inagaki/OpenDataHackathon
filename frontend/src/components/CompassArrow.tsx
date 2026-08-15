import { StyleSheet, Text, View } from "react-native";

import { bearingToCompassDirection } from "../lib/geo";

interface CompassArrowProps {
  /** 現在地から目的地への方位角（真北基準、0-360°） */
  bearingDegrees: number;
  /** 端末の向き（真北基準）。取得できない場合はnull。 */
  headingDegrees: number | null;
}

export default function CompassArrow({
  bearingDegrees,
  headingDegrees,
}: CompassArrowProps) {
  const isHeadingAvailable = headingDegrees !== null;
  // 端末の向きが分かる場合は、矢印を「画面上＝端末の正面」基準で目的地方向に回転させる。
  // 分からない場合は、地理的な北を画面上として矢印を表示する(FR-03-04フォールバック)。
  const rotation = isHeadingAvailable
    ? bearingDegrees - (headingDegrees as number)
    : bearingDegrees;

  const direction = bearingToCompassDirection(bearingDegrees);

  return (
    <View style={styles.container}>
      <View style={styles.arrowRing}>
        <View
          style={[styles.arrowWrapper, { transform: [{ rotate: `${rotation}deg` }] }]}
        >
          <Text style={styles.arrow}>↑</Text>
        </View>
      </View>
      <Text style={styles.directionLabel}>{direction}</Text>
      <Text style={styles.modeLabel}>
        {isHeadingAvailable ? "端末の向きに連動中" : "地図の北を基準に表示中"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  arrowRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "#1f2933",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  arrowWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 96,
    lineHeight: 96,
    color: "#1f2933",
    fontWeight: "700",
  },
  directionLabel: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2933",
  },
  modeLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#52606d",
  },
});
