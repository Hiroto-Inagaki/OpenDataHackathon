import { calculateDistanceMeters } from "../geo";
import type { LandmarkDiscoveryConfig } from "../../types";

export interface ExploredPoint {
  latitude: number;
  longitude: number;
}

/**
 * 10.1「霧・踏破」の責務: 位置ログから踏破範囲を更新する処理をスポット取得や
 * 発見保存から分離する。地図描画方式(霧の見せ方)を変えても、この関数は変更不要にする(10.2)。
 *
 * 新しい地点が既存の踏破済み地点からexploredRadiusMeters未満であれば追加しない
 * (FR-LD-02: 無制限に地点を積み上げず、位置更新ごとの処理量を抑える 11.3)。
 */
export function addExploredPoint(
  points: readonly ExploredPoint[],
  newPoint: ExploredPoint,
  config: LandmarkDiscoveryConfig,
): ExploredPoint[] {
  const alreadyExplored = points.some(
    (point) =>
      calculateDistanceMeters(
        point.latitude,
        point.longitude,
        newPoint.latitude,
        newPoint.longitude,
      ) < config.exploredRadiusMeters,
  );

  if (alreadyExplored) return points as ExploredPoint[];

  return [...points, newPoint];
}
