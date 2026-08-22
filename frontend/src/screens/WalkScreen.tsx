import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import LandmarkInfoModal from "../components/LandmarkInfoModal";
import { useDetour } from "../hooks/useDetour";
import { useExploredArea } from "../hooks/useExploredArea";
import { useLandmarkSpots } from "../hooks/useLandmarkSpots";
import { LANDMARK_DISCOVERY_CONFIG } from "../lib/config";
import type {
  CompassTarget,
  CurrentPosition,
  Destination,
  GuidanceMode,
  LandmarkSpot,
} from "../types";
import ExplorationMapScreen from "./ExplorationMapScreen";
import GuidanceScreen from "./GuidanceScreen";

interface WalkScreenProps {
  destination: Destination;
  startedAt: number;
  walkSessionId: string;
  position: CurrentPosition | null;
  lastFixAt: number | null;
  isWaitingForFix: boolean;
  locationError: string | null;
  headingDegrees: number | null;
  onEndWalk: () => void;
}

/**
 * 散歩中画面の合成ルート。方角モード(GuidanceScreen)と探索マップモード
 * (ExplorationMapScreen)を切り替える(FR-LD-01, 6.1)ほか、寄り道状態(useDetour)・
 * 霧の踏破(useExploredArea)・スポット供給(useLandmarkSpots)をここでまとめて保持する。
 * 位置情報・方位センサーの購読はApp側で1回だけ行い、propsとして受け取るのみにする(10.3)。
 */
export default function WalkScreen({
  destination,
  startedAt,
  walkSessionId,
  position,
  lastFixAt,
  isWaitingForFix,
  locationError,
  headingDegrees,
  onEndWalk,
}: WalkScreenProps) {
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>("compass");
  const [activeCompassTarget, setActiveCompassTarget] =
    useState<CompassTarget>("destination");
  const [infoModalSpot, setInfoModalSpot] = useState<LandmarkSpot | null>(
    null,
  );

  const { spots, error: spotsError } = useLandmarkSpots();
  const exploredPoints = useExploredArea(position, LANDMARK_DISCOVERY_CONFIG);
  const detour = useDetour({
    spots,
    position,
    config: LANDMARK_DISCOVERY_CONFIG,
    walkSessionId,
  });

  const handleSwitchGuidanceMode = useCallback(() => {
    // FR-LD-01: モード切り替えは寄り道状態・位置監視を変更しない。
    setGuidanceMode((mode) =>
      mode === "compass" ? "exploration-map" : "compass",
    );
  }, []);

  const handleStartDetour = useCallback(
    (spotId: string) => {
      detour.startDetour(spotId);
      // FR-LD-04/05: 寄り道開始後は方角モードを表示し、初期表示は寄り道コンパスにする。
      setActiveCompassTarget("detour");
      setGuidanceMode("compass");
    },
    [detour],
  );

  const handleEndDetour = useCallback(() => {
    detour.endDetour();
    setActiveCompassTarget("destination");
  }, [detour]);

  const handleDiscover = useCallback(() => {
    const record = detour.discoverCurrentSpot();
    if (record && detour.activeSpot) {
      setInfoModalSpot(detour.activeSpot);
    }
  }, [detour]);

  return (
    <View style={styles.container}>
      {detour.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{detour.error}</Text>
          <Pressable
            onPress={detour.clearError}
            accessibilityRole="button"
            accessibilityLabel="エラー表示を閉じる"
          >
            <Text style={styles.errorBannerDismiss}>閉じる</Text>
          </Pressable>
        </View>
      )}

      {guidanceMode === "compass" ? (
        <GuidanceScreen
          destination={destination}
          startedAt={startedAt}
          position={position}
          lastFixAt={lastFixAt}
          isWaitingForFix={isWaitingForFix}
          locationError={locationError}
          headingDegrees={headingDegrees}
          onEndWalk={onEndWalk}
          activeCompassTarget={activeCompassTarget}
          onSwitchCompassTarget={setActiveCompassTarget}
          detourState={detour.detourState}
          activeSpot={detour.activeSpot}
          detourBearingDegrees={detour.bearingDegrees}
          onDiscover={handleDiscover}
          onEndDetour={handleEndDetour}
          onSwitchToExplorationMap={handleSwitchGuidanceMode}
        />
      ) : (
        <ExplorationMapScreen
          destinationName={destination.name}
          position={position}
          hints={detour.hints}
          exploredPoints={exploredPoints}
          exploredRadiusMeters={LANDMARK_DISCOVERY_CONFIG.exploredRadiusMeters}
          spotsError={spotsError}
          isDetourActive={detour.detourState.status === "active"}
          onSelectHint={handleStartDetour}
          onSwitchToCompass={handleSwitchGuidanceMode}
        />
      )}

      <LandmarkInfoModal
        visible={infoModalSpot !== null}
        content={infoModalSpot?.discoveryContent ?? null}
        source={infoModalSpot?.source ?? null}
        onClose={() => {
          // OQ-LD-07(発見後に自動で目的地コンパスへ戻るか)の暫定方針:
          // 発見情報を確認して閉じた時点で寄り道を自動終了する。
          // ただし、確認前に離脱したくなった場合のため「寄り道を終了」ボタンは引き続き提供する(FR-LD-08)。
          setInfoModalSpot(null);
          handleEndDetour();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorBanner: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: "#fdecea",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b00020",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#b00020",
  },
  errorBannerDismiss: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b00020",
  },
});
