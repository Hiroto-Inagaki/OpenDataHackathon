import { useCallback, useEffect, useMemo, useState } from "react";

import { calculateBearingDegrees, calculateDistanceMeters } from "../lib/geo";
import { createDiscoveryRecord } from "../lib/landmark/discoveryRecords";
import { selectLandmarkHints } from "../lib/landmark/hintSelection";
import { computeDiscoveryAvailability } from "../lib/landmark/proximity";
import type {
  CurrentPosition,
  DetourState,
  LandmarkDiscoveryConfig,
  LandmarkDiscoveryRecord,
  LandmarkHint,
  LandmarkSpot,
} from "../types";

interface UseDetourParams {
  spots: LandmarkSpot[];
  position: CurrentPosition | null;
  config: LandmarkDiscoveryConfig;
  walkSessionId: string | null;
}

interface UseDetourResult {
  detourState: DetourState;
  hints: LandmarkHint[];
  activeSpot: LandmarkSpot | null;
  bearingDegrees: number | null;
  discoveryRecords: LandmarkDiscoveryRecord[];
  error: string | null;
  /** FR-LD-04: 「？」マーカーから寄り道を開始する。既に進行中の場合は無効(8.2: 一度に一件)。 */
  startDetour: (spotId: string) => void;
  /** FR-LD-08: 発見の成否にかかわらず、いつでも寄り道を終了する。 */
  endDetour: () => void;
  /** FR-LD-07: 「？」ボタン操作でのみ発見記録を作成する。 */
  discoverCurrentSpot: () => LandmarkDiscoveryRecord | null;
  /** FR-LD-10のエラー表示をUI側で確認後に消せるようにする。 */
  clearError: () => void;
}

/**
 * 寄り道セッション(DetourState)・気配選定・接近判定・発見記録をまとめて管理する。
 * 位置監視の購読自体は行わず、Appから渡されるpositionを使うのみ(10.3)。
 */
export function useDetour({
  spots,
  position,
  config,
  walkSessionId,
}: UseDetourParams): UseDetourResult {
  const [detourState, setDetourState] = useState<DetourState>({
    status: "inactive",
  });
  const [discoveryRecords, setDiscoveryRecords] = useState<
    LandmarkDiscoveryRecord[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const activeSpot = useMemo(() => {
    if (detourState.status !== "active") return null;
    return spots.find((spot) => spot.id === detourState.spotId) ?? null;
  }, [detourState, spots]);

  // FR-LD-06 / FR-LD-10: 新しい位置情報が来るたびに接近判定を更新する。
  // 対象スポットを参照できなくなった場合は、エラーを示して安全に寄り道を終了する。
  useEffect(() => {
    if (detourState.status !== "active") return;

    if (!activeSpot) {
      if (spots.length === 0) return; // スポット取得が未完了なだけの可能性がある

      setError(
        "選択中の寄り道スポットを参照できなくなりました。寄り道を終了しました。",
      );
      setDetourState({ status: "inactive" });
      return;
    }

    if (!position) return; // 位置情報を取得できない間は新しい接近判定を行わない

    const distanceMeters = calculateDistanceMeters(
      position.latitude,
      position.longitude,
      activeSpot.actualLocation.latitude,
      activeSpot.actualLocation.longitude,
    );

    const nextAvailable = computeDiscoveryAvailability({
      previousAvailable: detourState.discoveryAvailable,
      distanceMeters,
      accuracyMeters: position.accuracy,
      config,
    });

    if (nextAvailable !== detourState.discoveryAvailable) {
      setDetourState({ ...detourState, discoveryAvailable: nextAvailable });
    }
  }, [detourState, activeSpot, spots, position, config]);

  const bearingDegrees = useMemo(() => {
    if (!position || !activeSpot) return null;
    return calculateBearingDegrees(
      position.latitude,
      position.longitude,
      activeSpot.actualLocation.latitude,
      activeSpot.actualLocation.longitude,
    );
  }, [position, activeSpot]);

  const discoveredSpotIds = useMemo(
    () => new Set(discoveryRecords.map((record) => record.spotId)),
    [discoveryRecords],
  );

  const hints = useMemo(() => {
    const excludeSpotIds = new Set(discoveredSpotIds);
    if (detourState.status === "active") {
      excludeSpotIds.add(detourState.spotId);
    }
    return selectLandmarkHints(spots, position, config, excludeSpotIds);
  }, [spots, position, config, discoveredSpotIds, detourState]);

  const startDetour = useCallback((spotId: string) => {
    setError(null);
    setDetourState((prev) => {
      // FR-LD-04: 既に寄り道中に別のスポットを選択した場合は無効化する(OQ-LD-暫定方針)。
      if (prev.status === "active") return prev;
      return {
        status: "active",
        spotId,
        startedAt: Date.now(),
        discoveryAvailable: false,
      };
    });
  }, []);

  const endDetour = useCallback(() => {
    setDetourState({ status: "inactive" });
  }, []);

  const discoverCurrentSpot = useCallback((): LandmarkDiscoveryRecord | null => {
    if (detourState.status !== "active" || !detourState.discoveryAvailable) {
      return null;
    }
    if (!walkSessionId) return null;

    const spotId = detourState.spotId;

    // FR-LD-07: 連続操作で重複作成しない(OQ-LD-08暫定方針: 同一散歩内の再訪は一件に集約)。
    const existing = discoveryRecords.find(
      (record) =>
        record.spotId === spotId && record.walkSessionId === walkSessionId,
    );
    if (existing) return existing;

    const record = createDiscoveryRecord(spotId, walkSessionId);
    setDiscoveryRecords((current) => [...current, record]);
    return record;
  }, [detourState, walkSessionId, discoveryRecords]);

  const clearError = useCallback(() => setError(null), []);

  return {
    detourState,
    hints,
    activeSpot,
    bearingDegrees,
    discoveryRecords,
    error,
    startDetour,
    endDetour,
    discoverCurrentSpot,
    clearError,
  };
}
