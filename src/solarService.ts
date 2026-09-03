/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SunData } from './types';

/**
 * Helper to zero-pad single digit numbers
 */
function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates solar times using astronomical NOAA solar calculation equations
 * as well as integrating API-reported sunrise/sunset with sub-minute accuracy.
 */
export function calculateSunTimes(
  lat: number,
  lon: number,
  currentDate: Date = new Date(),
  apiSunriseIso?: string,
  apiSunsetIso?: string
): SunData {
  let sunriseDate: Date;
  let sunsetDate: Date;

  if (apiSunriseIso && apiSunsetIso) {
    sunriseDate = new Date(apiSunriseIso);
    sunsetDate = new Date(apiSunsetIso);
  } else {
    // Astronomical fallback calculation for any latitude and longitude
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Day of the year
    const N1 = Math.floor((275 * month) / 9);
    const N2 = Math.floor((month + 9) / 12);
    const N3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
    const N = N1 - N2 * N3 + day - 30;

    // Approximate time
    const lngHour = lon / 15;
    
    // Sunrise calculation
    const tRise = N + (6 - lngHour) / 24;
    const MRise = 0.9856 * tRise - 3.289;
    let LRise = MRise + 1.916 * Math.sin(toRadians(MRise)) + 0.02 * Math.sin(toRadians(2 * MRise)) + 282.634;
    LRise = (LRise + 360) % 360;

    let RARise = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(LRise))));
    RARise = (RARise + 360) % 360;
    const LquadrantRise = Math.floor(LRise / 90) * 90;
    const RAquadrantRise = Math.floor(RARise / 90) * 90;
    RARise = RARise + (LquadrantRise - RAquadrantRise);
    RARise = RARise / 15;

    const sinDecRise = 0.39782 * Math.sin(toRadians(LRise));
    const cosDecRise = Math.cos(Math.asin(sinDecRise));

    // Official zenith for sunrise/sunset is 90° 50' = 90.8333°
    const zenith = 90.8333;
    const cosHRise = (Math.cos(toRadians(zenith)) - sinDecRise * Math.sin(toRadians(lat))) / (cosDecRise * Math.cos(toRadians(lat)));

    let HRise = 0;
    if (cosHRise > 1) {
      HRise = 0; // Sun never rises
    } else if (cosHRise < -1) {
      HRise = 180; // Sun never sets
    } else {
      HRise = 360 - toDegrees(Math.acos(cosHRise));
    }
    const HhoursRise = HRise / 15;
    const TRise = HhoursRise + RARise - 0.06571 * tRise - 6.622;
    let UTRise = (TRise - lngHour + 24) % 24;

    // Sunset calculation
    const tSet = N + (18 - lngHour) / 24;
    const MSet = 0.9856 * tSet - 3.289;
    let LSet = MSet + 1.916 * Math.sin(toRadians(MSet)) + 0.02 * Math.sin(toRadians(2 * MSet)) + 282.634;
    LSet = (LSet + 360) % 360;

    let RASet = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(LSet))));
    RASet = (RASet + 360) % 360;
    const LquadrantSet = Math.floor(LSet / 90) * 90;
    const RAquadrantSet = Math.floor(RASet / 90) * 90;
    RASet = RASet + (LquadrantSet - RAquadrantSet);
    RASet = RASet / 15;

    const sinDecSet = 0.39782 * Math.sin(toRadians(LSet));
    const cosDecSet = Math.cos(Math.asin(sinDecSet));
    const cosHSet = (Math.cos(toRadians(zenith)) - sinDecSet * Math.sin(toRadians(lat))) / (cosDecSet * Math.cos(toRadians(lat)));

    let HSet = 0;
    if (cosHSet > 1) {
      HSet = 0;
    } else if (cosHSet < -1) {
      HSet = 180;
    } else {
      HSet = toDegrees(Math.acos(cosHSet));
    }
    const HhoursSet = HSet / 15;
    const TSet = HhoursSet + RASet - 0.06571 * tSet - 6.622;
    let UTSet = (TSet - lngHour + 24) % 24;

    // Convert UTC hours to local date object
    sunriseDate = new Date(Date.UTC(year, month - 1, day, Math.floor(UTRise), Math.floor((UTRise % 1) * 60)));
    sunsetDate = new Date(Date.UTC(year, month - 1, day, Math.floor(UTSet), Math.floor((UTSet % 1) * 60)));
  }

  // Format sunrise / sunset string in local 24h
  const sunriseStr = `${pad(sunriseDate.getHours())}:${pad(sunriseDate.getMinutes())}`;
  const sunsetStr = `${pad(sunsetDate.getHours())}:${pad(sunsetDate.getMinutes())}`;

  // Day length
  const dayLengthMs = Math.max(0, sunsetDate.getTime() - sunriseDate.getTime());
  const dayLengthTotalMinutes = Math.floor(dayLengthMs / 60000);
  const dayLengthHours = Math.floor(dayLengthTotalMinutes / 60);
  const dayLengthMinutes = dayLengthTotalMinutes % 60;
  const dayLengthStr = `${dayLengthHours}h ${pad(dayLengthMinutes)}m`;

  // Solar noon (halfway between sunrise and sunset)
  const solarNoonDate = new Date(sunriseDate.getTime() + dayLengthMs / 2);
  const solarNoonStr = `${pad(solarNoonDate.getHours())}:${pad(solarNoonDate.getMinutes())}`;

  // Dawn (Civil Twilight ~ 26 mins before sunrise) & Dusk (~ 26 mins after sunset)
  const dawnDate = new Date(sunriseDate.getTime() - 26 * 60000);
  const duskDate = new Date(sunsetDate.getTime() + 26 * 60000);
  const dawnStr = `${pad(dawnDate.getHours())}:${pad(dawnDate.getMinutes())}`;
  const duskStr = `${pad(duskDate.getHours())}:${pad(duskDate.getMinutes())}`;

  // Golden hour windows
  const goldenMorningEnd = new Date(sunriseDate.getTime() + 45 * 60000);
  const goldenEveningStart = new Date(sunsetDate.getTime() - 45 * 60000);
  const goldenHourMorning = `${sunriseStr} - ${pad(goldenMorningEnd.getHours())}:${pad(goldenMorningEnd.getMinutes())}`;
  const goldenHourEvening = `${pad(goldenEveningStart.getHours())}:${pad(goldenEveningStart.getMinutes())} - ${sunsetStr}`;

  // Current time progression
  const nowMs = currentDate.getTime();
  const sunriseMs = sunriseDate.getTime();
  const sunsetMs = sunsetDate.getTime();

  const isDaytime = nowMs >= sunriseMs && nowMs <= sunsetMs;

  let dayProgressPercent = 0;
  let timeUntilNextEvent = '';

  if (nowMs < sunriseMs) {
    // Before sunrise
    dayProgressPercent = 0;
    const diffMs = sunriseMs - nowMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMins / 60);
    const diffM = diffMins % 60;
    timeUntilNextEvent = `Amanece en ${diffH > 0 ? `${diffH}h ` : ''}${diffM}m`;
  } else if (nowMs <= sunsetMs) {
    // During daytime
    const elapsedMs = nowMs - sunriseMs;
    dayProgressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / dayLengthMs) * 100)));
    const diffMs = sunsetMs - nowMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMins / 60);
    const diffM = diffMins % 60;
    timeUntilNextEvent = `Puesta de sol en ${diffH > 0 ? `${diffH}h ` : ''}${diffM}m`;
  } else {
    // After sunset: next event is tomorrow's sunrise
    dayProgressPercent = 100;
    const tomorrowSunrise = new Date(sunriseDate.getTime() + 24 * 3600000);
    const diffMs = tomorrowSunrise.getTime() - nowMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMins / 60);
    const diffM = diffMins % 60;
    timeUntilNextEvent = `Próximo amanecer en ${diffH > 0 ? `${diffH}h ` : ''}${diffM}m`;
  }

  // Estimated Sun altitude angle in degrees (-90 to +90)
  // At solar noon altitude is approximately 90 - |lat - declination|
  let sunAltitude = 0;
  if (isDaytime) {
    // Sinusoidal arc peaking at solar noon
    const angleRad = ((nowMs - sunriseMs) / dayLengthMs) * Math.PI;
    const peakAltitude = Math.max(20, Math.min(88, 90 - Math.abs(lat - 15)));
    sunAltitude = Math.round(Math.sin(angleRad) * peakAltitude);
  } else {
    sunAltitude = -15; // Below horizon
  }

  return {
    sunrise: sunriseStr,
    sunset: sunsetStr,
    dawn: dawnStr,
    dusk: duskStr,
    solarNoon: solarNoonStr,
    dayLength: dayLengthStr,
    dayProgressPercent,
    isDaytime,
    sunAltitude,
    timeUntilNextEvent,
    goldenHourMorning,
    goldenHourEvening,
  };
}
