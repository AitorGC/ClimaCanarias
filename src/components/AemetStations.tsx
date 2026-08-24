import React from 'react';
import { Thermometer, Wind, Droplets } from 'lucide-react';
import { AemetStation } from '../types';

interface AemetStationsProps {
  stations: AemetStation[];
  activeDarkMode: boolean;
}

export default function AemetStations({ stations, activeDarkMode }: AemetStationsProps) {
  if (!stations || stations.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className={`text-xs font-mono uppercase tracking-widest mb-4 ${
        activeDarkMode ? 'text-white/50' : 'text-slate-500 font-bold'
      }`}>
        Estaciones de Observación (AEMET)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stations.map(station => (
          <div 
            key={station.id}
            className={`p-3 rounded-xl border flex flex-col gap-2 ${
              activeDarkMode 
                ? 'bg-zinc-800/50 border-white/10' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`text-[11px] font-bold truncate ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {station.nombre}
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <Thermometer className={`w-3.5 h-3.5 ${activeDarkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                <span>{station.temp.toFixed(1)}°</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className={`w-3.5 h-3.5 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue'}`} />
                <span>{station.viento} km/h</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className={`w-3.5 h-3.5 ${activeDarkMode ? 'text-sky-400' : 'text-sky-500'}`} />
                <span>{station.hr}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
