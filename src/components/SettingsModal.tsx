import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Moon, Smartphone, Database, Check, Thermometer, LogIn, LogOut, MapPin, LocateFixed, ShieldCheck, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { storage } from '../storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDarkMode: boolean;
  darkModeSetting: 'auto' | 'dark' | 'light';
  setDarkModeSetting: (val: 'auto' | 'dark' | 'light') => void;
  tempUnit: 'C' | 'F';
  setTempUnit: (val: 'C' | 'F') => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onLocateUser?: () => void;
}

export default function SettingsModal({
  isOpen, onClose, activeDarkMode, darkModeSetting, setDarkModeSetting, tempUnit, setTempUnit, isAuthenticated, onLogin, onLogout, onLocateUser
}: SettingsModalProps) {
  
  const [aemetAlerts, setAemetAlerts] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [geoPermission, setGeoPermission] = useState<string>('prompt');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    storage.getItem('setting_aemet_alerts', true).then(setAemetAlerts);

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((res) => {
        setGeoPermission(res.state);
        res.onchange = () => setGeoPermission(res.state);
      }).catch(() => {});
    }
  }, []);

  const toggleAemetAlerts = async () => {
    const val = !aemetAlerts;
    setAemetAlerts(val);
    await storage.setItem('setting_aemet_alerts', val);
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Las notificaciones push no están soportadas en este navegador.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === 'granted') {
        new Notification('ClimaCanarias', {
          body: 'Notificaciones y avisos meteorológicos activados correctamente.',
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      console.error('Error solicitando permisos de notificación', err);
    }
  };

  const handleTriggerGps = () => {
    if (onLocateUser) {
      setIsLocating(true);
      onLocateUser();
      setTimeout(() => setIsLocating(false), 2000);
    }
  };

  if (!isOpen) return null;

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
          className={`relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[28px] shadow-2xl p-6 ${
            activeDarkMode ? 'bg-[#1b2025] text-white border border-white/10' : 'bg-white text-slate-900'
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold">Ajustes</h2>
            <button onClick={onClose} className={`p-2 rounded-full ${activeDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Sección: Sincronización y Cuenta */}
            <div>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-3 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>Sincronización</h3>
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Google / Firebase</div>
                    <div className={`text-[10px] ${activeDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {isAuthenticated ? 'Conectado y sincronizando' : 'No conectado'}
                    </div>
                  </div>
                </div>
                {isAuthenticated ? (
                  <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors" title="Cerrar sesión">
                    <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={onLogin} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="Iniciar sesión">
                    <LogIn className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sección: Gestión de Permisos */}
            <div>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#004993]'}`}>
                <ShieldCheck className="w-4 h-4" />
                Gestión de Permisos
              </h3>
              <div className="space-y-3">
                {/* Permiso Geolocalización */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Geolocalización GPS</div>
                      <div className={`text-[10px] font-mono ${
                        geoPermission === 'granted' ? 'text-emerald-500 font-bold' : activeDarkMode ? 'text-white/60' : 'text-slate-500'
                      }`}>
                        {geoPermission === 'granted' ? 'Permiso concedido' : geoPermission === 'denied' ? 'Acceso denegado' : 'Pendiente / Consulta'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerGps}
                    disabled={isLocating}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeDarkMode 
                        ? 'bg-[#ffd600] text-black hover:bg-[#ffe066]' 
                        : 'bg-[#004993] text-white hover:bg-[#003875]'
                    }`}
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    {isLocating ? 'Obteniendo...' : 'Localizar'}
                  </button>
                </div>

                {/* Permiso Notificaciones */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Notificaciones del Sistema</div>
                      <div className={`text-[10px] font-mono ${
                        notificationPermission === 'granted' ? 'text-emerald-500 font-bold' : activeDarkMode ? 'text-white/60' : 'text-slate-500'
                      }`}>
                        {notificationPermission === 'granted' ? 'Permiso activo' : notificationPermission === 'denied' ? 'Bloqueado por navegador' : 'No solicitado'}
                      </div>
                    </div>
                  </div>
                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNotificationPermission}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        activeDarkMode 
                          ? 'bg-white/10 hover:bg-white/20 text-white' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      }`}
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Preferencias */}
            <div>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-3 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>Preferencias</h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Unidades de Temperatura</div>
                      <div className={`text-[10px] ${activeDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Celsius o Fahrenheit</div>
                    </div>
                  </div>
                  <div className={`flex items-center rounded-full p-1 border text-xs font-mono ${
                    activeDarkMode ? 'border-white/10 bg-[#1e2227]' : 'border-slate-200 bg-white'
                  }`}>
                    <button
                      onClick={() => setTempUnit('C')}
                      className={`px-3 py-1 rounded-full transition-all text-xs font-bold ${
                        tempUnit === 'C' ? (activeDarkMode ? 'bg-[#ffd600] text-[#1a1600]' : 'bg-[#f5cf00] text-[#1a1600]') : 'text-slate-500'
                      }`}
                    >
                      °C
                    </button>
                    <button
                      onClick={() => setTempUnit('F')}
                      className={`px-3 py-1 rounded-full transition-all text-xs font-bold ${
                        tempUnit === 'F' ? (activeDarkMode ? 'bg-[#ffd600] text-[#1a1600]' : 'bg-[#f5cf00] text-[#1a1600]') : 'text-slate-500'
                      }`}
                    >
                      F
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-[#ffd600]/20 text-[#ffd600]' : 'bg-amber-100 text-amber-600'}`}>
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Modo Noche</div>
                      <div className={`text-[10px] ${activeDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Automático, Claro u Oscuro</div>
                    </div>
                  </div>
                  <select 
                    value={darkModeSetting}
                    onChange={(e) => setDarkModeSetting(e.target.value as 'auto' | 'dark' | 'light')}
                    className={`bg-transparent border rounded-lg p-1 text-sm font-mono outline-none ${
                      activeDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="auto">Auto</option>
                    <option value="dark">Oscuro</option>
                    <option value="light">Claro</option>
                  </select>
                </div>

                {/* Alertas AEMET */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Alertas AEMET</div>
                      <div className={`text-[10px] ${activeDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Avisos oficiales de Canarias</div>
                    </div>
                  </div>
                  <button onClick={toggleAemetAlerts} className={`w-12 h-6 rounded-full relative transition-colors ${aemetAlerts ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${aemetAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sección: Información & Créditos */}
            <div>
              <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${activeDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">ClimaCanarias</div>
                      <div className={`text-[10px] ${activeDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Versión 2.4.1 (Stable)</div>
                    </div>
                  </div>
                </div>
                <div className={`pt-2 border-t text-xs flex items-center gap-1.5 font-medium ${activeDarkMode ? 'border-white/10 text-white/70' : 'border-slate-200 text-slate-600'}`}>
                  <span>Desarrollado con 💛 por</span>
                  <span className={`font-bold ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#004993]'}`}>Aitor Santana</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

