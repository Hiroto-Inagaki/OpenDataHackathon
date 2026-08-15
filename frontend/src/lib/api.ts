import { API_BASE_URL } from "./config";

export interface GeocodeResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export class GeocodeSearchError extends Error {}

/**
 * FR-01-01: 地点名または住所による目的地検索。
 * 14.4: 通信失敗時は例外を投げ、呼び出し側でエラー表示する。
 */
export async function searchDestinations(
  query: string,
): Promise<GeocodeResult[]> {
  const url = `${API_BASE_URL}/api/geocode?q=${encodeURIComponent(query)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new GeocodeSearchError("検索サービスに接続できませんでした。");
  }

  if (!response.ok) {
    throw new GeocodeSearchError("検索中にエラーが発生しました。");
  }

  const data = (await response.json()) as { results: GeocodeResult[] };
  return data.results;
}
