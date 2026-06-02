import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ForecastDay } from '../types';
import { Calendar, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

interface DailyComparisonChartProps {
  daily: ForecastDay[];
  tempUnit: 'C' | 'F';
  activeDarkMode: boolean;
}

export default function DailyComparisonChart({ daily, tempUnit, activeDarkMode }: DailyComparisonChartProps) {
  const chartData = useMemo(() => {
    if (!daily || daily.length === 0) return [];
    
    // Take the first 7 days
    const next7Days = daily.slice(0, 7);

    return next7Days.map((day) => {
      const d = new Date(day.date + 'T00:00:00'); // Prevent timezone shift issues
      const formattedDate = d.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric' 
      });

      const maxVal = tempUnit === 'C' ? day.tempMax : (day.tempMax * 9/5) + 32;
      const minVal = tempUnit === 'C' ? day.tempMin : (day.tempMin * 9/5) + 32;

      return {
        name: formattedDate.replace('.', ''), // Clean up dots from days
        "Máxima": parseFloat(maxVal.toFixed(1)),
        "Mínima": parseFloat(minVal.toFixed(1)),
        condition: day.condition,
        pop: day.pop,
      };
    });
  }, [daily, tempUnit]);

  if (!daily || daily.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-xs font-mono opacity-50">Cargando datos comparativos de temperaturas...</p>
      </div>
    );
  }

  // Define styling-related variables
  const gridColor = activeDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const labelColor = activeDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#475569';
  const tooltipBg = activeDarkMode ? '#18181b' : '#ffffff';
  const tooltipBorder = activeDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 73, 147, 0.1)';
  const tooltipTextColor = activeDarkMode ? '#ffffff' : '#0f172a';

  // Bar colors
  const maxBarColor = activeDarkMode ? '#ffd600' : '#004993';
  const minBarColor = activeDarkMode ? '#38bdf8' : '#3b82f6';

  return (
    <div className="flex flex-col h-full w-full justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className={`text-xs font-mono uppercase tracking-widest flex items-center gap-2 ${
          activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'
        }`}>
          <BarChart3 className={`w-4 h-4 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue'}`} />
          <span>Comparativa: Próximos 7 Días</span>
        </h3>
        
        {/* Simple Legend indicator in custom styles */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: maxBarColor }}></span>
            <span className={activeDarkMode ? 'text-white/70' : 'text-slate-650'}>Máxima</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: minBarColor }}></span>
            <span className={activeDarkMode ? 'text-white/70' : 'text-slate-650'}>Mínima</span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-[240px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke={labelColor} 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
              tickFormatter={(value) => value.toUpperCase()}
            />
            <YAxis 
              stroke={labelColor} 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}°`}
            />
            <Tooltip
              cursor={{ fill: activeDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.015)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div 
                      className="p-3 border rounded-xl shadow-lg backdrop-blur-md text-left" 
                      style={{ 
                        backgroundColor: tooltipBg, 
                        borderColor: tooltipBorder, 
                        color: tooltipTextColor 
                      }}
                    >
                      <p className="font-sans text-xs font-bold capitalize mb-2 border-b pb-1 border-slate-100 dark:border-white/5">
                        {label}
                      </p>
                      <div className="space-y-1.5 font-mono text-xs">
                        {payload.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-1.5 opacity-80">
                              {item.name === "Máxima" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              {item.name}:
                            </span>
                            <span className="font-bold">
                              {item.value}°{tempUnit}
                            </span>
                          </div>
                        ))}
                        {payload[0] && payload[0].payload.pop !== undefined && (
                          <div className="flex items-center justify-between gap-6 border-t pt-1.5 mt-1.5 text-[11px] opacity-70">
                            <span>Precipitación:</span>
                            <span className="font-bold text-sky-500">
                              {payload[0].payload.pop}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="Máxima" 
              fill={maxBarColor} 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="Mínima" 
              fill={minBarColor} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
