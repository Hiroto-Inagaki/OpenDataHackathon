import type { LandmarkSpot } from "../types";

// 16章「実装開始前に必要な決定」1: 初期実装で利用するランドマークデータセットは未決定。
// ここでは動作確認用の仮データ(東京駅周辺, DestinationMapの初期表示地点と同一エリア)を
// 直接埋め込む。本番データセットが決まるまでのプレースホルダーであり、
// lib/landmark/spotProvider.ts の取得元をこの配列から外部データソースへ差し替えれば
// UI・状態管理側は変更不要(10.1 スポット供給の責務分離)。
export const SAMPLE_LANDMARK_SPOTS: LandmarkSpot[] = [
  {
    id: "sample-01",
    category: "historic",
    actualLocation: { latitude: 35.682, longitude: 139.7665 },
    discoveryContent: {
      name: "旧赤レンガ倉庫跡（仮データ）",
      summary: "かつて物資の集積地として使われていたと伝わる一角。",
    },
    source: {
      datasetName: "サンプルランドマークデータ（仮）",
      publisher: "ハッカソン開発チーム",
      sourceUrl: "pending-dataset-decision",
      license: "CC0 1.0（プレースホルダー）",
      attribution: "本データは初期実装検証用の仮データです。本番データセットは未決事項です。",
    },
  },
  {
    id: "sample-02",
    category: "shop",
    actualLocation: { latitude: 35.6805, longitude: 139.768 },
    discoveryContent: {
      name: "老舗手ぬぐい店（仮データ）",
      summary: "三代続く染物を扱う小さな店構え。",
    },
    source: {
      datasetName: "サンプルランドマークデータ（仮）",
      publisher: "ハッカソン開発チーム",
      sourceUrl: "pending-dataset-decision",
      license: "CC0 1.0（プレースホルダー）",
      attribution: "本データは初期実装検証用の仮データです。本番データセットは未決事項です。",
    },
  },
  {
    id: "sample-03",
    category: "culture",
    actualLocation: { latitude: 35.6798, longitude: 139.766 },
    discoveryContent: {
      name: "路地裏の稲荷神社（仮データ）",
      summary: "住宅街の隙間に残る小さな祠。",
    },
    source: {
      datasetName: "サンプルランドマークデータ（仮）",
      publisher: "ハッカソン開発チーム",
      sourceUrl: "pending-dataset-decision",
      license: "CC0 1.0（プレースホルダー）",
      attribution: "本データは初期実装検証用の仮データです。本番データセットは未決事項です。",
    },
  },
  {
    id: "sample-04",
    category: "architecture",
    actualLocation: { latitude: 35.6825, longitude: 139.769 },
    discoveryContent: {
      name: "昭和レトロビル（仮データ）",
      summary: "タイル張りの外壁が残る小規模な雑居ビル。",
    },
    source: {
      datasetName: "サンプルランドマークデータ（仮）",
      publisher: "ハッカソン開発チーム",
      sourceUrl: "pending-dataset-decision",
      license: "CC0 1.0（プレースホルダー）",
      attribution: "本データは初期実装検証用の仮データです。本番データセットは未決事項です。",
    },
  },
];
