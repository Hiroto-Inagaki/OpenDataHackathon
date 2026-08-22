import { useEffect, useState } from "react";

import { getLandmarkSpots } from "../lib/landmark/spotProvider";
import type { LandmarkSpot } from "../types";

interface UseLandmarkSpotsResult {
  spots: LandmarkSpot[];
  isLoading: boolean;
  error: string | null;
}

/**
 * FR-LD-10: スポットデータを取得できない場合でも、目的地への通常案内を継続できるよう、
 * 失敗時はエラーのみ保持し例外を投げない。呼び出し側は spots=[] として扱える。
 */
export function useLandmarkSpots(): UseLandmarkSpotsResult {
  const [spots, setSpots] = useState<LandmarkSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLandmarkSpots()
      .then((result) => {
        if (cancelled) return;
        setSpots(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("寄り道スポットの情報を取得できませんでした。");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { spots, isLoading, error };
}
