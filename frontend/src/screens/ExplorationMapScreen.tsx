import { Pressable, StyleSheet, Text, View } from "react-native";

import ExplorationMap from "../components/ExplorationMap";
import type { ExploredPoint } from "../lib/landmark/fog";
import type { CurrentPosition, LandmarkHint } from "../types";

interface ExplorationMapScreenProps {
  destinationName: string;
  position: CurrentPosition | null;
  hints: LandmarkHint[];
  exploredPoints: ExploredPoint[];
  exploredRadiusMeters: number;
  spotsError: string | null;
  isDetourActive: boolean;
  onSelectHint: (spotId: string) => void;
  onSwitchToCompass: () => void;
}

/**
 * FR-LD-01/02/03: 探索マップモード。霧・現在地・気配を表示する。
 * 設計原則1「目的地を失わせない」に沿い、モード内でも目的地名を表示し続ける。
 */
export default function ExplorationMapScreen({
  destinationName,
  position,
  hints,
  exploredPoints,
  exploredRadiusMeters,
  spotsError,
  isDetourActive,
  onSelectHint,
  onSwitchToCompass,
}: ExplorationMapScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.destinationLabel}>目的地</Text>
          <Text style={styles.destinationName}>{destinationName}</Text>
          {isDetourActive && (
            <Text style={styles.detourBadge}>寄り道中です</Text>
          )}
        </View>
        <Pressable
          style={styles.switchButton}
          onPress={onSwitchToCompass}
          accessibilityRole="button"
          accessibilityLabel="方角モードに切り替える"
        >
          <Text style={styles.switchButtonText}>方角モードへ</Text>
        </Pressable>
      </View>

      <View style={styles.mapSection}>
        <ExplorationMap
          currentPosition={
            position
              ? { latitude: position.latitude, longitude: position.longitude }
              : null
          }
          exploredPoints={exploredPoints}
          hints={hints}
          exploredRadiusMeters={exploredRadiusMeters}
          onSelectHint={onSelectHint}
        />
      </View>

      <View style={styles.footer}>
        {spotsError ? (
          <Text style={styles.errorText}>{spotsError}</Text>
        ) : (
          <Text style={styles.hintText}>
            「？」に近づくと、寄り道スポットを発見できます。
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
  },
  headerText: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: "#52606d",
  },
  destinationName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2933",
  },
  detourBadge: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#c76e00",
  },
  switchButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#1f2933",
    alignItems: "center",
    justifyContent: "center",
  },
  switchButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  mapSection: {
    flex: 1,
  },
  footer: {
    padding: 12,
    backgroundColor: "#ffffff",
  },
  hintText: {
    fontSize: 13,
    color: "#52606d",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#b00020",
    textAlign: "center",
  },
});
