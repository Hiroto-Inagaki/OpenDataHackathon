import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import {
  LOCATION_ACCURACY_THRESHOLD_METERS,
  LOCATION_UPDATE_DISTANCE_METERS,
  LOCATION_UPDATE_INTERVAL_MS,
} from "../lib/config";
import { safeRemove } from "../lib/subscription";
import type { CurrentPosition } from "../types";

export type LocationPermissionState =
  | "unrequested"
  | "granted"
  | "denied";

interface UseCurrentLocationResult {
  permissionState: LocationPermissionState;
  position: CurrentPosition | null;
  /** 最後に有効な位置情報を取得できた時刻。位置が更新されていないことの表示(14.2)に使う。 */
  lastFixAt: number | null;
  /** 監視は開始されているが、直近の更新が来ていない状態。 */
  isWaitingForFix: boolean;
  error: string | null;
  /**
   * FR-02-01: 位置情報の利用権限を確認し、現在地取得を開始する。
   * 権限が拒否された場合はfalseを返す。
   */
  requestAndStart: () => Promise<boolean>;
  stop: () => void;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [permissionState, setPermissionState] =
    useState<LocationPermissionState>("unrequested");
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [lastFixAt, setLastFixAt] = useState<number | null>(null);
  const [isWaitingForFix, setIsWaitingForFix] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStaleTimer = () => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
  };

  // 9.3: 更新が一定時間来ない場合は「更新されていない」状態を表示する。
  const armStaleTimer = useCallback(() => {
    clearStaleTimer();
    staleTimerRef.current = setTimeout(() => {
      setIsWaitingForFix(true);
    }, LOCATION_UPDATE_INTERVAL_MS * 3);
  }, []);

  const handleLocationUpdate = useCallback(
    (location: Location.LocationObject) => {
      const accuracy = location.coords.accuracy ?? null;

      // FR-03-06: 精度が閾値を超える場合は算出対象から除外し、直前の結果を保持する。
      if (accuracy !== null && accuracy > LOCATION_ACCURACY_THRESHOLD_METERS) {
        armStaleTimer();
        return;
      }

      setPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy,
        timestamp: location.timestamp,
      });
      setLastFixAt(Date.now());
      setIsWaitingForFix(false);
      setError(null);
      armStaleTimer();
    },
    [armStaleTimer],
  );

  const requestAndStart = useCallback(async () => {
    setError(null);

    // 複数回呼び出されても購読が重複しないようにする
    // (例: 目的地選択画面での自動取得後に散歩開始フローからも呼ばれる場合)。
    safeRemove(subscriptionRef.current);
    subscriptionRef.current = null;
    clearStaleTimer();

    let permission: Location.LocationPermissionResponse;
    try {
      permission = await Location.requestForegroundPermissionsAsync();
    } catch {
      setError("位置情報の権限確認に失敗しました。");
      return false;
    }

    if (permission.status !== "granted") {
      setPermissionState("denied");
      return false;
    }

    setPermissionState("granted");

    try {
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      handleLocationUpdate(initial);
    } catch {
      // 14.2: 初回取得に失敗してもアプリは継続し、監視によるリトライに委ねる。
      setError("現在地を取得できませんでした。取得を試み続けます。");
      armStaleTimer();
    }

    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL_MS,
          distanceInterval: LOCATION_UPDATE_DISTANCE_METERS,
        },
        handleLocationUpdate,
      );
    } catch {
      setError("位置情報の監視を開始できませんでした。");
      return false;
    }

    return true;
  }, [armStaleTimer, handleLocationUpdate]);

  const stop = useCallback(() => {
    safeRemove(subscriptionRef.current);
    subscriptionRef.current = null;
    clearStaleTimer();
    setIsWaitingForFix(false);
  }, []);

  useEffect(() => {
    return () => {
      safeRemove(subscriptionRef.current);
      clearStaleTimer();
    };
  }, []);

  return {
    permissionState,
    position,
    lastFixAt,
    isWaitingForFix,
    error,
    requestAndStart,
    stop,
  };
}
