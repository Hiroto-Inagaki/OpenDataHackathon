import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import CompassArrow from "../components/CompassArrow";
import ConfirmDialog from "../components/ConfirmDialog";
import DiscoveryButton from "../components/DiscoveryButton";
import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  formatDistance,
  formatElapsedTime,
} from "../lib/geo";
import type {
  CompassTarget,
  CurrentPosition,
  Destination,
  DetourState,
  LandmarkSpot,
} from "../types";

interface GuidanceScreenProps {
  destination: Destination;
  startedAt: number;
  position: CurrentPosition | null;
  lastFixAt: number | null;
  isWaitingForFix: boolean;
  locationError: string | null;
  headingDegrees: number | null;
  onEndWalk: () => void;

  // 寄り道ランドマーク探索機能(FR-LD-05, 6.2): 方角モード内の目的地/寄り道コンパス切り替え。
  activeCompassTarget: CompassTarget;
  onSwitchCompassTarget: (target: CompassTarget) => void;
  detourState: DetourState;
  activeSpot: LandmarkSpot | null;
  detourBearingDegrees: number | null;
  onDiscover: () => void;
  onEndDetour: () => void;
  onSwitchToExplorationMap: () => void;
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
  activeCompassTarget,
  onSwitchCompassTarget,
  detourState,
  activeSpot,
  detourBearingDegrees,
  onDiscover,
  onEndDetour,
  onSwitchToExplorationMap,
}: GuidanceScreenProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const settledPageIndexRef = useRef(0);

  const isDetourActive = detourState.status === "active";

  // FR-LD-02: 経過時間を1秒ごとに更新する(既存挙動を維持)。
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedLabel = formatElapsedTime(now - startedAt);

  const destinationGuidance = useMemo(() => {
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

  // 6.2: 現在どちらを表示しているかに応じて、目的地/寄り道ページへスクロールする。
  // ユーザーのスワイプによる切り替えとの往復を防ぐため、直近に落ち着いたページ番号を記録する。
  useEffect(() => {
    if (pageWidth === 0) return;
    const desiredIndex = activeCompassTarget === "detour" && isDetourActive ? 1 : 0;
    if (desiredIndex === settledPageIndexRef.current) return;
    settledPageIndexRef.current = desiredIndex;
    scrollRef.current?.scrollTo({ x: desiredIndex * pageWidth, animated: true });
  }, [activeCompassTarget, isDetourActive, pageWidth]);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (pageWidth === 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (index === settledPageIndexRef.current) return;
    settledPageIndexRef.current = index;
    onSwitchCompassTarget(index === 1 ? "detour" : "destination");
  };

  const selectTab = (target: CompassTarget) => {
    if (target === "detour" && !isDetourActive) return;
    onSwitchCompassTarget(target);
  };

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
      <View style={styles.topBar}>
        <Pressable
          style={styles.modeSwitchButton}
          onPress={onSwitchToExplorationMap}
          accessibilityRole="button"
          accessibilityLabel="探索マップに切り替える"
        >
          <Text style={styles.modeSwitchButtonText}>探索マップへ</Text>
        </Pressable>
      </View>

      <View style={styles.destinationHeader}>
        <Text style={styles.destinationLabel}>目的地</Text>
        <Text style={styles.destinationName}>{destination.name}</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeCompassTarget === "destination" && styles.tabButtonActive]}
          onPress={() => selectTab("destination")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeCompassTarget === "destination" }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeCompassTarget === "destination" && styles.tabButtonTextActive,
            ]}
          >
            目的地コンパス
          </Text>
        </Pressable>
        {isDetourActive && (
          <Pressable
            style={[styles.tabButton, activeCompassTarget === "detour" && styles.tabButtonActive]}
            onPress={() => selectTab("detour")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeCompassTarget === "detour" }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeCompassTarget === "detour" && styles.tabButtonTextActive,
              ]}
            >
              寄り道コンパス
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={isDetourActive}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
        style={styles.pager}
      >
        <View style={[styles.page, { width: pageWidth || undefined }]}>
          {destinationGuidance ? (
            <>
              <Text style={styles.distanceValue}>
                {formatDistance(destinationGuidance.distanceMeters)}
              </Text>
              <Text style={styles.distanceCaption}>目的地までの直線距離</Text>
              <CompassArrow
                bearingDegrees={destinationGuidance.bearingDegrees}
                headingDegrees={headingDegrees}
              />
            </>
          ) : (
            <Text style={styles.hintText}>現在地の取得を待っています…</Text>
          )}
        </View>

        {isDetourActive && (
          <View style={[styles.page, { width: pageWidth || undefined }]}>
            <Text style={styles.detourCaption}>
              寄り道中です（元の目的地への案内ではありません）
            </Text>
            {detourBearingDegrees !== null ? (
              <CompassArrow
                bearingDegrees={detourBearingDegrees}
                headingDegrees={headingDegrees}
              />
            ) : (
              <Text style={styles.hintText}>現在地の取得を待っています…</Text>
            )}
            <View style={styles.detourActions}>
              <DiscoveryButton
                available={isDetourActive && detourState.status === "active" && detourState.discoveryAvailable}
                onPress={onDiscover}
              />
              <Pressable
                style={styles.endDetourButton}
                onPress={onEndDetour}
                accessibilityRole="button"
                accessibilityLabel="寄り道を終了する"
              >
                <Text style={styles.endDetourButtonText}>寄り道を終了</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

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
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modeSwitchButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#e4e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  modeSwitchButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2933",
  },
  destinationHeader: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  destinationLabel: {
    fontSize: 12,
    color: "#52606d",
  },
  destinationName: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f2f5",
    minHeight: 36,
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#1f2933",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#52606d",
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
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
  detourCaption: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c76e00",
    textAlign: "center",
    marginBottom: 8,
  },
  detourActions: {
    width: "100%",
    marginTop: 16,
    gap: 10,
  },
  endDetourButton: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2933",
    alignItems: "center",
    justifyContent: "center",
  },
  endDetourButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2933",
  },
  hintText: {
    fontSize: 16,
    color: "#52606d",
  },
  statusSection: {
    alignItems: "center",
    marginTop: 8,
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
    paddingHorizontal: 20,
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
    marginHorizontal: 20,
    marginBottom: 20,
  },
  endButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
