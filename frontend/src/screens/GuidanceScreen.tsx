import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import CompassArrow from "../components/CompassArrow";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  formatDistance,
  formatElapsedTime,
} from "../lib/geo";
import type { CurrentPosition, Destination } from "../types";

interface GuidanceScreenProps {
  destination: Destination;
  startedAt: number;
  position: CurrentPosition | null;
  lastFixAt: number | null;
  isWaitingForFix: boolean;
  locationError: string | null;
  headingDegrees: number | null;
  onEndWalk: () => void;
}

function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function GuidanceScreen({
  destination,
  startedAt,
  position,
  lastFixAt,
  isWaitingForFix,
  locationError,
  headingDegrees,
  onEndWalk,
}: GuidanceScreenProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  // FR-02-03: 経過時間を1秒ごとに更新する。
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedLabel = formatElapsedTime(now - startedAt);

  // FR-03-05: 新しい有効な位置情報を取得した場合のみ再計算し、なければ直前の結果を保持する
  // (positionが更新されない限りuseMemoは再計算しない)。
  const guidance = useMemo(() => {
    if (!position) return null;
    return {
      distanceMeters: calculateDistanceMeters(
        position.latitude,
        position.longitude,
        destination.latitude,
        destination.longitude,
      ),
      bearingDegrees: calculateBearingDegrees(
        position.latitude,
        position.longitude,
        destination.latitude,
        destination.longitude,
      ),
    };
  }, [position, destination]);

  const locationStatusLabel = (() => {
    if (locationError && !lastFixAt) {
      return locationError;
    }
    if (isWaitingForFix && lastFixAt) {
      return `位置情報が更新されていません（最終取得: ${formatClockTime(lastFixAt)}）`;
    }
    if (!lastFixAt) {
      return "現在地を取得中です…";
    }
    return `現在地を取得済み（${formatClockTime(lastFixAt)}）`;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.destinationHeader}>
        <Text style={styles.destinationLabel}>目的地</Text>
        <Text style={styles.destinationName}>{destination.name}</Text>
      </View>

      <View style={styles.mainSection}>
        {guidance ? (
          <>
            <Text style={styles.distanceValue}>
              {formatDistance(guidance.distanceMeters)}
            </Text>
            <Text style={styles.distanceCaption}>目的地までの直線距離</Text>
            <CompassArrow
              bearingDegrees={guidance.bearingDegrees}
              headingDegrees={headingDegrees}
            />
          </>
        ) : (
          <Text style={styles.hintText}>現在地の取得を待っています…</Text>
        )}
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.elapsedTime}>{elapsedLabel}</Text>
        <Text style={styles.elapsedCaption}>経過時間</Text>
        <Text
          style={[
            styles.locationStatus,
            isWaitingForFix && styles.locationStatusWarning,
          ]}
        >
          {locationStatusLabel}
        </Text>
      </View>

      <Pressable
        style={styles.endButton}
        onPress={() => setIsConfirmVisible(true)}
      >
        <Text style={styles.endButtonText}>散歩を終了</Text>
      </Pressable>

      <ConfirmDialog
        visible={isConfirmVisible}
        title="散歩を終了しますか？"
        message="散歩を終了すると、この散歩の記録は保存されません。"
        confirmLabel="終了する"
        cancelLabel="キャンセル"
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={() => {
          setIsConfirmVisible(false);
          onEndWalk();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  destinationHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  destinationLabel: {
    fontSize: 12,
    color: "#52606d",
  },
  destinationName: {
    fontSize: 18,
    fontWeight: "700",
  },
  mainSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  distanceValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#1f2933",
  },
  distanceCaption: {
    fontSize: 13,
    color: "#52606d",
    marginBottom: 8,
  },
  hintText: {
    fontSize: 16,
    color: "#52606d",
  },
  statusSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  elapsedTime: {
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  elapsedCaption: {
    fontSize: 12,
    color: "#52606d",
    marginBottom: 8,
  },
  locationStatus: {
    fontSize: 13,
    color: "#52606d",
    textAlign: "center",
  },
  locationStatusWarning: {
    color: "#b00020",
    fontWeight: "600",
  },
  endButton: {
    backgroundColor: "#1f2933",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  endButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
