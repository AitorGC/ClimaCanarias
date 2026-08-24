import React from 'react';
import { Flag, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { BeachInfo } from '../types';

interface BeachStatusProps {
  beachInfo: BeachInfo;
  activeDarkMode: boolean;
}

export default function BeachStatus({ beachInfo, activeDarkMode }: BeachStatusProps) {
  const getFlagColor = (estado: string) => {
    switch(estado.toLowerCase()) {
      case 'verde': return 'bg-green-500 text-green-100 border-green-600';
      case 'amarilla': return 'bg-yellow-400 text-yellow-900 border-yellow-500';
      case 'roja': return 'bg-red-500 text-red-100 border-red-600';
      default: return 'bg-slate-300 text-slate-800 border-slate-400';
    }
  };

  return (
    <div className={`mt-6 pt-6 border-t ${activeDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
      <h4 className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${activeDarkMode ? 'text-white/50' : 'text-slate-500 font-semibold'}`}>
        Estado de Playa y Socorrismo
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3 rounded-xl border ${activeDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Flag className={`w-4 h-4 ${activeDarkMode ? 'text-white/70' : 'text-slate-600'}`} />
            <span className={`text-xs ${activeDarkMode ? 'text-white/70' : 'text-slate-600'}`}>Bandera</span>
          </div>
          <div className={`inline-flex px-3 py-1 rounded-md text-xs font-bold border ${getFlagColor(beachInfo.estadoBandera)}`}>
            {beachInfo.estadoBandera.toUpperCase()}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${activeDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${activeDarkMode ? 'text-white/70' : 'text-slate-600'}`} />
            <span className={`text-xs ${activeDarkMode ? 'text-white/70' : 'text-slate-600'}`}>Peligros</span>
          </div>
          <div className={`text-xs font-mono font-semibold ${activeDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {beachInfo.peligros}
          </div>
        </div>

        <div className={`col-span-2 p-3 rounded-xl border flex items-center justify-between ${activeDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${beachInfo.socorrismoActivo ? (activeDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700') : (activeDarkMode ? 'bg-white/10 text-white/50' : 'bg-slate-200 text-slate-500')}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {beachInfo.socorrismoActivo ? 'Socorrismo Activo' : 'Sin Servicio'}
              </div>
              <div className={`text-[10px] ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                {beachInfo.proveedor}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs opacity-70">
            <Clock className="w-3.5 h-3.5" />
            <span>{beachInfo.horario}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
