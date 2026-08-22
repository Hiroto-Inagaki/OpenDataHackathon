import type { LandmarkDiscoveryConfig } from "../../types";

/** FR-LD-06: 位置精度が許容範囲外かどうか。許容範囲外では新たに接近判定を行わない。 */
export function isAccuracyAcceptable(
  accuracyMeters: number | null,
  config: LandmarkDiscoveryConfig,
): boolean {
  if (accuracyMeters === null) return true;
  return accuracyMeters <= config.maxAcceptedAccuracyMeters;
}

/** FR-LD-06: 現在地と対象スポットの実座標が発見可能半径内かどうか。 */
export function isWithinDiscoveryRadius(
  distanceMeters: number,
  config: LandmarkDiscoveryConfig,
): boolean {
  return distanceMeters <= config.discoveryRadiusMeters;
}

interface DiscoveryAvailabilityInput {
  previousAvailable: boolean;
  distanceMeters: number;
  accuracyMeters: number | null;
  config: LandmarkDiscoveryConfig;
}

/**
 * 「？」ボタンの有効化ポリシー。FR-LD-06 / 8.2「一度有効化したボタンを距離変動で
 * 再び無効化するかは判定ポリシーとして分離する」に対応し、独立した関数として切り出す。
 *
 * 初期実装の暫定ポリシー(OQ-LD-06関連、ユーザー検証まで暫定): 一度有効化したら、
 * GPSの揺れで一時的に半径外に出ても無効化しない(sticky)。位置精度が許容範囲外の間は
 * 「新たに」有効化しない(既存の有効状態はそのまま保持する)。
 * このポリシーだけを変更すれば、画面コンポーネントは変更せずに済む(10.2)。
 */
export function computeDiscoveryAvailability({
  previousAvailable,
  distanceMeters,
  accuracyMeters,
  config,
}: DiscoveryAvailabilityInput): boolean {
  if (previousAvailable) return true;

  if (!isAccuracyAcceptable(accuracyMeters, config)) {
    return false;
  }

  return isWithinDiscoveryRadius(distanceMeters, config);
}
