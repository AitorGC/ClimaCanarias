/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

export type WeatherCondition = 'sunny' | 'rainy' | 'cloudy' | 'windy' | 'storm' | 'snowy' | 'foggy';

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'moderate' | 'severe' | 'extreme';
  time: string;
  sender: string;
}

export interface AemetAlert {
  nivel: 'Verde' | 'Amarillo' | 'Naranja' | 'Rojo';
  duracion: string;
  texto: string;
  icono: string; // 💨, 🌊, 🌋
}

export interface HourlySlot6h {
  hora: string;
  temp: number;
  sensacion: number;
  vientoVel: number;
  vientoDir: string; // e.g. "Nordeste", "Norte"
  humedad: number;
  precipProb: number;
  calima: 'Bajo' | 'Moderado' | 'Alto';
  visibilidad: number; // km
}

export interface DailyForecast3d {
  fecha: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  uvMax: number;
}

export interface AirQuality {
  usAqi: number;
  europeanAqi: number;
  pm2_5: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  co: number;
}

export interface MarineData {
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
}

export interface TideData {
  station: string;
  mareas: {
    tipo: 'pleamar' | 'bajamar';
    hora: string;
    altura: string;
  }[];
  curve?: { time: string; height: number }[];
}

export interface BeachInfo {
  estadoBandera: string;
  socorrismoActivo: boolean;
  proveedor: string;
  horario: string;
  peligros: string;
}

export interface AemetStation {
  id: string;
  nombre: string;
  temp: number;
  viento: number;
  precipitacion: number;
  hr: number;
}

export interface CurrentWeather {
  temp: number;
  tempMax: number;
  tempMin: number;
  condition: WeatherCondition;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  alerts: WeatherAlert[];
  time: string;
  hourly: { time: string; temp: number; condition: WeatherCondition; precipProb?: number; humidity?: number; }[];
  daily: ForecastDay[];
  
  // Specialized Canary Islands consensus fields
  fraseGeneral?: string;
  indiceConfianza?: number;
  alertasAemet?: AemetAlert[];
  hourly6h?: HourlySlot6h[];
  daily3d?: DailyForecast3d[];
  aqi?: AirQuality;
  marine?: MarineData;
  tides?: TideData;
  beachInfo?: BeachInfo;
  aemetStations?: AemetStation[];
}

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: WeatherCondition;
  pop: number; // Probability of precipitation percentage (0 to 100)
}

export interface StormCell {
  id: string;
  lat: number;
  lon: number;
  intensity: number; // 0 (light) to 1 (heavy)
  radius: number; // size in map pixels or degrees
  motionX: number; // velocity direction X
  motionY: number; // velocity direction Y
}

export interface UserPreference {
  ownerId: string;
  cities: City[];
  notificationsEnabled: boolean;
  tempUnit: 'C' | 'F';
  darkModeSetting: 'auto' | 'dark' | 'light';
  updatedAt: any; // Firestore Timestamp
}

export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'storm' | 'info';
  timestamp: string;
  read: boolean;
}
