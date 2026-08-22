import type { LandmarkDiscoveryRecord } from "../../types";

let recordSequence = 0;

/**
 * 10.1「発見保存」の責務。「？」ボタンの利用者操作からのみ呼び出す(8.2の不変条件)。
 * 重複作成の防止は呼び出し側(useDetour)が寄り道セッション単位で判定する。
 */
export function createDiscoveryRecord(
  spotId: string,
  walkSessionId: string,
): LandmarkDiscoveryRecord {
  recordSequence += 1;
  return {
    id: `discovery-${Date.now()}-${recordSequence}`,
    spotId,
    walkSessionId,
    discoveredAt: Date.now(),
  };
}
