import type { LandmarkSpot } from "../types";

// TODO: 動作確認用のダミーデータ。検証が終わったらこのファイルとspotProvider.tsでの
// 参照を削除すること。実データではないため、出典情報もテスト用のダミー値としている。
export const TEST_SPOTS: LandmarkSpot[] = [
  {
    id: "test-dummy-1",
    category: "テスト",
    actualLocation: {
      latitude: 35.68438288051971, longitude: 139.74173458238312
    },
    discoveryContent: {
      name: "ダミースポット",
      summary: "動作確認用のテストデータです。",
    },
    source: {
      datasetName: "テスト用ダミーデータ",
      publisher: "開発チーム（テスト用）",
      sourceUrl: "n/a（テストデータ）",
      license: "N/A（テストデータ）",
      attribution: "これは動作確認用のダミーデータであり、実データではありません。",
    },
  },
];
