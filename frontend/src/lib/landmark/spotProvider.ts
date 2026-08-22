import { CULTURAL_PROPERTY_SPOTS } from "../../data/culturalPropertySpots";
import { HISTORIC_SITE_SPOTS } from "../../data/historicSiteSpots";
import type { LandmarkSpot } from "../../types";

/**
 * 10.1「スポット供給」の責務: データ取得・キャッシュ・出典情報をUIから分離する。
 * 16章1「初期実装で利用するランドマークデータセット」の決定: 東京都オープンデータカタログ
 * サイト「文化財一覧」の2リソース(建造物等: data/culturalPropertySpots.ts、
 * 史跡: data/historicSiteSpots.ts。生成元はdata/Tokyo_cultural_property_list.csvと
 * data/Tokyo_historic_sites_list.csv)を統合して利用する。データセットを追加・差し替える際は
 * この関数の中身だけを変更すればよく、Promiseを返す形にしておくことで、将来APIやローカルDBへ
 * 差し替えてもコンパス・マップ側の変更は不要にする(10.2)。
 */
export async function getLandmarkSpots(): Promise<LandmarkSpot[]> {
  return [...CULTURAL_PROPERTY_SPOTS, ...HISTORIC_SITE_SPOTS];
}
