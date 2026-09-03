import { useState, useEffect } from 'react';
import { Bell, BellOff, MapPin, Eye, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationMessage, City } from '../types';
import { PREDEFINED_CITIES } from './FavoriteCitiesManager';

interface NotificationCenterProps {
  notifications: NotificationMessage[];
  onAddNotification: (msg: NotificationMessage) => void;
  onClearNotifications: () => void;
  onGrantGeolocation: (city: City) => void;
  activeDarkMode?: boolean;
}

export default function NotificationCenter({
  notifications,
  onAddNotification,
  onClearNotifications,
  onGrantGeolocation,
  activeDarkMode = true,
}: NotificationCenterProps) {
  const [notifyPermission, setNotifyPermission] = useState<string>('default');
  const [geoTracking, setGeoTracking] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Las notificaciones push no están soportadas por este explorador.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifyPermission(permission);
      
      if (permission === 'granted') {
        const initialMsg: NotificationMessage = {
          id: `push-permit-${Date.now()}`,
          title: '¡Notificaciones habilitadas!',
          body: 'Ya puedes recibir avisos del tiempo en tiempo real directamente en tu navegador.',
          type: 'info',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        onAddNotification(initialMsg);
        
        new Notification('Clima en Tiempo Real', {
          body: 'Notificaciones activadas para alertas del tiempo.',
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      console.error('Error requesting notifications permission', err);
    }
  };

  const handleTriggerGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('La geolocalización no está soportada por su navegador.');
      return;
    }

    setGeoTracking(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoTracking(false);

        let closestCity = PREDEFINED_CITIES[0];
        let minDistance = Infinity;

        PREDEFINED_CITIES.forEach((city) => {
          const latDiff = city.lat - latitude;
          const lonDiff = city.lon - longitude;
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
          if (distance < minDistance) {
            minDistance = distance;
            closestCity = city;
          }
        });

        const resolvedUserCity: City = {
          id: 'user-geolocated',
          name: `Mi Ubicación (${closestCity.name})`,
          lat: parseFloat(latitude.toFixed(4)),
          lon: parseFloat(longitude.toFixed(4)),
          country: closestCity.country,
          state: 'Coordenadas Geográficas',
        };

        onGrantGeolocation(resolvedUserCity);

        const geoSuccessMsg: NotificationMessage = {
          id: `geo-loc-${Date.now()}`,
          title: '📍 Localización Sincronizada',
          body: `Se ha detectado tu ubicación actual en la zona de ${closestCity.name}. Mostrando el pronóstico local.`,
          type: 'info',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        onAddNotification(geoSuccessMsg);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('📍 Ubicación Sincronizada', {
            body: `Clima y avisos sintonizados para tu zona en ${closestCity.name}.`,
          });
        }
      },
      (error) => {
        setGeoTracking(false);
        console.warn('Geolocation capture failed', error);
        
        let errorMsg = 'Error al obtener la ubicación. Compruebe los permisos de su dispositivo.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso denegado por el usuario. Permita el acceso al GPS para recibir avisos adaptados.';
        }
        setGeoError(errorMsg);

        onAddNotification({
          id: `geo-err-${Date.now()}`,
          title: '⚠️ Aviso de Localización',
          body: 'No pudimos acceder a las coordenadas del GPS.',
          type: 'alert',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSimulateLocalPush = () => {
    const pushMsg: NotificationMessage = {
      id: `push-sim-${Date.now()}`,
      title: '🚨 Aviso Meteorológico Activo',
      body: 'Atención: Se aproxima una zona de lluvias o tormentas a tu localidad en las próximas horas.',
      type: 'storm',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    onAddNotification(pushMsg);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Aviso Meteorológico Activo', {
        body: 'Atención: Lluvias moderadas o tormentas se desplazan hacia tu localidad.',
      });
    }
  };

  return (
    <div id="notify-hub-pane" className={`rounded-[28px] p-5 md:p-6 flex flex-col h-full backdrop-blur-md transition-all duration-300 md-card border ${
      activeDarkMode 
        ? 'bg-[#1e2227] border-white/10 text-[#e8e5d8]' 
        : 'bg-[#fffef7] border-amber-200/70 text-[#1c1c18] shadow-lg shadow-amber-500/5'
    }`}>
      <div className={`flex justify-between items-center border-b pb-3 mb-4 ${
        activeDarkMode ? 'border-white/10' : 'border-amber-200/80'
      }`}>
        <div>
          <h3 className={`font-display font-bold text-sm flex items-center gap-2 ${
            activeDarkMode ? 'text-[#ffd600]' : 'text-slate-900'
          }`}>
            <Bell className="w-4 h-4 text-[#f5cf00] animate-pulse" />
            Alertas y Ubicación
          </h3>
          <p className={`text-[10px] font-mono font-semibold uppercase tracking-wider mt-0.5 ${
            activeDarkMode ? 'text-white/45' : 'text-slate-500'
          }`}>
            AVISOS EN TIEMPO REAL
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            id="notify-btn-clear"
            type="button"
            onClick={onClearNotifications}
            className={`text-[10px] font-mono font-bold transition ${
              activeDarkMode 
                ? 'text-[#ffd600]/80 hover:text-[#ffd600]' 
                : 'text-amber-900 hover:text-black'
            }`}
          >
            LIMPIAR
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {/* Push status banner */}
        <div className={`rounded-2xl p-3 border flex items-center justify-between gap-3 ${
          activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-200 shadow-2xs'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`p-2 rounded-full mt-0.5 ${
              activeDarkMode ? 'bg-[#ffd600]/20 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
            }`}>
              {notifyPermission === 'granted' ? <Bell className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
            <div>
              <span className={`text-xs font-semibold block ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>Alertas Push</span>
              <span className={`text-[10px] block mt-0.5 ${activeDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                {notifyPermission === 'granted' 
                  ? 'Permitido • Recibirás avisos importantes' 
                  : 'Desactivado • Requiere permiso'}
              </span>
            </div>
          </div>
          <button
            id="notify-btn-req-push"
            type="button"
            onClick={handleRequestPushPermission}
            disabled={notifyPermission === 'granted'}
            className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all ${
              notifyPermission === 'granted'
                ? activeDarkMode
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : activeDarkMode
                  ? 'bg-[#ffd600] text-[#1a1600] hover:bg-[#ffe066] cursor-pointer shadow-xs'
                  : 'bg-[#f5cf00] text-[#1a1600] hover:bg-[#e0bd00] cursor-pointer shadow-xs'
            }`}
          >
            {notifyPermission === 'granted' ? 'ACTIVO' : 'PERMITIR'}
          </button>
        </div>

        {/* GPS Geolocation Banner */}
        <div className={`rounded-2xl p-3 border flex items-center justify-between gap-3 ${
          activeDarkMode ? 'bg-[#14171a] border-white/10' : 'bg-white border-amber-200 shadow-2xs'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`p-2 rounded-full mt-0.5 ${
              activeDarkMode ? 'bg-[#ffd600]/20 text-[#ffd600]' : 'bg-amber-100 text-amber-900'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-xs font-semibold block ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>Clima por GPS</span>
              <span className={`text-[10px] block mt-0.5 ${activeDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                {geoTracking ? 'Buscando señal GPS...' : 'Sintonizar tu ubicación'}
              </span>
            </div>
          </div>
          <button
            id="notify-btn-req-gps"
            type="button"
            onClick={handleTriggerGeolocation}
            disabled={geoTracking}
            className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] font-bold transition cursor-pointer ${
              activeDarkMode ? 'bg-[#ffd600] hover:bg-[#ffe066] text-[#1a1600] shadow-xs' : 'bg-[#f5cf00] hover:bg-[#e0bd00] text-[#1a1600] shadow-xs'
            }`}
          >
            {geoTracking ? 'LEYENDO...' : 'LOCALIZAR'}
          </button>
        </div>

        {geoError && (
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 font-mono text-[10px] ${
            activeDarkMode 
              ? 'bg-red-500/10 border-red-500/20 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{geoError}</span>
          </div>
        )}
      </div>

      {/* Notifications history */}
      <div className="flex-1 flex flex-col items-stretch max-h-[220px] md:max-h-[260px]">
        <span className={`text-[9px] font-mono font-bold block mb-2 uppercase tracking-wider ${
          activeDarkMode ? 'text-white/40' : 'text-[#50606e]'
        }`}>HISTORIAL DE AVISOS RECIBIDOS</span>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {notifications.length === 0 ? (
            <div className={`h-full flex flex-col justify-center items-center py-6 text-center border border-dashed rounded-2xl ${
              activeDarkMode ? 'border-white/10' : 'border-slate-300/80 bg-white/40'
            }`}>
              <BellOff className={`w-5 h-5 mb-1 ${activeDarkMode ? 'text-white/20' : 'text-slate-300'}`} />
              <p className={`text-[10px] italic ${activeDarkMode ? 'text-white/40' : 'text-slate-400'}`}>No hay mensajes entrantes</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((msg) => (
                <motion.div
                  key={msg.id}
                  id={`notification-log-row-${msg.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition ${
                    msg.type === 'storm'
                      ? activeDarkMode
                        ? 'bg-red-500/10 border-red-500/20 text-white'
                        : 'bg-red-50 border-red-200 text-red-950'
                      : msg.type === 'alert'
                      ? activeDarkMode
                        ? 'bg-amber-500/10 border-amber-500/20 text-white'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                      : activeDarkMode
                        ? 'bg-[#262a30] border-white/5 text-white/90'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="pt-0.5 text-xs shrink-0 select-none">
                    {msg.type === 'storm' && <span className="text-red-500">⚡</span>}
                    {msg.type === 'alert' && <span className="text-amber-500">⚠️</span>}
                    {msg.type === 'info' && <span className="text-[#00639a] dark:text-[#91cdff]">✨</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`font-bold text-[11px] leading-tight block ${
                        activeDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>{msg.title}</span>
                      <span className={`text-[8px] font-mono shrink-0 ${
                        activeDarkMode ? 'text-white/30' : 'text-slate-400'
                      }`}>{msg.timestamp}</span>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 leading-snug ${
                      activeDarkMode ? 'text-white/60' : 'text-slate-600'
                    }`}>{msg.body}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className={`border-t pt-3 mt-3 ${activeDarkMode ? 'border-white/10' : 'border-slate-300/60'}`}>
        <button
          id="notify-btn-sim-push"
          type="button"
          onClick={handleSimulateLocalPush}
          className={`w-full py-2 flex justify-center items-center gap-1.5 border border-dashed rounded-full text-[10px] font-mono font-semibold transition cursor-pointer ${
            activeDarkMode
              ? 'border-white/20 hover:border-[#91cdff] bg-white/5 text-[#91cdff]'
              : 'border-[#00639a]/30 hover:border-[#00639a] bg-white text-[#00639a]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          PROBAR AVISO DE TIEMPO IMAGINARIO
        </button>
      </div>
    </div>
  );
}
