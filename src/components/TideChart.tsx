import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface TideChartProps {
  tides: {
    station: string;
    mareas: { tipo: 'pleamar' | 'bajamar'; hora: string; altura: string; }[];
    curve?: { time: string; height: number }[];
  };
  activeDarkMode: boolean;
}

export default function TideChart({ tides, activeDarkMode }: TideChartProps) {
  if (!tides || !tides.curve || tides.curve.length === 0) return null;

  return (
    <div className="w-full h-[180px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={tides.curve} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeDarkMode ? "#14b8a6" : "#0284c7"} stopOpacity={0.4} />
              <stop offset="95%" stopColor={activeDarkMode ? "#14b8a6" : "#0284c7"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={activeDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: activeDarkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }} 
            axisLine={false} 
            tickLine={false}
            interval={3}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: activeDarkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(val) => `${val}m`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: activeDarkMode ? '#18181b' : '#fff',
              borderColor: activeDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: activeDarkMode ? '#fff' : '#000'
            }}
          />
          <ReferenceLine y={0} stroke={activeDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
          <Area 
            type="monotone" 
            dataKey="height" 
            stroke={activeDarkMode ? "#14b8a6" : "#0284c7"} 
            strokeWidth={2}
            fill="url(#tideGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
