/**
 * GET /api/geocode の共通契約。
 * frontend/backend で同一の形にする（自動importはせず、変更時は両方を追従させる）。
 */

export interface GeocodeResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
}

export interface GeocodeErrorResponse {
  error: string;
}
