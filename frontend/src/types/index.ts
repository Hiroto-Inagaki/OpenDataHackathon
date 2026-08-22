// 要件定義書 7章のデータ要件に対応する型定義。

export interface Destination {
  destinationId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export type WalkStatus = "not_started" | "in_progress" | "finished";

export interface CurrentPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface WalkSession {
  status: WalkStatus;
  startedAt: number | null;
  currentPosition: CurrentPosition | null;
  distanceToDestination: number | null;
  bearingToDestination: number | null;
}

export type CompassDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

// 寄り道ランドマーク探索機能(docs/requirements_landmark_discovery.md) の型定義。

/** 8.1: 散歩中の表示モード。目的地/寄り道の選択状態(寄り道状態)とは独立して管理する。 */
export type GuidanceMode = "compass" | "exploration-map";

/** 8.1: 方角モード内でどちらのコンパスを表示しているか。 */
export type CompassTarget = "destination" | "detour";

export interface GuidanceState {
  mode: GuidanceMode;
  activeCompassTarget: CompassTarget;
}

/** 8.1: 一度に進行できる寄り道は一件(FR-LD-04)。 */
export type DetourState =
  | { status: "inactive" }
  | {
      status: "active";
      spotId: string;
      startedAt: number;
      discoveryAvailable: boolean;
    };

/** 9.1: 寄り道スポット。実座標と発見前後の情報を明確に分離する。 */
export interface LandmarkSpot {
  id: string;
  category: string;
  actualLocation: {
    latitude: number;
    longitude: number;
  };
  discoveryContent: LandmarkDiscoveryContent;
  source: LandmarkSource;
}

/** 発見後にのみ渡してよい情報。発見前の画面には渡さない(9.1)。 */
export interface LandmarkDiscoveryContent {
  name: string;
  summary?: string;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

/** 11.5: オープンデータの出典管理に必要な項目。 */
export interface LandmarkSource {
  datasetName: string;
  publisher: string;
  sourceUrl: string;
  license: string;
  attribution?: string;
}

/**
 * 9.2: 発見前の気配表示用データ。discoveryContentを含まないことで、
 * 発見前に名称・説明文が漏れない境界(FR-LD-03)を型レベルで維持する。
 */
export interface LandmarkHint {
  spotId: string;
  displayLocation?: {
    latitude: number;
    longitude: number;
  };
  categoryHint?: string;
  /** 発見済みかどうか。マップ表示の記号を切り替える用途で、発見前後の情報境界には影響しない。 */
  discovered: boolean;
}

/** 9.3: 発見記録。「？」ボタンの利用者操作によってのみ作成する(8.2)。 */
export interface LandmarkDiscoveryRecord {
  id: string;
  spotId: string;
  walkSessionId: string;
  discoveredAt: number;
}

/** 9.4: UIコンポーネントへ直書きしない設定値。実装開始前に必要な暫定値(16章)。 */
export interface LandmarkDiscoveryConfig {
  hintDetectionRadiusMeters: number;
  discoveryRadiusMeters: number;
  maxAcceptedAccuracyMeters: number;
  exploredRadiusMeters: number;
}
