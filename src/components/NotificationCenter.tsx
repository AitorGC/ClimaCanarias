/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  // Sync initial notification API status
  useEffect(() => {
    if ('Notification' in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  // Request native browser Push Notification permissions
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
        
        // Show actual push notification
        new Notification('Clima en Tiempo Real', {
          body: 'Notificaciones activadas para alertas del tiempo.',
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      console.error('Error requesting notifications permission', err);
    }
  };

  // Trigger high accuracy Geolocation capturing to personalize forecasts & push alerts
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

        // Match current coordinates to closest city in our predefined database as an elegant snap
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

        // Resolve user custom location representation
        const resolvedUserCity: City = {
          id: 'user-geolocated',
          name: `Mi Ubicación (${closestCity.name})`,
          lat: parseFloat(latitude.toFixed(4)),
          lon: parseFloat(longitude.toFixed(4)),
          country: closestCity.country,
          state: 'Coordenadas Geográficas',
        };

        onGrantGeolocation(resolvedUserCity);

        // Add custom greeting notification
        const geoSuccessMsg: NotificationMessage = {
          id: `geo-loc-${Date.now()}`,
          title: '📍 Localización Sincronizada',
          body: `Se ha detectado tu ubicación actual en la zona de ${closestCity.name}. Mostrando el pronóstico local.`,
          type: 'info',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        onAddNotification(geoSuccessMsg);

        // Attempt push notification trigger
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

        // Fallback alert message inside panel
        onAddNotification({
          id: `geo-err-${Date.now()}`,
          title: '⚠️ Aviso de Localización',
          body: 'No pudimos acceder a las coordenadas del GPS. El servicio utiliza Madrid como base de localización predeterminada.',
          type: 'alert',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Simulate push based on relative coordinate location
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

    // Browser native trigger
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Aviso Meteorológico Activo', {
        body: 'Atención: Lluvias moderadas o tormentas se desplazan hacia tu localidad.',
      });
    }
  };

  return (
    <div id="notify-hub-pane" className={`rounded-[24px] p-5 flex flex-col h-full backdrop-blur-md transition-all duration-300 ${
      activeDarkMode 
        ? 'bg-white/5 border border-white/5 text-white' 
        : 'bg-[#ffffff] border border-slate-200/80 text-slate-800 shadow-xl shadow-brand-blue/2'
    }`}>
      <div className={`flex justify-between items-center border-b pb-3 mb-4 ${
        activeDarkMode ? 'border-white/5' : 'border-slate-100'
      }`}>
        <div>
          <h3 className={`font-display font-light text-sm flex items-center gap-2 ${
            activeDarkMode ? 'text-white' : 'text-brand-blue font-bold'
          }`}>
            <Bell className="w-4 h-4 text-emerald-500 animate-pulse" />
            Alertas y Ubicación
          </h3>
          <p className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 ${
            activeDarkMode ? 'text-white/45' : 'text-slate-400'
          }`}>
            AVISOS EN TIEMPO REAL
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            id="notify-btn-clear"
            onClick={onClearNotifications}
            className={`text-[10px] font-mono transition ${
              activeDarkMode 
                ? 'text-white/40 hover:text-white hover:underline' 
                : 'text-brand-blue hover:text-brand-blue-hover hover:underline'
            }`}
          >
            LIMPIAR HISTORIAL
          </button>
        )}
      </div>

      {/* Push authorization status banner */}
      <div className="space-y-3 mb-4">
        <div className={`rounded-[18px] p-3 border flex items-center justify-between gap-3 align-middle transition duration-300 ${
          activeDarkMode ? 'bg-white/5 border-white/5' : 'bg-blue-50/20 border-brand-blue/10 shadow-xs'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`p-1.5 rounded-lg mt-0.5 ${
              activeDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {notifyPermission === 'granted' ? <Bell className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
            <div>
              <span className={`text-xs font-light block ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>Alertas en tu Dispositivo</span>
              <span className={`text-[10px] block mt-0.5 ${activeDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                {notifyPermission === 'granted' 
                  ? 'Permitido • Recibirás avisos importantes al instante' 
                  : 'Desactivado • Requiere activar la opción'}
              </span>
            </div>
          </div>
          <button
            id="notify-btn-req-push"
            onClick={handleRequestPushPermission}
            disabled={notifyPermission === 'granted'}
            className={`px-3 py-1 rounded-xl font-mono text-[9px] font-semibold transition-all duration-300 ${
              notifyPermission === 'granted'
                ? activeDarkMode
                  ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                : activeDarkMode
                  ? 'bg-white text-black hover:bg-white/90 cursor-pointer'
                  : 'bg-brand-blue text-white hover:bg-brand-blue-hover cursor-pointer shadow-3xs'
            }`}
          >
            {notifyPermission === 'granted' ? 'ACTIVO' : 'PERMITIR'}
          </button>
        </div>

        {/* GPS Geolocation Banner */}
        <div className={`rounded-[18px] p-3 border flex items-center justify-between gap-3 align-middle transition duration-300 ${
          activeDarkMode ? 'bg-white/5 border-white/5' : 'bg-blue-50/20 border-brand-blue/10 shadow-xs'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`p-1.5 rounded-lg mt-0.5 ${
              activeDarkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-xs font-light block ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>Ubicar clima por GPS</span>
              <span className={`text-[10px] block mt-0.5 ${activeDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                {geoTracking ? 'Buscando señal GPS...' : 'Ver el pronóstico de tu localidad actual'}
              </span>
            </div>
          </div>
          <button
            id="notify-btn-req-gps"
            onClick={handleTriggerGeolocation}
            disabled={geoTracking}
            className={`px-3 py-1 rounded-xl font-mono text-[9px] font-semibold transition duration-300 cursor-pointer ${
              activeDarkMode ? 'bg-white hover:bg-white/90 text-black' : 'bg-brand-blue hover:bg-brand-blue-hover text-white shadow-3xs'
            }`}
          >
            {geoTracking ? 'LEYENDO...' : 'LOCALIZAR GPS'}
          </button>
        </div>

        {geoError && (
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 leading-snug font-mono text-[10px] ${
            activeDarkMode 
              ? 'bg-red-500/10 border-red-500/15 text-red-300' 
              : 'bg-red-50 border-red-200/60 text-red-850'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{geoError}</span>
          </div>
        )}
      </div>

      {/* Notifications history monitor */}
      <div className="flex-1 flex flex-col items-stretch max-h-[220px] md:max-h-[260px]">
        <span className={`text-[9px] font-mono block mb-2 uppercase tracking-widest ${
          activeDarkMode ? 'text-white/45' : 'text-slate-400'
        }`}>HISTORIAL DE AVISOS RECIBIDOS</span>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className={`h-full flex flex-col justify-center items-center py-6 text-center border border-dashed rounded-2xl ${
              activeDarkMode ? 'border-white/10' : 'border-slate-200 bg-slate-50/50'
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
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`p-3 rounded-2xl border text-xs leading-normal flex items-start gap-2.5 transition duration-300 ${
                    msg.type === 'storm'
                      ? activeDarkMode
                        ? 'bg-red-500/10 border-red-500/15 text-white'
                        : 'bg-red-50 border-red-100 text-red-950'
                      : msg.type === 'alert'
                      ? activeDarkMode
                        ? 'bg-amber-500/10 border-amber-500/15 text-white'
                        : 'bg-amber-50 border-amber-100 text-amber-950'
                      : activeDarkMode
                        ? 'bg-white/5 border border-white/5 text-white/90'
                        : 'bg-slate-50 border border-slate-100 text-slate-800'
                  }`}
                >
                  <div className="pt-0.5 text-xs shrink-0 select-none">
                    {msg.type === 'storm' && <span className="text-red-500">⚡</span>}
                    {msg.type === 'alert' && <span className="text-amber-500">⚠️</span>}
                    {msg.type === 'info' && <span className="text-sky-500">✨</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`font-semibold text-[11px] leading-tight block ${
                        activeDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>{msg.title}</span>
                      <span className={`text-[8px] font-mono shrink-0 ${
                        activeDarkMode ? 'text-white/30' : 'text-slate-400'
                      }`}>{msg.timestamp}</span>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 leading-snug font-light ${
                      activeDarkMode ? 'text-white/60' : 'text-slate-600'
                    }`}>{msg.body}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Manual push simulator */}
      <div className={`border-t pt-3 mt-3 ${activeDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
        <button
          id="notify-btn-sim-push"
          onClick={handleSimulateLocalPush}
          className={`w-full py-2 flex justify-center items-center gap-1.5 border rounded-xl text-[10px] font-mono font-medium transition duration-300 cursor-pointer ${
            activeDarkMode
              ? 'border-white/10 hover:border-white/20 hover:bg-white/10 text-white/90'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeDarkMode ? 'text-white/70' : 'text-slate-500'}`} />
          PROBAR AVISO DE TIEMPO IMAGINARIO
        </button>
      </div>
    </div>
  );
}
