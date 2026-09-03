import { motion, AnimatePresence } from 'motion/react';
import { X, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getTelemetryData, TELEMETRY_COLORS, ApiCategory } from '../telemetry';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDarkMode: boolean;
}

export default function TelemetryModal({ isOpen, onClose, activeDarkMode }: TelemetryModalProps) {
  const [data, setData] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (isOpen) {
      getTelemetryData().then(setData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalCalls = Object.values(data).reduce((acc: number, val: number) => acc + val, 0) as number;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[28px] shadow-2xl p-6 ${
            activeDarkMode ? 'bg-[#1b2025] text-white border border-white/10' : 'bg-white text-slate-900'
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Telemetría de APIs
            </h2>
            <button onClick={onClose} className={`p-2 rounded-full ${activeDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className={`text-center p-4 rounded-2xl border ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <div className="text-4xl font-display font-bold">{totalCalls}</div>
              <div className={`text-xs font-mono uppercase tracking-wider mt-1 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>Peticiones Totales</div>
            </div>

            {totalCalls > 0 && (
              <div>
                <div className="flex h-4 rounded-full overflow-hidden mb-4">
                  {Object.entries(data).map(([key, value]) => (
                    <div 
                      key={key} 
                      style={{ 
                        width: `${((value as number) / totalCalls) * 100}%`,
                        backgroundColor: TELEMETRY_COLORS[key as ApiCategory] || TELEMETRY_COLORS.OTHER 
                      }} 
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(data).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg border dark:border-white/5 border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TELEMETRY_COLORS[key as ApiCategory] || TELEMETRY_COLORS.OTHER }} />
                        <span className="opacity-80">{key}</span>
                      </div>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
