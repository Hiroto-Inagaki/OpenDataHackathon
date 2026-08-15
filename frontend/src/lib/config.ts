// バックエンド(Hono + Cloudflare Workers)のベースURL。
// `wrangler dev`のデフォルトポートは8787。デプロイ先が変わる場合はEXPO_PUBLIC_API_BASE_URLで上書きする。
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

// FR-03-06: 位置精度の閾値（メートル）。これを超える精度の位置情報は算出対象から除外する。
export const LOCATION_ACCURACY_THRESHOLD_METERS = 50;

// FR-03-05 / 9.2: 位置情報の取得間隔・移動距離トリガー。
export const LOCATION_UPDATE_INTERVAL_MS = 3000;
export const LOCATION_UPDATE_DISTANCE_METERS = 5;
