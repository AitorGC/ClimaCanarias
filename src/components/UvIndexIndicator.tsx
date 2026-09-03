/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Sun, Shield, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UvIndexIndicatorProps {
  uvIndex?: number;
  activeDarkMode: boolean;
}

export interface UvScaleLevel {
  level: number;
  displayNumber: string;
  bgHex: string;
  textColor: string;
  name: string;
  group: 'low' | 'medium' | 'high';
  groupName: string;
  protectionTier: 'NO NECESITA PROTECCIÓN' | 'NECESITA PROTECCIÓN' | 'NECESITA PROTECCIÓN EXTRA';
  description: string;
  recommendation: string;
}

export const UV_SCALE_1_TO_11_LEVELS: UvScaleLevel[] = [
  {
    level: 1,
    displayNumber: '1',
    bgHex: '#16a34a',
    textColor: 'text-emerald-500',
    name: 'Mínimo',
    group: 'low',
    groupName: 'Riesgo Mínimo',
    protectionTier: 'NO NECESITA PROTECCIÓN',
    description: 'Radiación ultravioleta mínima. Sin peligro para la piel.',
    recommendation: 'Disfrute del exterior con total seguridad.',
  },
  {
    level: 2,
    displayNumber: '2',
    bgHex: '#65a30d',
    textColor: 'text-lime-500',
    name: 'Bajo',
    group: 'low',
    groupName: 'Riesgo Bajo',
    protectionTier: 'NO NECESITA PROTECCIÓN',
    description: 'Radiación solar muy baja. Riesgo mínimo.',
    recommendation: 'Gafas de sol recomendadas en horas de resol directo.',
  },
  {
    level: 3,
    displayNumber: '3',
    bgHex: '#eab308',
    textColor: 'text-yellow-500',
    name: 'Moderado Bajo',
    group: 'medium',
    groupName: 'Riesgo Moderado',
    protectionTier: 'NECESITA PROTECCIÓN',
    description: 'Radiación moderada. Pieles sensibles pueden sufrir quemaduras.',
    recommendation: 'Aplique crema solar SPF 15-30 y use gorra.',
  },
  {
    level: 4,
    displayNumber: '4',
    bgHex: '#f59e0b',
    textColor: 'text-amber-500',
    name: 'Moderado',
    group: 'medium',
    groupName: 'Riesgo Moderado',
    protectionTier: 'NECESITA PROTECCIÓN',
    description: 'Radiación solar perceptible típica en Canarias.',
    recommendation: 'Use protector solar SPF 30 y gafas de sol homologadas.',
  },
  {
    level: 5,
    displayNumber: '5',
    bgHex: '#f97316',
    textColor: 'text-orange-500',
    name: 'Medio Alto',
    group: 'medium',
    groupName: 'Riesgo Moderado',
    protectionTier: 'NECESITA PROTECCIÓN',
    description: 'Radiación con capacidad de provocar quemaduras en fototipos claros.',
    recommendation: 'Busque la sombra entre las 12:00 y las 16:00 horas.',
  },
  {
    level: 6,
    displayNumber: '6',
    bgHex: '#ea580c',
    textColor: 'text-orange-600',
    name: 'Alto',
    group: 'medium',
    groupName: 'Riesgo Alto',
    protectionTier: 'NECESITA PROTECCIÓN',
    description: 'Índice de radiación alto con riesgo dérmico evidente.',
    recommendation: 'Protector solar SPF 50, camiseta y gafas con filtro UV400.',
  },
  {
    level: 7,
    displayNumber: '7',
    bgHex: '#c2410c',
    textColor: 'text-orange-700',
    name: 'Muy Alto',
    group: 'medium',
    groupName: 'Riesgo Alto',
    protectionTier: 'NECESITA PROTECCIÓN',
    description: 'Radiación solar intensa habitual en costas e islas.',
    recommendation: 'Protección reforzada SPF 50+, sombrilla y cobertura física.',
  },
  {
    level: 8,
    displayNumber: '8',
    bgHex: '#dc2626',
    textColor: 'text-red-500',
    name: 'Muy Alto / Nocivo',
    group: 'high',
    groupName: 'Riesgo Muy Alto',
    protectionTier: 'NECESITA PROTECCIÓN EXTRA',
    description: 'Riesgo muy alto de quemadura rápida sin protección (15 min).',
    recommendation: 'Permanezca en sombra en las horas centrales. SPF 50+ indispensable.',
  },
  {
    level: 9,
    displayNumber: '9',
    bgHex: '#db2777',
    textColor: 'text-pink-500',
    name: 'Severo',
    group: 'high',
    groupName: 'Riesgo Severo',
    protectionTier: 'NECESITA PROTECCIÓN EXTRA',
    description: 'Radiación muy severa con peligro inmediato de eritema solar.',
    recommendation: 'Evite actividades físicas prolongadas al aire libre al mediodía.',
  },
  {
    level: 10,
    displayNumber: '10',
    bgHex: '#9333ea',
    textColor: 'text-purple-500',
    name: 'Extremo',
    group: 'high',
    groupName: 'Riesgo Extremo',
    protectionTier: 'NECESITA PROTECCIÓN EXTRA',
    description: 'Nivel crítico. Quemaduras en menos de 10 minutos.',
    recommendation: 'No se exponga al sol directo. Máxima protección dérmica y ocular.',
  },
  {
    level: 11,
    displayNumber: '+11',
    bgHex: '#6366f1',
    textColor: 'text-indigo-400',
    name: 'Extremo Máximo (11+)',
    group: 'high',
    groupName: 'Riesgo Máximo',
    protectionTier: 'NECESITA PROTECCIÓN EXTRA',
    description: 'Pico máximo de la escala internacional.',
    recommendation: 'Permanezca bajo techo o en sombra total.',
  },
];

export default function UvIndexIndicator({ uvIndex = 4, activeDarkMode }: UvIndexIndicatorProps) {
  const safeScore = typeof uvIndex === 'number' && !isNaN(uvIndex) ? uvIndex : 4;
  const roundedLevel = Math.min(11, Math.max(1, Math.round(safeScore)));

  const currentLevel = useMemo(() => {
    return UV_SCALE_1_TO_11_LEVELS.find(l => l.level === roundedLevel) || UV_SCALE_1_TO_11_LEVELS[3];
  }, [roundedLevel]);

  // Position percentage along the 1-11 scale (0% to 100%)
  const percentage = Math.min(100, Math.max(0, ((safeScore - 1) / 10) * 100));

  return (
    <div id="uv-index-somero-widget" className="flex flex-col items-stretch w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
          activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'
        }`}>
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Radiación UV</span>
        </span>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
          currentLevel.group === 'low'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
            : currentLevel.group === 'medium'
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-600'
            : 'bg-red-500/15 border-red-500/30 text-red-500'
        }`}>
          {currentLevel.name}
        </span>
      </div>

      {/* Main Score & Compact Gauge */}
      <div className={`p-3.5 rounded-2xl border mb-3 ${
        activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-100 shadow-2xs'
      }`}>
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-extrabold tracking-tight">
              {safeScore.toFixed(1)}
            </span>
            <span className="text-xs font-mono opacity-60">/ 11+ UV</span>
          </div>
          <span className={`text-[11px] font-mono font-bold ${currentLevel.textColor}`}>
            {currentLevel.protectionTier}
          </span>
        </div>

        {/* Continuous Linear Meter (1 to 11+) */}
        <div className="relative w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-purple-600 overflow-visible my-1.5">
          {/* Thumb marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 shadow-md transition-all duration-300"
            style={{ left: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono opacity-50 mt-1">
          <span>1 Bajo</span>
          <span>5 Moderado</span>
          <span>8 Muy Alto</span>
          <span>11+ Extremo</span>
        </div>
      </div>

      {/* Recommendation Callout */}
      <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs font-mono ${
        activeDarkMode ? 'bg-white/5 border-white/5 text-white/80' : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
      }`}>
        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <span className="font-bold">Recomendación: </span>
          {currentLevel.recommendation}
        </p>
      </div>
    </div>
  );
}
