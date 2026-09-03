/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Wind, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { AirQuality } from '../types';

interface AirQualityIndicatorProps {
  aqi?: AirQuality;
  calimaRating?: 'Bajo' | 'Moderado' | 'Alto';
  activeDarkMode: boolean;
}

export default function AirQualityIndicator({ aqi, calimaRating = 'Bajo', activeDarkMode }: AirQualityIndicatorProps) {
  // Key particle metrics fallback
  const metrics = useMemo(() => {
    return aqi ?? {
      usAqi: 28,
      europeanAqi: 22,
      pm2_5: 7.2,
      pm10: 14.5,
      no2: 3.5,
      so2: 0.5,
      o3: 35.0,
      co: 180.0
    };
  }, [aqi]);

  // Determine concise European Air Quality category and specific recommendation
  const icaStatus = useMemo(() => {
    const pm10 = metrics.pm10;
    const pm25 = metrics.pm2_5;
    const isCalimaAlert = calimaRating === 'Alto' || pm10 > 50;

    if (isCalimaAlert || pm10 > 100 || pm25 > 50) {
      return {
        level: isCalimaAlert ? 'Desfavorable (Calima)' : 'Desfavorable',
        badgeColor: 'bg-red-500/15 border-red-500/30 text-red-500',
        dotColor: 'bg-red-500',
        recommendation: 'Polvo sahariano en suspensión elevado. Grupos de riesgo y personas sensibles deben evitar actividades físicas al aire libre y mantener ventanas cerradas.',
      };
    }
    if (pm10 > 40 || pm25 > 20 || calimaRating === 'Moderado') {
      return {
        level: calimaRating === 'Moderado' ? 'Moderada (Calima Ligera)' : 'Aceptable',
        badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-600',
        dotColor: 'bg-amber-500',
        recommendation: 'Calidad del aire aceptable. Personas con sensibilidad respiratoria deben moderar esfuerzos intensos prolongados en el exterior.',
      };
    }
    return {
      level: 'Buena / Limpia',
      badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500',
      dotColor: 'bg-emerald-500',
      recommendation: 'Condiciones atmosféricas óptimas. Excelente para practicar deporte y disfrutar al aire libre.',
    };
  }, [metrics, calimaRating]);

  return (
    <div id="air-quality-somero-widget" className="flex flex-col items-stretch w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
          activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'
        }`}>
          <Wind className="w-4 h-4 text-[#ffd600]" />
          <span>Calidad del Aire</span>
        </span>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${icaStatus.badgeColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${icaStatus.dotColor}`} />
          {icaStatus.level}
        </span>
      </div>

      {/* Most Important Metrics (PM10 Calima & PM2.5 Partículas) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* PM10 Card */}
        <div className={`p-3 rounded-2xl border ${
          activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-100 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold opacity-60">PM10 (Calima)</span>
            <span className="text-[9px] font-mono opacity-50">Límite 50</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-display font-extrabold">{metrics.pm10.toFixed(1)}</span>
            <span className="text-[10px] font-mono opacity-60">µg/m³</span>
          </div>
        </div>

        {/* PM2.5 Card */}
        <div className={`p-3 rounded-2xl border ${
          activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-100 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold opacity-60">PM2.5 (Finas)</span>
            <span className="text-[9px] font-mono opacity-50">Límite 25</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-display font-extrabold">{metrics.pm2_5.toFixed(1)}</span>
            <span className="text-[10px] font-mono opacity-60">µg/m³</span>
          </div>
        </div>
      </div>

      {/* Case-specific Recommendation */}
      <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs font-mono ${
        activeDarkMode ? 'bg-white/5 border-white/5 text-white/80' : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
      }`}>
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <span className="font-bold">Recomendación: </span>
          {icaStatus.recommendation}
        </p>
      </div>
    </div>
  );
}
