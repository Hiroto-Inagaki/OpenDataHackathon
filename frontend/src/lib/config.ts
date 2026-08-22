import type { LandmarkDiscoveryConfig } from "../types";

// バックエンド(Hono + Cloudflare Workers)のベースURL。
// `wrangler dev`のデフォルトポートは8787。デプロイ先が変わる場合はEXPO_PUBLIC_API_BASE_URLで上書きする。
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

// FR-03-06: 位置精度の閾値（メートル）。これを超える精度の位置情報は算出対象から除外する。
export const LOCATION_ACCURACY_THRESHOLD_METERS = 50;

// FR-03-05 / 9.2: 位置情報の取得間隔・移動距離トリガー。
export const LOCATION_UPDATE_INTERVAL_MS = 3000;
export const LOCATION_UPDATE_DISTANCE_METERS = 5;

// 寄り道ランドマーク探索機能(docs/requirements_landmark_discovery.md 9.4)の設定値。
// 16章「実装開始前に必要な決定」の暫定値であり、ユーザー検証または共同開発者との
// 合意後に見直す(14章 OQ-LD-02)。ここ一か所にのみ数値を持ち、UIへ直書きしない。
export const LANDMARK_DISCOVERY_CONFIG: LandmarkDiscoveryConfig = {
  // 気配「？」マーカーを表示し始める、現在地からの距離(FR-LD-03)。
  hintDetectionRadiusMeters: 400,
  // 「？」ボタンを有効化する接近半径(FR-LD-06)。
  discoveryRadiusMeters: 30,
  // 接近判定・霧の踏破更新で受け入れる位置精度の上限(FR-LD-02, FR-LD-06)。
  // 既存の目的地案内の閾値(LOCATION_ACCURACY_THRESHOLD_METERS)と揃える。
  maxAcceptedAccuracyMeters: LOCATION_ACCURACY_THRESHOLD_METERS,
  // 探索マップの霧を晴らす(踏破済みとする)半径(FR-LD-02)。
  exploredRadiusMeters: 40,
};
