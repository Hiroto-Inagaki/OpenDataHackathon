import { SAMPLE_LANDMARK_SPOTS } from "../../data/landmarkSpots";
import type { LandmarkSpot } from "../../types";

/**
 * 10.1「スポット供給」の責務: データ取得・キャッシュ・出典情報をUIから分離する。
 * 現在は同梱のサンプルデータを返すのみだが、Promiseを返す形にしておくことで
 * 将来APIやローカルDBへ差し替えてもコンパス・マップ側の変更は不要にする(10.2)。
 */
export async function getLandmarkSpots(): Promise<LandmarkSpot[]> {
  return SAMPLE_LANDMARK_SPOTS;
}
