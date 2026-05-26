/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Wind, AlertTriangle, Eye, Activity, Heart } from 'lucide-react';
import { AirQuality } from '../types';

interface AirQualityIndicatorProps {
  aqi?: AirQuality;
  calimaRating?: 'Bajo' | 'Moderado' | 'Alto';
  activeDarkMode: boolean;
}

interface AqiCategory {
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  desc: string;
  healthRec: string;
}

export default function AirQualityIndicator({ aqi, calimaRating, activeDarkMode }: AirQualityIndicatorProps) {
  // Graceful defaults if data hasn't loaded
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

  const indexValue = metrics.usAqi;

  // Compute AQI Categories, thresholds and styling configs
  const category: AqiCategory = useMemo(() => {
    if (indexValue <= 50) {
      return {
        label: 'Bueno / Excelente',
        color: 'rgb(34, 197, 94)', // Green
        textColor: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        desc: 'Calidad del aire satisfactoria sin riesgos respiratorios.',
        healthRec: 'Es seguro realizar todas las actividades ordinarias al aire libre sin restricciones.'
      };
    }
    if (indexValue <= 100) {
      return {
        label: 'Aceptable / Moderado',
        color: 'rgb(234, 179, 8)', // Yellow
        textColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        desc: 'Calidad de aire aceptable, riesgo mínimo para personas altamente sensibles.',
        healthRec: 'Personas con alta sensibilidad a partículas finas deben vigilar síntomas breves.'
      };
    }
    if (indexValue <= 150) {
      return {
        label: 'Nocivo para grupos vulnerables',
        color: 'rgb(249, 115, 22)', // Orange
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        desc: 'Los grupos sensibles (ancianos, niños, asmáticos) padecerán efectos de irritación.',
        healthRec: 'Se recomienda a colectivos con patologías reducir esfuerzos en el exterior.'
      };
    }
    if (indexValue <= 200) {
      return {
        label: 'Insalubre / Dañino',
        color: 'rgb(239, 68, 68)', // Red
        textColor: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        desc: 'Población general con posibilidad de padecer molestias y dificultades.',
        healthRec: 'Limite de forma preventiva ejercicios de alta resistencia en zonas urbanas planas.'
      };
    }
    if (indexValue <= 300) {
      return {
        label: 'Muy Nocivo / Deterioro Severo',
        color: 'rgb(168, 85, 247)', // Purple
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        desc: 'Alerta sanitaria generalizada de alta concentración.',
        healthRec: 'Evite por completo esfuerzos exteriores. Permanezca protegido en interiores cerrados.'
      };
    }
    return {
      label: 'Emergencia / Peligroso',
      color: 'rgb(127, 29, 29)', // Maroon
      textColor: 'text-red-900 font-extrabold',
      bgColor: 'bg-red-950/25',
      borderColor: 'border-red-900/40',
      desc: 'Condición extremadamente grave de atmósfera insalubre.',
      healthRec: 'Peligro general. Se aconseja uso obligatorio de mascarilla FFP2 o purificación de aire.'
    };
  }, [indexValue]);

  // Math for gauge circle percentage
  const gaugePercent = Math.min(100, (indexValue / 200) * 100);
  const strokeDashoffset = 157 - (157 * gaugePercent) / 100;

  // Dynamic particle rating thresholds
  const getParticleSeverity = (val: number, isPm25: boolean) => {
    const limit = isPm25 ? 12 : 35;
    if (val <= limit) return { text: 'Excelente', color: 'text-emerald-500' };
    if (val <= limit * 2) return { text: 'Normal', color: 'text-yellow-500' };
    return { text: 'Elevado', color: 'text-red-500' };
  };

  const getGasSeverity = (val: number, type: 'no2' | 'o3' | 'so2' | 'co') => {
    let limit = 40; // NO2 limits
    if (type === 'o3') limit = 100;
    if (type === 'so2') limit = 15;
    if (type === 'co') limit = 400;

    if (val <= limit) return 'Excelente';
    if (val <= limit * 2) return 'Aceptable';
    return 'Elevado';
  };

  return (
    <div className="flex flex-col items-stretch w-full">
      {/* Header controls inside widget */}
      <div className="flex items-center justify-between mb-4 border-b border-dashed border-white/5 pb-3">
        <div>
          <h4 className={`text-[12px] font-mono tracking-widest uppercase font-bold flex items-center gap-1.5 ${
            activeDarkMode ? 'text-teal-400' : 'text-brand-blue'
          }`}>
            <Wind className="w-3.5 h-3.5 animate-pulse" />
            ÍNDICE DE CALIDAD DEL AIRE (AQI)
          </h4>
          <p className={`text-[10px] mt-0.5 ${activeDarkMode ? 'text-white/35' : 'text-slate-400'}`}>
            Vigilancia en tiempo real de partículas en suspensión e intrusiones
          </p>
        </div>
        
        {/* Quality pill */}
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-tight border ${category.bgColor} ${category.textColor} ${category.borderColor}`}>
          US-AQI: {indexValue}
        </span>
      </div>

      {/* Main layout splitting Gauge and core description */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Gauge block column (Col-5) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center relative py-1">
          {/* Semicircular circular progress gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 64 64" className="transform -rotate-90">
              {/* Outer background ring */}
              <circle
                cx="32"
                cy="32"
                r="25"
                fill="none"
                stroke={activeDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}
                strokeWidth="4"
              />
              {/* Glowing active ring fill */}
              <motion.circle
                cx="32"
                cy="32"
                r="25"
                fill="none"
                stroke={category.color}
                strokeWidth="4"
                strokeDasharray="157"
                initial={{ strokeDashoffset: 157 }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Centered current index value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-0.5 text-center">
              <span className={`text-2xl font-display font-bold leading-none ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {indexValue}
              </span>
              <span className={`text-[7.5px] font-mono tracking-widest uppercase mt-0.5 block ${activeDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                INDICE ICA
              </span>
            </div>
          </div>
          
          <span className={`text-[11px] font-bold text-center mt-2 ${category.textColor}`}>
            {category.label}
          </span>
        </div>

        {/* Categories description text block (Col-8) */}
        <div className="md:col-span-8 space-y-3">
          <div className="space-y-1">
            <p className={`text-[11.5px] leading-relaxed font-sans ${activeDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
              <strong className={activeDarkMode ? 'text-white' : 'text-slate-900'}>Estado:</strong> {category.desc}
            </p>
            <p className={`text-[10px] leading-relaxed font-sans border-l-2 pl-2 ${
              activeDarkMode ? 'border-teal-400/35 text-white/50' : 'border-brand-blue/30 text-slate-500'
            }`}>
              {category.healthRec}
            </p>
          </div>

          {/* Calima Intrusion Warning sync */}
          {calimaRating && calimaRating !== 'Bajo' && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-2. rounded-xl border flex items-start gap-2 ${
                calimaRating === 'Alto'
                  ? (activeDarkMode ? 'bg-red-950/20 border-red-800/35 text-red-200' : 'bg-red-50 border-red-150 text-red-800')
                  : (activeDarkMode ? 'bg-amber-950/25 border-amber-800/25 text-amber-200' : 'bg-amber-50/70 border-amber-150 text-amber-800')
              }`}
            >
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 animate-pulse ${calimaRating === 'Alto' ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="text-[9px] font-mono leading-tight">
                <span className="font-bold block uppercase tracking-wide">
                  ALERTA EN SUSPENSIÓN - INTRUSIÓN DE CALIMA
                </span>
                <span className="opacity-90 mt-0.5 block">
                  Presencia activa de polvo en suspensión procedente del Sáhara que aumenta drásticamente los niveles de partículas PM10. Evite de forma rigurosa la ventilación doméstica de estancias.
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Particulate Matter Progress bars (PM2.5 and PM10) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t ${
        activeDarkMode ? 'border-white/5' : 'border-slate-150'
      }`}>
        {/* PM2.5 details */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-baseline text-[10px] font-mono">
            <span className={`font-semibold flex items-center gap-1 ${activeDarkMode ? 'text-white/65' : 'text-slate-500'}`}>
              <Eye className="w-3 h-3 text-sky-400" />
              Diámetro PM2.5 (Fino)
            </span>
            <span className={`font-bold ${getParticleSeverity(metrics.pm2_5, true).color}`}>
              {metrics.pm2_5.toFixed(1)} µg/m³
            </span>
          </div>
          {/* Visual bar meter */}
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${activeDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (metrics.pm2_5 / 35) * 100)}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${
                metrics.pm2_5 <= 12 ? 'bg-emerald-500' : metrics.pm2_5 <= 35 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          <p className={`text-[8px] font-mono opacity-50 uppercase text-right tracking-tight ${activeDarkMode ? 'text-white' : 'text-slate-600'}`}>
            Estado: {getParticleSeverity(metrics.pm2_5, true).text}
          </p>
        </div>

        {/* PM10 details */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-baseline text-[10px] font-mono">
            <span className={`font-semibold flex items-center gap-1 ${activeDarkMode ? 'text-white/65' : 'text-slate-500'}`}>
              <Activity className="w-3 h-3 text-emerald-400" />
              Diámetro PM10 (Grueso)
            </span>
            <span className={`font-bold ${getParticleSeverity(metrics.pm10, false).color}`}>
              {metrics.pm10.toFixed(1)} µg/m³
            </span>
          </div>
          {/* Visual bar meter */}
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${activeDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (metrics.pm10 / 100) * 100)}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${
                metrics.pm10 <= 35 ? 'bg-emerald-500' : metrics.pm10 <= 100 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          <p className={`text-[8px] font-mono opacity-50 uppercase text-right tracking-tight ${activeDarkMode ? 'text-white' : 'text-slate-600'}`}>
            Estado: {getParticleSeverity(metrics.pm10, false).text}
          </p>
        </div>
      </div>

      {/* Grid containing gaseous substances metrics */}
      <div className="mt-4 pt-3.5 border-t border-dashed border-white/5">
        <span className={`text-[9.5px] font-mono tracking-widest uppercase block mb-2.5 font-bold ${activeDarkMode ? 'text-white/50' : 'text-slate-450'}`}>
          <Heart className="w-3 h-3 text-red-500 inline-block mr-1" />
          REGISTROS DE GASES Y COMPONENTES ADICIONALES
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
          <div className={`p-2 rounded-xl border ${activeDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className={`block text-[8px] opacity-60 uppercase font-semibold ${activeDarkMode ? 'text-white' : 'text-slate-500'}`}>Ozono (O₃)</span>
            <span className={`block font-bold text-xs mt-1 ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{metrics.o3.toFixed(0)}</span>
            <span className={`block text-[7.5px] mt-0.5 uppercase ${
              getGasSeverity(metrics.o3, 'o3') === 'Excelente' ? 'text-emerald-500' : 'text-amber-500'
            }`}>{getGasSeverity(metrics.o3, 'o3')}</span>
          </div>

          <div className={`p-2 rounded-xl border ${activeDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className={`block text-[8px] opacity-60 uppercase font-semibold ${activeDarkMode ? 'text-white' : 'text-slate-500'}`}>Dióxido Nitr. (NO₂)</span>
            <span className={`block font-bold text-xs mt-1 ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{metrics.no2.toFixed(1)}</span>
            <span className={`block text-[7.5px] mt-0.5 uppercase ${
              getGasSeverity(metrics.no2, 'no2') === 'Excelente' ? 'text-emerald-500' : 'text-amber-500'
            }`}>{getGasSeverity(metrics.no2, 'no2')}</span>
          </div>

          <div className={`p-2 rounded-xl border ${activeDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className={`block text-[8px] opacity-60 uppercase font-semibold ${activeDarkMode ? 'text-white' : 'text-slate-500'}`}>Dióxido Azufre (SO₂)</span>
            <span className={`block font-bold text-xs mt-1 ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{metrics.so2.toFixed(1)}</span>
            <span className={`block text-[7.5px] mt-0.5 uppercase ${
              getGasSeverity(metrics.so2, 'so2') === 'Excelente' ? 'text-emerald-500' : 'text-amber-500'
            }`}>{getGasSeverity(metrics.so2, 'so2')}</span>
          </div>

          <div className={`p-2 rounded-xl border ${activeDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <span className={`block text-[8px] opacity-60 uppercase font-semibold ${activeDarkMode ? 'text-white' : 'text-slate-500'}`}>Monóx. Carbono (CO)</span>
            <span className={`block font-bold text-xs mt-1 ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{metrics.co.toFixed(0)}</span>
            <span className={`block text-[7.5px] mt-0.5 uppercase ${
              getGasSeverity(metrics.co, 'co') === 'Excelente' ? 'text-emerald-500' : 'text-amber-500'
            }`}>{getGasSeverity(metrics.co, 'co')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
