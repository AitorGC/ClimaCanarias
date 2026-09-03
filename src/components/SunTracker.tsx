/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sunrise, Sunset, Sun, Moon, Compass, Clock, Sparkles, MapPin } from 'lucide-react';
import { City, SunData } from '../types';
import { calculateSunTimes } from '../solarService';

interface SunTrackerProps {
  city: City;
  sunData?: SunData;
  activeDarkMode: boolean;
  compact?: boolean;
}

export default function SunTracker({ city, sunData: providedSunData, activeDarkMode, compact = false }: SunTrackerProps) {
  // Ensure we always have exact sun data for current city coordinates
  const sunData = useMemo(() => {
    if (providedSunData) return providedSunData;
    return calculateSunTimes(city.lat, city.lon, new Date());
  }, [city.lat, city.lon, providedSunData]);

  // Format coordinates for display (e.g., 28.12° N, 15.44° W)
  const latFormatted = `${Math.abs(city.lat).toFixed(2)}° ${city.lat >= 0 ? 'N' : 'S'}`;
  const lonFormatted = `${Math.abs(city.lon).toFixed(2)}° ${city.lon >= 0 ? 'E' : 'O'}`;

  // Solar Arc Calculations for SVG
  // The arc goes from (30, 110) to (290, 110) with apex at (160, 20)
  // Parametric ellipse arc: x in [30, 290], y follows sinusoidal arc
  const progressRatio = Math.max(0, Math.min(1, sunData.dayProgressPercent / 100));
  
  // Angle along the arc: 0 (sunrise) to PI (sunset)
  const sunAngle = progressRatio * Math.PI;
  const arcRadiusX = 130;
  const arcRadiusY = 85;
  const centerX = 160;
  const centerY = 115;
  
  // Sun position on the arc
  const sunX = centerX - arcRadiusX * Math.cos(sunAngle);
  const sunY = centerY - arcRadiusY * Math.sin(sunAngle);

  if (compact) {
    return (
      <div id="sun-tracker-compact" className={`rounded-2xl p-4 border transition-all ${
        activeDarkMode 
          ? 'bg-white/5 border-white/10 text-white' 
          : 'bg-white/90 border-amber-200/80 text-slate-900 shadow-2xs'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${
              activeDarkMode ? 'bg-[#ffd600]/20 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
            }`}>
              <Sun className="w-3.5 h-3.5" />
            </div>
            <span className={`text-xs font-bold tracking-wide font-display ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Ciclo Solar
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            activeDarkMode ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {latFormatted}, {lonFormatted}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sunrise className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[9px] block font-mono font-semibold uppercase ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                AMANECER
              </span>
              <span className={`text-sm font-bold font-mono ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {sunData.sunrise}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Sunset className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[9px] block font-mono font-semibold uppercase ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                PUESTA DE SOL
              </span>
              <span className={`text-sm font-bold font-mono ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {sunData.sunset}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t flex justify-between items-center text-[10px] font-mono border-dashed border-amber-200/50 dark:border-white/10">
          <span className={activeDarkMode ? 'text-white/50' : 'text-slate-500'}>
            Luz solar: {sunData.dayLength}
          </span>
          <span className={`font-semibold ${activeDarkMode ? 'text-[#ffd600]' : 'text-amber-700'}`}>
            {sunData.timeUntilNextEvent}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div id="sun-tracker-section" className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md transition-all duration-300 md-card relative overflow-hidden ${
      activeDarkMode 
        ? 'bg-[#1b2025] border-white/10 text-[#e8e5d8]' 
        : 'bg-[#fffef7] border-amber-200/70 text-[#1c1c18] shadow-lg shadow-amber-500/5'
    }`}>
      {/* Subtle Background Glow */}
      <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
        activeDarkMode ? 'bg-[#ffd600]/10' : 'bg-amber-300/20'
      }`} />

      {/* Header */}
      <div className={`flex flex-wrap justify-between items-center gap-2 border-b pb-3 mb-4 ${
        activeDarkMode ? 'border-white/10' : 'border-amber-200/80'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-2xl ${
            activeDarkMode ? 'bg-[#ffd600]/20 text-[#ffd600]' : 'bg-[#f5cf00]/30 text-slate-900'
          }`}>
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-display font-bold text-base flex items-center gap-2 ${
              activeDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Amanecer y Puesta de Sol
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                sunData.isDaytime 
                  ? activeDarkMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900'
                  : activeDarkMode ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                {sunData.isDaytime ? 'DÍA SOLAR' : 'NOCHE'}
              </span>
            </h3>
            <p className={`text-[11px] font-mono mt-0.5 flex items-center gap-1.5 ${
              activeDarkMode ? 'text-white/50' : 'text-slate-500'
            }`}>
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>{city.name}</span>
              <span>•</span>
              <span>{latFormatted}, {lonFormatted}</span>
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border ${
          activeDarkMode 
            ? 'bg-white/5 border-white/10 text-white/80' 
            : 'bg-white border-amber-200 text-slate-700 shadow-2xs'
        }`}>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{sunData.timeUntilNextEvent}</span>
        </div>
      </div>

      {/* Main Solar Arc Graphic & Times Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-2">
        {/* Sunrise Time Card */}
        <div className="md:col-span-3 flex md:flex-col justify-between items-center md:items-start p-4 rounded-2xl border transition-all ${
          activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-200/80 shadow-2xs'
        }">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-500">
              <Sunrise className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[10px] block font-mono font-semibold tracking-wider uppercase ${
                activeDarkMode ? 'text-white/50' : 'text-slate-500'
              }`}>
                AMANECER
              </span>
              <span className={`text-2xl md:text-3xl font-display font-bold ${
                activeDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {sunData.sunrise}
              </span>
            </div>
          </div>
          {sunData.dawn && (
            <div className={`mt-2 pt-2 border-t w-full text-[10px] font-mono flex justify-between ${
              activeDarkMode ? 'border-white/5 text-white/40' : 'border-slate-100 text-slate-400'
            }`}>
              <span>Crepúsculo (Alba):</span>
              <span className="font-semibold">{sunData.dawn}</span>
            </div>
          )}
        </div>

        {/* Center Visual: Solar Arc */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative py-2">
          <div className="w-full max-w-[320px] relative">
            <svg viewBox="0 0 320 135" className="w-full h-auto overflow-visible">
              <defs>
                {/* Arc gradient for daylight trajectory */}
                <linearGradient id="solarArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ffd600" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
                </linearGradient>

                {/* Sky daylight fill below arc */}
                <linearGradient id="solarSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffd600" stopOpacity={activeDarkMode ? "0.15" : "0.22"} />
                  <stop offset="100%" stopColor="#ffd600" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Sky area fill below trajectory */}
              <path
                d="M 30 115 Q 160 -10 290 115 Z"
                fill="url(#solarSkyGrad)"
              />

              {/* Horizon dashed line */}
              <line
                x1="15"
                y1="115"
                x2="305"
                y2="115"
                stroke={activeDarkMode ? "rgba(255,255,255,0.2)" : "rgba(100,116,139,0.3)"}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Horizon label */}
              <text
                x="160"
                y="128"
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fill={activeDarkMode ? "rgba(255,255,255,0.4)" : "rgba(100,116,139,0.7)"}
              >
                HORIZONTE LOCAL ({city.name})
              </text>

              {/* Inactive Arc Base Path */}
              <path
                d="M 30 115 Q 160 -10 290 115"
                fill="none"
                stroke={activeDarkMode ? "rgba(255,255,255,0.15)" : "rgba(203,213,225,0.8)"}
                strokeWidth="3"
                strokeDasharray="5 5"
              />

              {/* Active Solar Arc Path */}
              <path
                d="M 30 115 Q 160 -10 290 115"
                fill="none"
                stroke="url(#solarArcGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Solar Noon Marker at apex (160, 22) */}
              <circle
                cx="160"
                cy="22"
                r="3"
                fill={activeDarkMode ? "#ffd600" : "#d97706"}
              />
              <text
                x="160"
                y="12"
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                fill={activeDarkMode ? "rgba(255,214,0,0.9)" : "rgba(180,83,9,0.9)"}
              >
                CÉNIT {sunData.solarNoon}
              </text>

              {/* Animated Sun or Moon Indicator positioned on Arc */}
              {sunData.isDaytime ? (
                <g transform={`translate(${sunX}, ${sunY})`}>
                  {/* Sun Glow Outer Ring */}
                  <circle
                    r="14"
                    fill="#ffd600"
                    fillOpacity="0.25"
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                  {/* Sun Corona */}
                  <circle
                    r="9"
                    fill="url(#solarArcGrad)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 0 6px rgba(251,191,36,0.9))"
                  />
                  {/* Sun Icon */}
                  <circle r="4" fill="#ffffff" />
                </g>
              ) : (
                /* Night / Moon Indicator below/at horizon */
                <g transform="translate(160, 115)">
                  <circle
                    r="10"
                    fill={activeDarkMode ? "#6366f1" : "#3b82f6"}
                    fillOpacity="0.2"
                  />
                  <circle
                    r="6"
                    fill={activeDarkMode ? "#818cf8" : "#2563eb"}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Progress Bar / Percent */}
          <div className="w-full max-w-[280px] mt-1 flex items-center justify-between text-[10px] font-mono">
            <span className={activeDarkMode ? 'text-white/45' : 'text-slate-500'}>
              0% (Salida)
            </span>
            <span className={`font-bold ${activeDarkMode ? 'text-[#ffd600]' : 'text-amber-800'}`}>
              Progreso: {sunData.dayProgressPercent}%
            </span>
            <span className={activeDarkMode ? 'text-white/45' : 'text-slate-500'}>
              100% (Puesta)
            </span>
          </div>
        </div>

        {/* Sunset Time Card */}
        <div className="md:col-span-3 flex md:flex-col justify-between items-center md:items-start p-4 rounded-2xl border transition-all ${
          activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-200/80 shadow-2xs'
        }">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/15 text-orange-500">
              <Sunset className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[10px] block font-mono font-semibold tracking-wider uppercase ${
                activeDarkMode ? 'text-white/50' : 'text-slate-500'
              }`}>
                PUESTA DE SOL
              </span>
              <span className={`text-2xl md:text-3xl font-display font-bold ${
                activeDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {sunData.sunset}
              </span>
            </div>
          </div>
          {sunData.dusk && (
            <div className={`mt-2 pt-2 border-t w-full text-[10px] font-mono flex justify-between ${
              activeDarkMode ? 'border-white/5 text-white/40' : 'border-slate-100 text-slate-400'
            }`}>
              <span>Crepúsculo (Anochecer):</span>
              <span className="font-semibold">{sunData.dusk}</span>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Solar Metrics Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t ${
        activeDarkMode ? 'border-white/10' : 'border-amber-200/80'
      }`}>
        {/* Daylight Duration */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
          activeDarkMode ? 'bg-[#14171a] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div className={`p-2 rounded-xl ${
            activeDarkMode ? 'bg-[#ffd600]/15 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
          }`}>
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[9px] block font-mono font-semibold uppercase ${activeDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
              DURACIÓN DÍA
            </span>
            <span className={`text-xs md:text-sm font-bold font-mono block ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {sunData.dayLength}
            </span>
          </div>
        </div>

        {/* Solar Noon */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
          activeDarkMode ? 'bg-[#14171a] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div className={`p-2 rounded-xl ${
            activeDarkMode ? 'bg-[#ffd600]/15 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
          }`}>
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[9px] block font-mono font-semibold uppercase ${activeDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
              MEDIODÍA SOLAR
            </span>
            <span className={`text-xs md:text-sm font-bold font-mono block ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {sunData.solarNoon}
            </span>
          </div>
        </div>

        {/* Sun Altitude / Elevation Angle */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
          activeDarkMode ? 'bg-[#14171a] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div className={`p-2 rounded-xl ${
            activeDarkMode ? 'bg-[#ffd600]/15 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[9px] block font-mono font-semibold uppercase ${activeDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
              ELEVACIÓN SOLAR
            </span>
            <span className={`text-xs md:text-sm font-bold font-mono block ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {sunData.sunAltitude !== undefined ? `${sunData.sunAltitude}°` : '--'}
            </span>
          </div>
        </div>

        {/* Golden Hour Window */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
          activeDarkMode ? 'bg-[#14171a] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div className={`p-2 rounded-xl ${
            activeDarkMode ? 'bg-[#ffd600]/15 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[9px] block font-mono font-semibold uppercase ${activeDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
              HORA DORADA
            </span>
            <span className={`text-[11px] font-bold font-mono block leading-tight ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {sunData.goldenHourEvening || sunData.goldenHourMorning || '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
