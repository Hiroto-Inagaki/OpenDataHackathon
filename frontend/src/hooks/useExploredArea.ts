import { useEffect, useState } from "react";

import { addExploredPoint } from "../lib/landmark/fog";
import type { ExploredPoint } from "../lib/landmark/fog";
import { isAccuracyAcceptable } from "../lib/landmark/proximity";
import type { CurrentPosition, LandmarkDiscoveryConfig } from "../types";

/**
 * FR-LD-02の「霧・踏破」責務。位置監視の購読自体は行わず、既存の位置情報(position)を
 * 受け取るだけにすることで、画面切り替えのたびに購読を重複作成しない(10.3)。
 */
export function useExploredArea(
  position: CurrentPosition | null,
  config: LandmarkDiscoveryConfig,
): ExploredPoint[] {
  const [exploredPoints, setExploredPoints] = useState<ExploredPoint[]>([]);

  useEffect(() => {
    if (!position) return;

    // FR-LD-02: 位置精度が許容範囲外の場合、踏破範囲を更新しない。
    if (!isAccuracyAcceptable(position.accuracy, config)) return;

    setExploredPoints((current) =>
      addExploredPoint(
        current,
        { latitude: position.latitude, longitude: position.longitude },
        config,
      ),
    );
  }, [position, config]);

  return exploredPoints;
}
