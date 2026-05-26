/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Sun, Moon, Compass, Wind, Droplets, Thermometer, Compass as PressureIcon, 
  MapPin, LogOut, RefreshCw, AlertTriangle, ShieldCheck, WifiOff, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db, auth, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { City, CurrentWeather, NotificationMessage, WeatherCondition } from './types';
import { fetchWeather } from './weatherService';
import WeatherAnimations from './components/WeatherAnimations';
import FavoriteCitiesManager, { PREDEFINED_CITIES } from './components/FavoriteCitiesManager';
import NotificationCenter from './components/NotificationCenter';
import TrendChart from './components/TrendChart';
import AirQualityIndicator from './components/AirQualityIndicator';

// Default cities seed (Canarias capitals & major spots)
const DEFAULT_FAVORITES: City[] = [
  PREDEFINED_CITIES[0], // Las Palmas de GC
  PREDEFINED_CITIES[1], // Santa Cruz de Tenerife
  PREDEFINED_CITIES[2], // La Laguna
  PREDEFINED_CITIES[3], // Arrecife
];

export default function App() {
  // Core user favorites and city preferences
  const [favorites, setFavorites] = useState<City[]>(() => {
    const local = localStorage.getItem('climatiempo_favorites');
    return local ? JSON.parse(local) : DEFAULT_FAVORITES;
  });
  
  const [currentCity, setCurrentCity] = useState<City>(() => {
    const local = localStorage.getItem('climatiempo_current_city');
    return local ? JSON.parse(local) : PREDEFINED_CITIES[0]; // Las Palmas de GC
  });

  // Weather and UI states
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
    const local = localStorage.getItem('climatiempo_temp_unit');
    return (local as 'C' | 'F') || 'C';
  });
  
  const [darkModeSetting, setDarkModeSetting] = useState<'auto' | 'dark' | 'light'>(() => {
    const local = localStorage.getItem('climatiempo_dark_setting');
    return (local as 'auto' | 'dark' | 'light') || 'auto';
  });

  const [notifications, setNotifications] = useState<NotificationMessage[]>(() => {
    const local = localStorage.getItem('climatiempo_notifications');
    return local ? JSON.parse(local) : [];
  });

  // Fetching, offline and synchronization states
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Auth statuses
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);

  // Reference to prevent writing before initial cloud load finishes
  const isCloudLoadFinishedRef = useRef(false);

  // Track online/offline statuses
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatic hour evaluation to activate battery-saving pure black dark mode
  const [isNightTime, setIsNightTime] = useState(false);

  useEffect(() => {
    const evaluateNightTime = () => {
      const hour = new Date().getHours();
      setIsNightTime(hour >= 20 || hour < 7);
    };
    evaluateNightTime();
    // Re-evaluate every 10 minutes
    const interval = setInterval(evaluateNightTime, 600000);
    return () => clearInterval(interval);
  }, []);

  // Apply dark/light classes to body or relative wrappers
  const activeDarkMode = 
    darkModeSetting === 'dark' || 
    (darkModeSetting === 'auto' && isNightTime);

  // Sync state data structures with localStorage caches
  useEffect(() => {
    localStorage.setItem('climatiempo_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('climatiempo_current_city', JSON.stringify(currentCity));
  }, [currentCity]);

  useEffect(() => {
    localStorage.setItem('climatiempo_temp_unit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('climatiempo_dark_setting', darkModeSetting);
  }, [darkModeSetting]);

  useEffect(() => {
    localStorage.setItem('climatiempo_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Auth synchronization listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        
        // Fetch existing cloud profiles from Firestore Database
        const userRef = doc(db, 'user_preferences', user.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('[Cloud Sync] Loaded user preferences from Firestore: ', data);
            
            if (data.cities) setFavorites(data.cities);
            if (data.tempUnit) setTempUnit(data.tempUnit);
            if (data.darkModeSetting) setDarkModeSetting(data.darkModeSetting);
          } else {
            // First time registration: create cloud document matching existing settings
            const initialPref = {
              ownerId: user.uid,
              cities: favorites,
              notificationsEnabled: true,
              tempUnit: tempUnit,
              darkModeSetting: darkModeSetting,
              updatedAt: new Date(),
            };
            await setDoc(userRef, initialPref);
            console.log('[Cloud Sync] Initial user preferences document deployed for user ID:', user.uid);
          }
          isCloudLoadFinishedRef.current = true;
          setIsCloudLoaded(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `user_preferences/${user.uid}`);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        isCloudLoadFinishedRef.current = false;
        setIsCloudLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Write changes back to Firestore upon preferences updates (only if loaded & authenticated)
  useEffect(() => {
    if (isAuthenticated && currentUser && isCloudLoadFinishedRef.current) {
      const userRef = doc(db, 'user_preferences', currentUser.uid);
      const writePreferences = async () => {
        try {
          await setDoc(userRef, {
            ownerId: currentUser.uid,
            cities: favorites,
            notificationsEnabled: true,
            tempUnit: tempUnit,
            darkModeSetting: darkModeSetting,
            updatedAt: new Date(),
          });
          console.log('[Cloud Sync] Auto-synced preferences modification to cloud.');
        } catch (err) {
          console.error('Failed to sync changes with cloud database: ', err);
        }
      };
      // Debounce writing slightly to prevent rapid transaction cycles
      const timer = setTimeout(writePreferences, 1200);
      return () => clearTimeout(timer);
    }
  }, [favorites, tempUnit, darkModeSetting, isAuthenticated, currentUser]);

  // Handle fetching weather forecasts
  const getWeatherData = async (city: City) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const freshWeather = await fetchWeather(city);
      setWeather(freshWeather);
      
      // Inject new severe alerts into notifications center logging if any
      freshWeather.alerts.forEach((alert) => {
        setNotifications((prev) => {
          if (prev.some((msg) => msg.id === alert.id)) {
            return prev;
          }
          const alertMsg: NotificationMessage = {
            id: alert.id,
            title: alert.title,
            body: alert.description,
            type: alert.severity === 'severe' || alert.severity === 'extreme' ? 'storm' : 'alert',
            timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            read: false,
          };
          return [alertMsg, ...prev].slice(0, 30);
        });
      });

    } catch (err) {
      console.error('Weather fetching Error', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al descargar el pronóstico.');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch weather whenever city selection changes and automatically refresh every 15 minutes
  useEffect(() => {
    getWeatherData(currentCity);

    const refreshInterval = setInterval(() => {
      if (navigator.onLine) {
        console.log('[Auto Refresh] Updating weather statistics for:', currentCity.name);
        getWeatherData(currentCity);
      }
    }, 900000); // 15 minutes

    return () => clearInterval(refreshInterval);
  }, [currentCity]);

  // Auth interactions handles
  const handleAuthLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login action failed: ', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      
      if (err?.code === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setAuthError('El inicio de sesión mediante ventana de Google fue interrumpido o bloqueado por las restricciones de seguridad (sandbox) del iframe del navegador. Para iniciar sesión y sincronizar sus datos en la nube sin problemas, por favor abra el Radar Meteorológico en una pestaña independiente.');
      } else {
        setAuthError(`La autenticación en la nube ha fallado: ${errMsg}`);
      }
    }
  };

  const handleAuthLogout = async () => {
    try {
      if (confirm('¿Estás seguro de que deseas cerrar sesión y desconectar la nube?')) {
        await logout();
      }
    } catch (err) {
      console.error('Logout action failed: ', err);
    }
  };

  // Select city wrapper
  const handleSelectCity = (city: City) => {
    setCurrentCity(city);
  };

  // Favorite management callbacks
  const handleAddFavorite = (city: City) => {
    if (!favorites.some((fav) => fav.id === city.id)) {
      setFavorites((prev) => [city, ...prev]);
    }
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
    // If we delete the currently active city, snap to Madrid as safe recovery index
    if (currentCity.id === id) {
      setCurrentCity(PREDEFINED_CITIES[0]);
    }
  };

  const handleAddNotificationMessage = (msg: NotificationMessage) => {
    setNotifications((prev) => [msg, ...prev].slice(0, 30));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const formatTemperature = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return (
    <div id="app-root-wrapper" className={`min-h-screen font-sans flex flex-col justify-start items-stretch select-none selection:bg-brand-blue/10 transition-colors duration-500 ${
      activeDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-slate-900'
    }`}>
      {/* 1. APP HEADER PANEL */}
      <header id="main-header" className={`border-b px-5 py-4 md:py-6 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
        activeDarkMode 
          ? 'border-white/10 bg-black/85 text-white' 
          : 'border-brand-yellow-hover bg-brand-yellow text-brand-blue shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-stretch md:items-end gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <MapPin className={`w-6 h-6 shrink-0 ${activeDarkMode ? 'text-white/80' : 'text-brand-blue'}`} />
              <h1 className={`font-display text-3xl md:text-4xl tracking-tight leading-none ${
                activeDarkMode ? 'text-white' : 'text-brand-blue font-bold'
              }`}>
                {currentCity.name}, {currentCity.country === 'España' || currentCity.country === 'Spain' ? 'ES' : currentCity.country === 'Reino Unido' || currentCity.country === 'United Kingdom' ? 'UK' : currentCity.country.slice(0, 2).toUpperCase()}
              </h1>
            </div>
            <p className={`text-[11px] md:text-xs font-mono uppercase tracking-widest mt-2 ${
              activeDarkMode ? 'text-white/40' : 'text-brand-blue/80 font-bold'
            }`}>
              {weather ? `${new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'short', day: 'numeric' })} • ${weather.time}` : 'VIGILANCIA METEOROLÓGICA REGIONAL'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 md:gap-6">
            {/* Connection status matches the Design HTML style */}
            <div className="flex flex-col items-start md:items-end">
              <span className={`text-[10px] uppercase tracking-widest font-semibold ${
                activeDarkMode ? 'text-white/30' : 'text-brand-blue/70'
              }`}>Estado del Radar</span>
              <span className={`text-xs flex items-center gap-1.5 font-mono ${
                activeDarkMode 
                  ? isOnline ? 'text-green-500' : 'text-amber-500 animate-pulse'
                  : isOnline ? 'text-brand-blue font-bold' : 'text-red-700 font-bold animate-pulse'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeDarkMode
                    ? isOnline ? 'bg-green-500' : 'bg-amber-500'
                    : isOnline ? 'bg-[#004993]' : 'bg-red-600'
                }`}></span>
                {isOnline ? 'Sincronizado • Tiempo Real' : 'Caché • Modo Local'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Unit toggler - beautiful thin circles */}
              <div className={`flex items-center rounded-full p-0.5 border text-xs font-mono transition-colors duration-300 ${
                activeDarkMode ? 'border-white/10 bg-white/5' : 'border-brand-blue/30 bg-brand-blue/10'
              }`}>
                <button
                  id="unit-toggle-c"
                  onClick={() => setTempUnit('C')}
                  className={`px-3 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                    tempUnit === 'C'
                      ? activeDarkMode ? 'bg-white text-black font-semibold' : 'bg-brand-blue text-white font-semibold'
                      : activeDarkMode ? 'text-white/50 hover:text-white' : 'text-brand-blue hover:text-brand-blue-hover font-semibold'
                  }`}
                >
                  °C
                </button>
                <button
                  id="unit-toggle-f"
                  onClick={() => setTempUnit('F')}
                  className={`px-3 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                    tempUnit === 'F'
                      ? activeDarkMode ? 'bg-white text-black font-semibold' : 'bg-brand-blue text-white font-semibold'
                      : activeDarkMode ? 'text-white/50 hover:text-white' : 'text-brand-blue hover:text-brand-blue-hover font-semibold'
                  }`}
                >
                  °F
                </button>
              </div>

              {/* Theme Settings controller - high elegance layout */}
              <div className={`flex items-center rounded-full p-0.5 border text-xs font-mono transition-colors duration-300 ${
                activeDarkMode ? 'border-white/10 bg-white/5' : 'border-brand-blue/30 bg-brand-blue/10'
              }`}>
                <button
                  id="theme-toggle-auto"
                  onClick={() => setDarkModeSetting('auto')}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-semibold transition cursor-pointer ${
                    darkModeSetting === 'auto'
                      ? activeDarkMode 
                        ? 'bg-zinc-800 text-white border border-white/15' 
                        : 'bg-brand-blue text-white shadow-3xs'
                      : activeDarkMode ? 'text-white/40 hover:text-white/80' : 'text-brand-blue/70 hover:text-brand-blue font-semibold'
                  }`}
                  title="Ahorro automático de batería nocturna"
                >
                  AUTO
                </button>
                <button
                  id="theme-toggle-dark"
                  onClick={() => setDarkModeSetting('dark')}
                  className={`p-1.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                    darkModeSetting === 'dark' 
                      ? activeDarkMode ? 'bg-white text-black' : 'bg-brand-blue text-white' 
                      : activeDarkMode ? 'text-white/40 hover:text-white/80' : 'text-brand-blue/70 hover:text-brand-blue'
                  }`}
                  title="Fondo Oscuro Sofisticado"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  id="theme-toggle-light"
                  onClick={() => setDarkModeSetting('light')}
                  className={`p-1.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                    darkModeSetting === 'light' 
                      ? activeDarkMode ? 'bg-white text-black' : 'bg-brand-blue text-white' 
                      : activeDarkMode ? 'text-white/40 hover:text-white/80' : 'text-brand-blue/70 hover:text-brand-blue'
                  }`}
                  title="Fondo Claro"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cloud Sync Auth section */}
              {isAuthenticated ? (
                <div id="user-info-card" className={`flex items-center gap-2 border px-3 py-1 rounded-full text-xs transition duration-300 ${
                  activeDarkMode ? 'border-white/10 bg-white/5' : 'border-brand-blue/30 bg-brand-blue/10'
                }`}>
                  <div className={`w-4 h-4 rounded-full font-bold flex items-center justify-center text-[9px] shrink-0 ${
                    activeDarkMode ? 'bg-white text-black' : 'bg-brand-blue text-white'
                  }`}>
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className={`hidden lg:block text-[10px] font-mono tracking-tight truncate max-w-[100px] ${
                    activeDarkMode ? 'text-white/80' : 'text-brand-blue/90 font-medium'
                  }`} title={currentUser.email}>
                    {currentUser.email}
                  </span>
                  <button
                    id="auth-logout-btn"
                    onClick={handleAuthLogout}
                    className={`pl-1 ml-1 transition cursor-pointer ${
                      activeDarkMode ? 'text-white/40 hover:text-red-400' : 'text-brand-blue/50 hover:text-red-650'
                    }`}
                    title="Desconectar"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  id="auth-login-btn"
                  onClick={handleAuthLogin}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md border ${
                    activeDarkMode 
                      ? 'bg-white text-black hover:bg-white/90 border-transparent' 
                      : 'bg-brand-blue hover:bg-brand-blue-hover text-white border-transparent'
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 animate-pulse ${activeDarkMode ? 'text-black' : 'text-white'}`} />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* 2. DYNAMIC BROADCAST EMERGENCY CARD STRIP IN COORD */}
      {weather && weather.alerts.length > 0 && (
        <div id="urgent-broadcast-ribbon" className="bg-red-500 text-white py-2 px-4 shadow-md z-15 relative animate-pulse flex items-center justify-center gap-2 border-b border-red-600">
          <AlertTriangle className="w-4 h-4 text-white shrink-0 animate-bounce" />
          <p className="text-xs font-medium tracking-tight text-center">
            {weather.alerts[0].title}. {weather.alerts[0].description} (Emitido por {weather.alerts[0].sender})
          </p>
        </div>
      )}

      {/* 3. BENTO GRID CONTAINER */}
      <main id="bento-grid-dashboard" className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 items-start w-full">
        {authError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`col-span-1 lg:col-span-3 border p-5 rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-300 ${
              activeDarkMode 
                ? 'bg-red-950/25 border-red-900/40 text-red-200' 
                : 'bg-red-50/90 border-red-200/50 text-red-900 shadow-sm'
            }`}
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-mono tracking-wider uppercase font-bold text-red-550">RESTRICCIÓN DE VISTA EMBEBIDA DE ARQUITECTURA (IFRAME)</h4>
                <p className="text-xs mt-1 leading-relaxed max-w-4xl opacity-90">
                  {authError}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 text-[11px] font-mono tracking-tight font-bold border rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  activeDarkMode
                    ? 'bg-red-900/40 hover:bg-amber-950/30 border-red-700/40 text-red-200'
                    : 'bg-white hover:bg-neutral-50 border-red-200 text-red-800'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Nueva Pestaña
              </a>
              <button
                onClick={() => setAuthError(null)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeDarkMode ? 'text-red-400 hover:text-red-300 bg-white/5' : 'text-red-700 hover:text-red-950 bg-red-100/50'
                }`}
              >
                Ignorar
              </button>
            </div>
          </motion.div>
        )}

        {/* UPPER BENTO COMPONENT: MAIN CURRENT TEMP (COL span-2) */}
        <div id="main-weatherview-section" className="col-span-1 lg:col-span-2 space-y-4">
          {/* Main detailed active weather card */}
          <motion.div
            id="primary-weather-focus-card"
            whileHover={{ 
              y: -4, 
              scale: 1.012,
              borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`relative rounded-[32px] p-6 md:p-8 overflow-hidden border backdrop-blur-md flex flex-col items-stretch justify-start min-h-[320px] ${
              activeDarkMode 
                ? 'border-white/10 bg-white/5 text-white' 
                : 'border-brand-blue/15 bg-white text-slate-900 shadow-xl shadow-brand-blue/5'
            }`}
          >
            {/* Ambient dynamic micro animation */}
            {weather && <WeatherAnimations condition={weather.condition} />}

            {/* Floating refresh button positioned absolute in the top right corner */}
            <button
              id="dashboard-weather-refresh"
              onClick={() => getWeatherData(currentCity)}
              disabled={isLoading}
              className={`absolute top-6 right-6 md:top-8 md:right-8 z-20 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-350 cursor-pointer disabled:opacity-50 ${
                activeDarkMode 
                  ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white' 
                  : 'border-brand-blue/25 hover:border-brand-blue/50 bg-blue-50/50 hover:bg-blue-50 text-brand-blue'
              }`}
              title="Actualizar clima"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Mid values section matching the Sophisticated Dark signature aesthetic exactly */}
            <div className="z-10 pt-2 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
              <div className="flex flex-col md:flex-row items-baseline md:items-end gap-4 md:gap-6">
                <span className={`text-[100px] md:text-[130px] font-display font-thin leading-none tracking-tighter select-all flex ${
                  activeDarkMode ? 'text-white' : 'text-brand-blue font-bold'
                }`}>
                  {weather ? formatTemperature(weather.temp).replace('°C', '').replace('°F', '') : '--'}
                  <span className={`text-4xl md:text-5xl font-extralight align-top mt-2 ${
                    activeDarkMode ? 'text-white/90' : 'text-brand-blue/80'
                  }`}>{tempUnit === 'C' ? '°' : '°F'}</span>
                </span>
                <div className="pb-2">
                  <p className={`text-2xl md:text-3xl font-display font-light capitalize ${
                    activeDarkMode ? 'text-white/90' : 'text-slate-800'
                  }`}>{weather ? weather.description : 'Cargando de red...'}</p>
                  {weather && (
                    <p className={`text-xs md:text-sm font-mono tracking-wide mt-1.5 duration-300 ${
                      activeDarkMode ? 'text-white/40' : 'text-slate-500 font-medium'
                    }`}>
                      Sensación térmica: {formatTemperature(weather.temp)} • Máx: {formatTemperature(weather.tempMax)} Mín: {formatTemperature(weather.tempMin)}
                    </p>
                  )}
                </div>
              </div>

              {weather && (
                <div className={`flex gap-2 font-mono text-[10px] uppercase tracking-wider ${
                  activeDarkMode ? 'text-white/40' : 'text-slate-500'
                }`}>
                  <span className={`px-2.5 py-1 rounded-lg border ${
                    activeDarkMode ? 'bg-white/5 border-white/5' : 'bg-brand-yellow/15 border-brand-yellow/50 text-brand-blue font-bold shadow-2xs'
                  }`}>
                    MÁX: {formatTemperature(weather.tempMax)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border ${
                    activeDarkMode ? 'bg-white/5 border-white/5' : 'bg-blue-50/50 border-brand-blue/30 text-brand-blue font-bold shadow-2xs'
                  }`}>
                    MÍN: {formatTemperature(weather.tempMin)}
                  </span>
                </div>
              )}
            </div>

            {/* High fidelity sensory metrics styled as professional studio instrument logs */}
            <div className={`mt-auto z-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-6 ${
              activeDarkMode ? 'border-white/10' : 'border-slate-150'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  activeDarkMode 
                    ? 'bg-white/5 border-white/10 text-white/70' 
                    : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                }`}>
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] block font-mono tracking-widest uppercase ${
                    activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'
                  }`}>HUMEDAD</span>
                  <span className={`text-base font-light block mt-0.5 ${
                    activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'
                  }`}>{weather ? `${weather.humidity}%` : '--'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  activeDarkMode 
                    ? 'bg-white/5 border-white/10 text-white/70' 
                    : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                }`}>
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] block font-mono tracking-widest uppercase ${
                    activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'
                  }`}>VIENTO</span>
                  <span className={`text-base font-light block mt-0.5 ${
                    activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'
                  }`}>{weather ? `${weather.windSpeed.toFixed(0)} km/h` : '--'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  activeDarkMode 
                    ? 'bg-white/5 border-white/10 text-white/70' 
                    : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                }`}>
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] block font-mono tracking-widest uppercase ${
                    activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'
                  }`}>ÍNDICE UV</span>
                  <span className={`text-base font-light block mt-0.5 ${
                    activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'
                  }`}>{weather ? `${weather.uvIndex.toFixed(0)}` : '--'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  activeDarkMode 
                    ? 'bg-white/5 border-white/10 text-white/70' 
                    : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                }`}>
                  <PressureIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] block font-mono tracking-widest uppercase ${
                    activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'
                  }`}>PRESIÓN</span>
                  <span className={`text-base font-light block mt-0.5 ${
                    activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'
                  }`}>{weather ? `${weather.pressure.toFixed(0)} hPa` : '--'}</span>
                </div>
              </div>
            </div>
          </motion.div>


          {/* SECCIONES ESPECIALIZADAS EN EL CLIMA DE CANARIAS */}
          <div className="space-y-4">
            {/* Sec 1. RESUMEN Y ALERTAS DE CONSENSO */}
            <motion.div
              whileHover={{ 
                y: -4, 
                scale: 1.012,
                borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[28px] p-6 border backdrop-blur-md ${
                activeDarkMode 
                  ? 'border-white/10 bg-gradient-to-br from-zinc-900/90 to-black text-white' 
                  : 'border-slate-205 bg-[#ffffff] text-slate-900 shadow-xl shadow-brand-blue/2'
              }`}
            >
              <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b pb-4 ${
                activeDarkMode ? 'border-white/10' : 'border-slate-100'
              }`}>
                <div>
                  <h3 className={`text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${
                    activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${activeDarkMode ? 'bg-teal-400' : 'bg-brand-yellow'}`}></span>
                    1. RESUMEN Y ALERTAS (CONSENSO REGIONAL)
                  </h3>
                  <p className={`text-[10.5px] mt-1 ${activeDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Acoplamiento unificado AEMET, OpenWeatherMap y Open-Meteo</p>
                </div>
                {weather?.indiceConfianza !== undefined && (
                  <div className={`border px-3 py-1.5 rounded-2xl flex items-center gap-2 ${
                    activeDarkMode ? 'bg-white/5 border-white/15' : 'bg-brand-yellow/20 border-brand-yellow/50 shadow-3xs'
                  }`}>
                    <span className={`text-[9px] font-mono tracking-wider uppercase ${activeDarkMode ? 'text-white/50' : 'text-brand-blue font-bold'}`}>ÍNDICE CONFIANZA:</span>
                    <span className={`text-xs font-bold font-mono ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-black'}`}>{weather.indiceConfianza}%</span>
                  </div>
                )}
              </div>

              {/* Frase General del Consenso */}
              <div className={`border rounded-2xl p-4 mb-6 ${
                activeDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-brand-yellow/15 border-brand-yellow/45 shadow-xs'
              }`}>
                <span className={`text-[9.5px] font-mono block mb-1 uppercase tracking-wider ${activeDarkMode ? 'text-white/40' : 'text-brand-blue/80 font-bold'}`}>PREVISIÓN DE CONSENSO</span>
                <p className={`text-sm font-semibold leading-relaxed ${activeDarkMode ? 'text-zinc-200' : 'text-slate-805'}`}>
                  {weather?.fraseGeneral || "Combinando modelos de previsión regional..."}
                </p>
              </div>

              {/* Tabla de Alertas AEMET */}
              <div>
                <span className={`text-[9.5px] font-mono block mb-3 uppercase tracking-wider ${activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'}`}>TABLA DE ALERTAS AEMET</span>
                
                {weather?.alertasAemet && weather.alertasAemet.length > 0 ? (
                  <div className={`overflow-x-auto rounded-xl border ${activeDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <table className={`w-full text-left text-xs border-collapse ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <thead>
                        <tr className={`border-b font-mono text-[9px] uppercase tracking-wider ${
                          activeDarkMode ? 'bg-white/5 border-white/10 text-white/50' : 'bg-blue-50/50 border-brand-blue/10 text-brand-blue/80'
                        }`}>
                          <th className="py-2 px-3 font-semibold">Nivel</th>
                          <th className="py-2 px-3 font-semibold text-center">Tipo</th>
                          <th className="py-2 px-3 font-semibold">Duración</th>
                          <th className="py-2 px-3 font-semibold">Detalle del Aviso</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${activeDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                        {weather.alertasAemet.map((al, idx) => {
                          const levelColor = 
                            al.nivel === 'Rojo' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                            al.nivel === 'Naranja' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' :
                            'text-brand-blue bg-brand-yellow/15 border-brand-yellow/30';

                          return (
                            <tr key={idx} className={`transition ${activeDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${levelColor}`}>
                                  {al.nivel}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-base">{al.icono}</td>
                              <td className={`py-2.5 px-3 text-[10.5px] font-light ${activeDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{al.duracion}</td>
                              <td className={`py-2.5 px-3 font-sans text-xs font-light leading-snug ${activeDarkMode ? 'text-white/95' : 'text-slate-805'}`}>{al.texto}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center py-6 border rounded-2xl text-center gap-1.5 ${
                    activeDarkMode 
                      ? 'bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-400' 
                      : 'bg-emerald-50/30 border-emerald-200/60 text-emerald-700'
                  }`}>
                    <span className="text-xl">☀️</span>
                    <span className="text-xs font-mono font-medium tracking-wide">Sin alertas activas</span>
                    <span className={`text-[10px] truncate ${activeDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Condiciones normales de seguridad en la ubicación</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sec 1.5. CALIDAD DEL AIRE (AQI) */}
            <motion.div
              whileHover={{ 
                y: -4, 
                scale: 1.012,
                borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[28px] p-6 border backdrop-blur-md ${
                activeDarkMode 
                  ? 'border-white/10 bg-zinc-900/95 text-white' 
                  : 'border-slate-205 bg-[#ffffff] text-slate-900 shadow-xl shadow-brand-blue/2'
              }`}
            >
              <AirQualityIndicator 
                aqi={weather?.aqi} 
                calimaRating={weather?.hourly6h && weather.hourly6h.length > 0 ? weather.hourly6h[0].calima : 'Bajo'}
                activeDarkMode={activeDarkMode} 
              />
            </motion.div>

            {/* Sec 1.6. GRÁFICO ESTÉTICO DE TENDENCIAS */}
            <motion.div
              whileHover={{ 
                y: -4, 
                scale: 1.012,
                borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[28px] p-6 border backdrop-blur-md ${
                activeDarkMode 
                  ? 'border-white/10 bg-zinc-900/95 text-white' 
                  : 'border-slate-205 bg-[#ffffff] text-slate-900 shadow-xl shadow-brand-blue/2'
              }`}
            >
              {weather?.hourly ? (
                <TrendChart 
                  hourly={weather.hourly} 
                  tempUnit={tempUnit} 
                  activeDarkMode={activeDarkMode} 
                />
              ) : (
                <div className="py-12 text-center text-xs opacity-50 font-mono">
                  Calculando matriz de coeficientes y tendencias climáticas...
                </div>
              )}
            </motion.div>

            {/* Sec 2. PRÓXIMAS 6 HORAS */}
            <motion.div
              whileHover={{ 
                y: -4, 
                scale: 1.012,
                borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[28px] p-6 border backdrop-blur-md ${
                activeDarkMode 
                  ? 'border-white/10 bg-zinc-900/95 text-white' 
                  : 'border-slate-205 bg-[#ffffff] text-slate-900 shadow-xl shadow-brand-blue/2'
              }`}
            >
              <div className="mb-4">
                <h3 className={`text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${
                  activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${activeDarkMode ? 'bg-teal-400' : 'bg-brand-yellow'}`}></span>
                  2. PRÓXIMAS 6 HORAS (ALTA RESOLUCIÓN)
                </h3>
                <p className={`text-[10.5px] mt-1 ${activeDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Variables climáticas para una planificación horaria óptima</p>
              </div>

              <div className={`overflow-x-auto rounded-xl border ${activeDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <table className={`w-full text-left text-xs border-collapse min-w-[620px] ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  <thead>
                    <tr className={`border-b font-mono text-[9px] uppercase tracking-wider ${
                      activeDarkMode ? 'bg-white/5 border-b border-white/10 text-white/50' : 'bg-blue-50/50 border-brand-blue/10 text-brand-blue/80'
                    }`}>
                      <th className="py-2 px-3 font-semibold">Hora</th>
                      <th className="py-2 px-3 font-semibold">Temp(°C)</th>
                      <th className="py-2 px-3 font-semibold">Sensación</th>
                      <th className="py-2 px-3 font-semibold">Viento (Vel/Dir)</th>
                      <th className="py-2 px-3 font-semibold">Humedad(%)</th>
                      <th className="py-2 px-3 font-semibold">Precip(%)</th>
                      <th className="py-2 px-3 font-semibold">Calima</th>
                      <th className="py-2 px-3 font-semibold">Visibilidad(km)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono text-[11px] ${activeDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {weather?.hourly6h?.map((h, idx) => {
                      const calimaColor = 
                        h.calima === 'Alto' ? 'text-red-500 bg-red-400/10' :
                        h.calima === 'Moderado' ? 'text-brand-blue bg-brand-yellow/30' :
                        activeDarkMode ? 'text-white/40' : 'text-slate-400';

                      return (
                        <tr key={idx} className={`transition ${activeDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                          <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{h.hora}</td>
                          <td className={`py-2.5 px-3 font-semibold ${activeDarkMode ? 'text-white' : 'text-brand-blue font-bold'}`}>{Math.round(h.temp)}°C</td>
                          <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/70' : 'text-slate-650'}`}>{Math.round(h.sensacion)}°C</td>
                          <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/95' : 'text-slate-800'}`}>
                            {h.vientoVel.toFixed(0)} km/h <span className={`font-sans text-xs ml-1 font-semibold ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'}`}>{h.vientoDir}</span>
                          </td>
                          <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{h.humedad}%</td>
                          <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-teal-400 font-bold' : 'text-brand-blue font-bold bg-blue-50/20 px-1 py-0.5 rounded'}`}>{h.precipProb}%</td>
                          <td className="py-2.5 px-3 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${calimaColor}`}>
                              {h.calima}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/60' : 'text-slate-605'}`}>{h.visibilidad} km</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN OF BENTO GRID (Favorites & notifications) */}
        <div id="sidebar-widgets-section" className="col-span-1 space-y-4">
          
          <FavoriteCitiesManager
            favorites={favorites}
            currentCity={currentCity}
            onSelectCity={handleSelectCity}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            isAuthenticated={isAuthenticated}
            onLogin={handleAuthLogin}
            activeDarkMode={activeDarkMode}
          />

          <NotificationCenter
            notifications={notifications}
            onAddNotification={handleAddNotificationMessage}
            onClearNotifications={handleClearNotifications}
            onGrantGeolocation={handleSelectCity}
            activeDarkMode={activeDarkMode}
          />

          {/* 3. PRÓXIMOS 3 DÍAS (CONSENSO DE MODELOS) */}
          <motion.div
            whileHover={{ 
              y: -4, 
              scale: 1.012,
              borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)"
            }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`rounded-[24px] p-6 border backdrop-blur-md flex flex-col items-stretch ${
              activeDarkMode 
                ? 'border-white/10 bg-zinc-900/90 text-white' 
                : 'border-slate-205 bg-[#ffffff] text-slate-900 shadow-xl shadow-brand-blue/2'
            }`}
          >
            <h3 className={`text-xs font-mono block mb-4 uppercase tracking-widest flex items-center gap-2 ${
              activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeDarkMode ? 'bg-teal-400' : 'bg-brand-yellow'}`}></span>
              3. PRÓXIMOS 3 DÍAS (CONSENSO)
            </h3>
            
            <div className="space-y-3">
              {weather?.daily3d?.map((day, idx) => {
                const uvColor = 
                  day.uvMax >= 8 ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                  day.uvMax >= 6 ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' :
                  day.uvMax >= 3 ? 'text-brand-blue bg-brand-yellow/15 border-brand-yellow/30' :
                  'text-emerald-500 bg-emerald-500/10 border-emerald-500/15';

                return (
                  <div
                    key={`daily3d-${idx}`}
                    className={`p-3 border rounded-2xl transition-all duration-300 ${
                      activeDarkMode 
                        ? 'bg-white/[0.01] border-white/5 hover:border-white/15' 
                        : 'bg-[#ffffff] border-slate-205 hover:border-brand-blue/30 hover:bg-slate-50/50 shadow-3xs'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-sans text-xs font-semibold capitalize ${
                        activeDarkMode ? 'text-white/95' : 'text-brand-blue font-bold'
                      }`}>{day.fecha}</span>
                      <div className={`flex items-center gap-1.5 text-[10.5px] font-mono ${
                        activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold bg-blue-50/40 px-1.5 py-0.5 rounded'
                      }`}>
                        <span>💧 {day.precipProb}% precip</span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between border-t pt-2 mt-2 font-mono text-xs ${
                      activeDarkMode ? 'border-white/5' : 'border-slate-100'
                    }`}>
                      <div className="flex gap-2">
                        <span className={`font-medium ${activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'}`}>Máx: {Math.round(day.tempMax)}°C</span>
                        <span className={activeDarkMode ? 'text-white/40' : 'text-slate-500'}>Mín: {Math.round(day.tempMin)}°C</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] uppercase ${activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'}`}>UV MÁX:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${uvColor}`}>
                          {day.uvMax}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </main>

      {/* 4. FOOTER CREDITS BRAND */}
      <footer id="main-footer" className={`border-t py-8 text-center mt-auto transition duration-300 ${
        activeDarkMode 
          ? 'border-white/5 bg-black text-white/30' 
          : 'border-slate-200 bg-white text-slate-400'
      }`}>
        <p className="text-[10px] font-mono uppercase tracking-widest">
          ESTACIÓN DE PRONÓSTICOS REGIONAL • DATOS COORDENADAS VÍA OPEN-METEO • PURE AMOLED © 2026
        </p>
      </footer>
    </div>
  );
}
