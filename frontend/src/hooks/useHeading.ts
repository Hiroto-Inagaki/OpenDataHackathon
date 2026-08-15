import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

import { safeRemove } from "../lib/subscription";

interface UseHeadingResult {
  /** 端末の向き（真北基準、0-360°）。センサー利用不能な場合はnull。 */
  headingDegrees: number | null;
  isAvailable: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * FR-03-04 / 10章: 端末の方位センサーを利用して向きを取得する。
 * 利用できない場合(isAvailable=false)は呼び出し側が地理的な北基準の表示にフォールバックする。
 */
export function useHeading(): UseHeadingResult {
  const [headingDegrees, setHeadingDegrees] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    // expo-locationの方位センサーAPIはWebでは未対応のため、代替表示に委ねる。
    if (Platform.OS === "web") {
      setIsAvailable(false);
      return;
    }

    try {
      subscriptionRef.current = await Location.watchHeadingAsync((heading) => {
        const value =
          heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;

        if (value >= 0) {
          setHeadingDegrees(value);
          setIsAvailable(true);
        }
      });
    } catch {
      setIsAvailable(false);
    }
  }, []);

  const stop = useCallback(() => {
    safeRemove(subscriptionRef.current);
    subscriptionRef.current = null;
    setIsAvailable(false);
    setHeadingDegrees(null);
  }, []);

  useEffect(() => {
    return () => {
      safeRemove(subscriptionRef.current);
    };
  }, []);

  return { headingDegrees, isAvailable, start, stop };
}
