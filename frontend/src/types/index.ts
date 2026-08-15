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
