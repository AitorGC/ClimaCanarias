import { storage } from './storage';

export type ApiCategory = 
  | 'AEMET_WARNINGS' 
  | 'AEMET_STATIONS' 
  | 'AEMET_OPENDATA' 
  | 'AEMET_RSS' 
  | 'OPEN_METEO_WEATHER' 
  | 'OPEN_METEO_AQI' 
  | 'OPEN_METEO_MARINE' 
  | 'GEOCODING' 
  | 'IHM_TIDES' 
  | 'INFOPLAYAS' 
  | 'MAPS_TILES' 
  | 'GOOGLE_DRIVE' 
  | 'OTHER';

export const TELEMETRY_COLORS: Record<ApiCategory, string> = {
  AEMET_WARNINGS: '#FFC107',
  AEMET_STATIONS: '#03A9F4',
  AEMET_OPENDATA: '#009688',
  AEMET_RSS: '#3F51B5',
  OPEN_METEO_WEATHER: '#E91E63',
  OPEN_METEO_AQI: '#9C27B0',
  OPEN_METEO_MARINE: '#4CAF50',
  GEOCODING: '#FF5722',
  IHM_TIDES: '#795548',
  INFOPLAYAS: '#607D8B',
  MAPS_TILES: '#00BCD4',
  GOOGLE_DRIVE: '#8BC34A',
  OTHER: '#9E9E9E'
};

const TELEMETRY_KEY = 'climacanarias_api_telemetry';

export async function getTelemetryData(): Promise<Record<string, number>> {
  return await storage.getItem<Record<string, number>>(TELEMETRY_KEY, {});
}

export async function trackApiCall(category: ApiCategory) {
  const data = await getTelemetryData();
  data[category] = (data[category] || 0) + 1;
  await storage.setItem(TELEMETRY_KEY, data);
}

/**
 * Fetch wrapper that tracks the endpoint category
 */
export async function trackedFetch(url: string, category: ApiCategory, options?: RequestInit): Promise<Response> {
  // Track before request or after request
  await trackApiCall(category);
  return fetch(url, options);
}
