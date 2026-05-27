/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, CloudRain, Droplets, Thermometer, Info } from 'lucide-react';
import { WeatherCondition } from '../types';

interface HourlyData {
  time: string;
  temp: number;
  condition: WeatherCondition;
  precipProb?: number;
  humidity?: number;
}

interface TrendChartProps {
  hourly: HourlyData[];
  tempUnit: 'C' | 'F';
  activeDarkMode: boolean;
}

export default function TrendChart({ hourly, tempUnit, activeDarkMode }: TrendChartProps) {
  // Take first 12 hourly intervals for clear readability without squishing
  const data = useMemo(() => hourly.slice(0, 12), [hourly]);

  const [activeMetric, setActiveMetric] = useState<'temp' | 'precip'>('temp');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Dimensions state handled responsively
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 180 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep height proportional and visually balanced
      setDimensions({
        width: Math.max(280, width),
        height: 180
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const padding = { top: 25, right: 20, bottom: 30, left: 40 };

  // Calculate scales
  const points = useMemo(() => {
    if (data.length === 0) return [];

    const xCoords = data.map((_, i) => {
      const step = (width - padding.left - padding.right) / (data.length - 1);
      return padding.left + i * step;
    });

    let yMin = 0;
    let yMax = 100;

    if (activeMetric === 'temp') {
      const temps = data.map(d => d.temp);
      const minVal = Math.min(...temps);
      const maxVal = Math.max(...temps);
      // Give 2 degree margins on top and bottom so lines don't clip
      yMin = minVal - 2;
      yMax = maxVal + 2;
      // Avoid division by zero if all temperatures are identical
      if (yMin === yMax) {
        yMin -= 2;
        yMax += 2;
      }
    } else {
      // Precipitation is always 0% to 100%
      yMin = 0;
      yMax = 100;
    }

    const yCoords = data.map(d => {
      const val = activeMetric === 'temp' ? d.temp : (d.precipProb ?? 0);
      const ratio = (val - yMin) / (yMax - yMin);
      // SVG coordinates have 0 at the top, so invert the ratio
      return height - padding.bottom - ratio * (height - padding.top - padding.bottom);
    });

    return data.map((d, i) => ({
      x: xCoords[i],
      y: yCoords[i],
      val: activeMetric === 'temp' ? d.temp : (d.precipProb ?? 0),
      raw: d
    }));
  }, [data, activeMetric, width, height]);

  // Generate smooth cubic bezier spline SVG path
  const pathData = useMemo(() => {
    if (points.length < 2) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    // Draw smooth bezier curves using catmull-rom inspired control points
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Control point offsets: 30% width spacing for organic transition
      const cpX1 = p1.x + (p2.x - p1.x) * 0.35;
      const cpY1 = p1.y;
      const cpX2 = p1.x + (p2.x - p1.x) * 0.65;
      const cpY2 = p2.y;
      
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  // Fill path for background gradient below curve
  const fillPathData = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = height - padding.bottom;
    return `${pathData} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [points, pathData, height]);

  // Labels on Y-axis
  const yLabels = useMemo(() => {
    if (data.length === 0) return [];
    if (activeMetric === 'temp') {
      const temps = data.map(d => d.temp);
      const minVal = Math.min(...temps);
      const maxVal = Math.max(...temps);
      const range = maxVal - minVal;
      return [
        minVal - 1,
        minVal + range / 2,
        maxVal + 1
      ].map(v => Math.round(v));
    } else {
      return [0, 50, 100];
    }
  }, [data, activeMetric]);

  const activeHoverData = hoveredIndex !== null ? points[hoveredIndex] : null;

  // Custom formatting
  const formatVal = (val: number) => {
    if (activeMetric === 'temp') {
      return tempUnit === 'C' ? `${Math.round(val)}°` : `${Math.round((val * 9/5) + 32)}F`;
    }
    return `${Math.round(val)}%`;
  };

  const getConditionEmoji = (cond: WeatherCondition) => {
    switch (cond) {
      case 'sunny': return '☀️';
      case 'rainy': return '🌧️';
      case 'cloudy': return '☁️';
      case 'windy': return '💨';
      case 'storm': return '⛈️';
      case 'snowy': return '❄️';
      case 'foggy': return '🌫️';
      default: return '☀️';
    }
  };

  return (
    <div className="flex flex-col items-stretch w-full">
      {/* Header controls inside chart widget */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`text-[12px] font-mono tracking-widest uppercase font-bold flex items-center gap-1.5 ${
            activeDarkMode ? 'text-teal-400' : 'text-brand-blue'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            TENDENCIA HORARIA
          </h4>
          <p className={`text-[10px] mt-0.5 ${activeDarkMode ? 'text-white/35' : 'text-slate-400'}`}>
            Intervalos en alta resolución para las próximas 12 horas
          </p>
        </div>

        {/* Tab selection switches */}
        <div className={`flex border rounded-xl p-0.5 overflow-hidden text-[10px] font-mono font-medium ${
          activeDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={() => { setActiveMetric('temp'); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeMetric === 'temp'
                ? (activeDarkMode ? 'bg-white/10 text-white shadow-xs' : 'bg-white text-brand-blue shadow-sm font-bold border-slate-100 border')
                : 'opacity-50 hover:opacity-100 text-slate-500'
            }`}
          >
            <Thermometer className="w-3 h-3" />
            Temp
          </button>
          <button
            onClick={() => { setActiveMetric('precip'); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeMetric === 'precip'
                ? (activeDarkMode ? 'bg-white/10 text-white shadow-xs' : 'bg-white text-brand-blue shadow-sm font-bold border-slate-100 border')
                : 'opacity-50 hover:opacity-100 text-slate-500'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            Lluvia
          </button>
        </div>
      </div>

      {/* Main SVG Plotting Area */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-visible select-none cursor-crosshair"
        onMouseLeave={() => setHoveredIndex(null)}
        onTouchEnd={() => setHoveredIndex(null)}
      >
        <svg 
          width="100%" 
          height={height} 
          className="overflow-visible"
          onMouseMove={(e) => {
            const svgRect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - svgRect.left;
            
            // Find closest index
            let closestIdx = 0;
            let minDist = Infinity;
            points.forEach((pt, i) => {
              const d = Math.abs(pt.x - clientX);
              if (d < minDist) {
                minDist = d;
                closestIdx = i;
              }
            });
            if (minDist < 60) {
              setHoveredIndex(closestIdx);
            } else {
              setHoveredIndex(null);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 0) return;
            const svgRect = e.currentTarget.getBoundingClientRect();
            const clientX = e.touches[0].clientX - svgRect.left;
            
            let closestIdx = 0;
            let minDist = Infinity;
            points.forEach((pt, i) => {
              const d = Math.abs(pt.x - clientX);
              if (d < minDist) {
                minDist = d;
                closestIdx = i;
              }
            });
            if (minDist < 60) {
              setHoveredIndex(closestIdx);
            }
          }}
        >
          {/* Definitions for gorgeous climate gradients */}
          <defs>
            <linearGradient id="chartTempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartPrecipGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
            
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={activeMetric === 'temp' ? '#fb923c' : '#38bdf8'} />
              <stop offset="100%" stopColor={activeMetric === 'temp' ? '#f97316' : '#0284c7'} />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          {yLabels.map((lbl, idx) => {
            // Map label back to Y coordinate
            let yVal = 0;
            if (activeMetric === 'temp') {
              const temps = data.map(d => d.temp);
              const minVal = Math.min(...temps) - 2;
              const maxVal = Math.max(...temps) + 2;
              const ratio = ((lbl - minVal) / (maxVal - minVal));
              yVal = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
            } else {
              yVal = height - padding.bottom - (lbl / 100) * (height - padding.top - padding.bottom);
            }

            if (isNaN(yVal)) return null;

            return (
              <g key={`grid-y-${idx}`}>
                <line 
                  x1={padding.left} 
                  y1={yVal} 
                  x2={width - padding.right} 
                  y2={yVal} 
                  stroke={activeDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"} 
                  strokeDasharray="4,4"
                />
                <text 
                  x={padding.left - 10} 
                  y={yVal + 3} 
                  fontSize="8" 
                  fontFamily="monospace"
                  textAnchor="end"
                  className={activeDarkMode ? 'fill-white/30 font-bold' : 'fill-slate-400 font-medium'}
                >
                  {lbl}{activeMetric === 'temp' ? '°' : '%'}
                </text>
              </g>
            );
          })}

          {/* Solid line below plotting area */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke={activeDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
          />

          {/* Plot curves */}
          {points.length >= 2 && (
            <>
              {/* Background glowing area under line */}
              <motion.path
                key={`area-${activeMetric}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                d={fillPathData}
                fill={activeMetric === 'temp' ? 'url(#chartTempGrad)' : 'url(#chartPrecipGrad)'}
              />

              {/* Glowing spline stroke line */}
              <motion.path
                key={`line-${activeMetric}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                d={pathData}
                fill="none"
                stroke="url(#chartLineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Active Hover vertical guidelines and point indicator */}
          <AnimatePresence>
            {activeHoverData && (
              <g>
                <line
                  x1={activeHoverData.x}
                  y1={padding.top}
                  x2={activeHoverData.x}
                  y2={height - padding.bottom}
                  stroke={activeMetric === 'temp' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(14, 165, 233, 0.3)'}
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                
                {/* Secondary highlight outer halo */}
                <circle
                  cx={activeHoverData.x}
                  cy={activeHoverData.y}
                  r="7"
                  fill={activeMetric === 'temp' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(14, 165, 233, 0.2)'}
                  className="animate-ping"
                />

                {/* Main data point circle dot */}
                <circle
                  cx={activeHoverData.x}
                  cy={activeHoverData.y}
                  r="4.5"
                  fill={activeMetric === 'temp' ? '#f97316' : '#0284c7'}
                  stroke={activeDarkMode ? '#171717' : '#ffffff'}
                  strokeWidth="1.5"
                />
              </g>
            )}
          </AnimatePresence>

          {/* X Axis Time Labels */}
          {points.map((pt, i) => {
            // Draw every alternate label on small mobile views to prevent horizontal cluster overlap
            const divisor = width < 420 ? 3 : width < 600 ? 2 : 1;
            if (i % divisor !== 0) return null;

            return (
              <g key={`x-lbl-${i}`}>
                <text
                  x={pt.x}
                  y={height - padding.bottom + 15}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className={`duration-300 font-semibold ${
                    hoveredIndex === i
                      ? (activeDarkMode ? 'fill-teal-300' : 'fill-brand-blue font-boldScale')
                      : (activeDarkMode ? 'fill-white/35' : 'fill-slate-500')
                  }`}
                >
                  {pt.raw.time}
                </text>
                <text
                  x={pt.x}
                  y={height - padding.bottom + 25}
                  fontSize="10"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {getConditionEmoji(pt.raw.condition)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Rich Popup Tooltip Box */}
        <AnimatePresence>
          {activeHoverData && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="absolute z-30 pointer-events-none rounded-xl p-3 border shadow-xl flex flex-col gap-1 min-w-[130px]"
              style={{
                left: `${Math.min(
                  width - 150,
                  Math.max(10, activeHoverData.x - 65)
                )}px`,
                top: `${Math.min(
                  height - 60,
                  Math.max(-45, activeHoverData.y - 75)
                )}px`
              }}
            >
              <div className={`absolute inset-0 rounded-xl backdrop-blur-md opacity-95 ${
                activeDarkMode ? 'bg-zinc-950/95 border-white/10' : 'bg-white border-slate-200'
              } border -z-10`} />

              <div className="flex items-center justify-between gap-2 border-b pb-1 mb-1 border-white/5">
                <span className={`text-[10px] font-mono uppercase font-bold ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue'}`}>
                  Hora: {activeHoverData.raw.time}
                </span>
                <span className="text-xs">
                  {getConditionEmoji(activeHoverData.raw.condition)}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 text-[9.5px] font-mono leading-tight">
                <div className="flex items-center justify-between gap-3">
                  <span className={activeDarkMode ? 'text-white/50' : 'text-slate-400'}>Temp:</span>
                  <span className={`font-bold ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {tempUnit === 'C' ? `${Math.round(activeHoverData.raw.temp)}°C` : `${Math.round((activeHoverData.raw.temp * 9/5) + 32)}F`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className={activeDarkMode ? 'text-white/50' : 'text-slate-400'}>Lluvia:</span>
                  <span className="font-bold text-teal-400">
                    {activeHoverData.raw.precipProb ?? 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className={activeDarkMode ? 'text-white/50' : 'text-slate-400'}>Humedad:</span>
                  <span className={`font-bold ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {activeHoverData.raw.humidity ?? 0}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info indicator banner */}
      <div className={`flex items-center gap-1.5 mt-4 p-2.5 rounded-xl border text-[9.5px] font-mono leading-relaxed transition-colors border-dashed ${
        activeDarkMode 
          ? 'bg-white/[0.01] border-white/10 text-white/40' 
          : 'bg-blue-50/20 border-brand-blue/15 text-slate-500 font-medium'
      }`}>
        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>Instrucción: Deslice el cursor sobre la gráfica para inspeccionar las métricas de varianza en cada hora.</span>
      </div>
    </div>
  );
}
