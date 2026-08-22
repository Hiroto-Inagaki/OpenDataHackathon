import { calculateDistanceMeters } from "../geo";
import type {
  CurrentPosition,
  LandmarkDiscoveryConfig,
  LandmarkHint,
  LandmarkSpot,
} from "../../types";

/**
 * FR-LD-03「表示対象を選ぶ規則は、距離だけに固定せず交換可能にする」に対応する型。
 * 距離以外の規則(カテゴリ優先、時間帯等)を将来追加する場合、この関数を差し替えるだけでよい。
 */
export type HintSelectionRule = (
  spots: LandmarkSpot[],
  position: CurrentPosition,
  config: LandmarkDiscoveryConfig,
) => LandmarkSpot[];

/** 初期実装の規則: 現在地から検出半径内のスポットをすべて候補にする。 */
export const distanceBasedHintRule: HintSelectionRule = (
  spots,
  position,
  config,
) =>
  spots.filter(
    (spot) =>
      calculateDistanceMeters(
        position.latitude,
        position.longitude,
        spot.actualLocation.latitude,
        spot.actualLocation.longitude,
      ) <= config.hintDetectionRadiusMeters,
  );

/**
 * 発見前の気配表示データを生成する。discoveryContentを含めないことで、
 * FR-LD-03「発見前の表示から、少なくとも名称と説明文を取得できないようにする」を満たす。
 *
 * OQ-LD-09(発見前にカテゴリを見せるか)は未決事項のため、categoryHintは暫定的に付与するが、
 * 呼び出し側(UI)が使うかどうかを選べるよう任意項目のままにしている。
 */
export function selectLandmarkHints(
  spots: LandmarkSpot[],
  position: CurrentPosition | null,
  config: LandmarkDiscoveryConfig,
  excludeSpotIds: ReadonlySet<string> = new Set(),
  rule: HintSelectionRule = distanceBasedHintRule,
): LandmarkHint[] {
  if (!position) return [];

  const candidates = spots.filter((spot) => !excludeSpotIds.has(spot.id));

  return rule(candidates, position, config).map((spot) => ({
    spotId: spot.id,
    // OQ-LD-03/09が未決のため、初期実装では実座標をそのまま表示用に流用する。
    // UI側はLandmarkSpot.actualLocationを直接参照せず、必ずこのdisplayLocation経由で
    // 座標を得る構造にすることで、後から座標をぼかす方式に変更しても呼び出し側は無変更で済む。
    displayLocation: { ...spot.actualLocation },
    categoryHint: spot.category,
  }));
}
