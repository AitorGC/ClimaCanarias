import { useState, useEffect, useRef } from 'react';
import { 
  Sun, Moon, Compass, Wind, Droplets, Thermometer, Compass as PressureIcon, 
  MapPin, LogOut, RefreshCw, AlertTriangle, ShieldCheck, WifiOff, ExternalLink,
  LocateFixed, Cloud, Umbrella, Radio, Satellite
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { getDb, getAuthSvc, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { City, CurrentWeather, NotificationMessage, WeatherCondition } from './types';
import { fetchWeather } from './weatherService';
import WeatherAnimations from './components/WeatherAnimations';
import FavoriteCitiesManager, { PREDEFINED_CITIES } from './components/FavoriteCitiesManager';
import NotificationCenter from './components/NotificationCenter';
import TrendChart from './components/TrendChart';
import AirQualityIndicator from './components/AirQualityIndicator';
import DailyComparisonChart from './components/DailyComparisonChart';
import TideChart from './components/TideChart';
import BeachStatus from './components/BeachStatus';
import AemetStations from './components/AemetStations';

const DEFAULT_FAVORITES: City[] = [
  PREDEFINED_CITIES[0],
  PREDEFINED_CITIES[1],
  PREDEFINED_CITIES[2],
  PREDEFINED_CITIES[3],
];

export default function App() {
  const [favorites, setFavorites] = useState<City[]>(() => {
    try {
      const local = localStorage.getItem('climatiempo_favorites');
      return local ? JSON.parse(local) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  const [currentCity, setCurrentCity] = useState<City>(() => {
    try {
      const local = localStorage.getItem('climatiempo_current_city');
      return local ? JSON.parse(local) : PREDEFINED_CITIES[0];
    } catch {
      return PREDEFINED_CITIES[0];
    }
  });

  const [activeTab, setActiveTab] = useState<'clima' | 'playas' | 'alertas' | 'estaciones' | 'satelite'>('clima');

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
    try {
      const local = localStorage.getItem('climatiempo_notifications');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const prevCityIdRef = useRef<string | null>(null);

  const isCloudLoadFinishedRef = useRef(false);

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

  const [isNightTime, setIsNightTime] = useState(false);

  useEffect(() => {
    const evaluateNightTime = () => {
      const hour = new Date().getHours();
      setIsNightTime(hour >= 20 || hour < 7);
    };
    evaluateNightTime();
    const interval = setInterval(evaluateNightTime, 600000);
    return () => clearInterval(interval);
  }, []);

  const activeDarkMode = 
    darkModeSetting === 'dark' || 
    (darkModeSetting === 'auto' && isNightTime);

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

  useEffect(() => {
    const unsubscribe = getAuthSvc().onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        
        try {
          const userDoc = await getDoc(doc(getDb(), 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.favorites) {
              setFavorites(data.favorites);
            }
          } else {
            await setDoc(doc(getDb(), 'users', user.uid), {
              favorites: favorites,
              createdAt: serverTimestamp()
            });
          }
        } catch (error: any) {
          console.error("Error loading cloud data:", error);
          if (error.code === 'permission-denied' || error.message?.includes('missing or insufficient permissions')) {
            // Already handled by component
          }
        } finally {
          setIsCloudLoaded(true);
          isCloudLoadFinishedRef.current = true;
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsCloudLoaded(false);
        isCloudLoadFinishedRef.current = true;
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser && isCloudLoadFinishedRef.current) {
      const syncFavorites = async () => {
        try {
          await setDoc(doc(getDb(), 'users', currentUser.uid), {
            favorites: favorites,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error saving to cloud:", error);
        }
      };
      
      const debounce = setTimeout(syncFavorites, 2000);
      return () => clearTimeout(debounce);
    }
  }, [favorites, isAuthenticated, currentUser]);

  const getWeatherData = async (city: City, forceFetch: boolean = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (forceFetch && 'caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      
      const data = await fetchWeather(city);
      setWeather(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al obtener datos');
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (prevCityIdRef.current !== currentCity.id) {
      prevCityIdRef.current = currentCity.id;
      getWeatherData(currentCity);
    }
  }, [currentCity]);

  const handleSelectCity = (city: City) => {
    setCurrentCity(city);
  };

  const handleAddFavorite = (city: City) => {
    if (!favorites.find(c => c.name === city.name)) {
      setFavorites([...favorites, city]);
    }
  };

  const handleRemoveFavorite = (cityName: string) => {
    setFavorites(favorites.filter(c => c.name !== cityName));
  };

  const handleAuthLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      const msg = handleFirestoreError(error, OperationType.GET, null);
      if (msg) setAuthError(msg);
    }
  };

  const handleAuthLogout = async () => {
    await logout();
  };

  const handleAddNotificationMessage = (msg: NotificationMessage) => {
    setNotifications(prev => [msg, ...prev].slice(0, 50));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por tu navegador.");
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCity: City = {
          id: `gps-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
          name: "Ubicación actual",
          lat: latitude,
          lon: longitude
        };
        setCurrentCity(newCity);
      },
      (error) => {
        setIsLoading(false);
        console.error(error);
        alert("No se pudo obtener la ubicación. Por favor, revisa los permisos.");
      }
    );
  };

  const formatTemperature = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return (
    <div id="app-root-wrapper" className={`min-h-screen font-sans flex flex-col justify-start items-stretch select-none selection:bg-brand-blue/10 transition-colors duration-500 ${
      activeDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. APP HEADER PANEL */}
      <header id="main-header" className={`border-b px-5 py-4 md:py-6 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 ${
        activeDarkMode 
          ? 'border-white/10 bg-black/85 text-white' 
          : 'border-brand-yellow-hover bg-brand-yellow text-brand-blue shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-stretch md:items-end gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <MapPin className={`w-6 h-6 shrink-0 ${activeDarkMode ? 'text-white/80' : 'text-brand-blue'}`} />
              <h1 className={`font-display text-3xl md:text-4xl tracking-tight leading-none flex items-center gap-2 ${
                activeDarkMode ? 'text-white' : 'text-brand-blue font-bold'
              }`}>
                {currentCity.name}
                <button
                  onClick={handleLocateUser}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    activeDarkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-white/90' 
                      : 'bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue'
                  }`}
                  title="Usar mi ubicación actual"
                >
                  <LocateFixed className="w-5 h-5" />
                </button>
              </h1>
            </div>
            <p className={`text-[11px] md:text-xs font-mono uppercase tracking-widest mt-2 ${
              activeDarkMode ? 'text-white/40' : 'text-brand-blue/80 font-bold'
            }`}>
              ClimaCanarias by Aitor Santana
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 md:gap-6">
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
                  F
                </button>
              </div>

              <div className={`flex items-center rounded-full p-0.5 border text-xs font-mono transition-colors duration-300 ${
                activeDarkMode ? 'border-white/10 bg-white/5' : 'border-brand-blue/30 bg-brand-blue/10'
              }`}>
                <button
                  onClick={() => setDarkModeSetting('light')}
                  className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                    darkModeSetting === 'light' ? 'bg-white text-black shadow-xs' : 'text-brand-blue hover:text-brand-blue-hover'
                  }`}
                  title="Modo Claro"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDarkModeSetting('auto')}
                  className={`px-2.5 py-1 rounded-full transition-all text-[10px] font-semibold tracking-wider cursor-pointer ${
                    darkModeSetting === 'auto'
                      ? activeDarkMode ? 'bg-white text-black' : 'bg-brand-blue text-white'
                      : activeDarkMode ? 'text-white/50 hover:text-white' : 'text-brand-blue hover:text-brand-blue-hover'
                  }`}
                  title="Automático (Día/Noche)"
                >
                  AUTO
                </button>
                <button
                  onClick={() => setDarkModeSetting('dark')}
                  className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                    darkModeSetting === 'dark' ? 'bg-white text-black shadow-xs' : activeDarkMode ? 'text-white/50 hover:text-white' : 'text-brand-blue hover:text-brand-blue-hover'
                  }`}
                  title="Modo Oscuro"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>

              {isAuthenticated && currentUser ? (
                <div className={`flex items-center gap-1.5 pl-2 border-l ${
                  activeDarkMode ? 'border-white/20' : 'border-brand-blue/20'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeDarkMode ? 'bg-white text-black' : 'bg-brand-blue text-white'
                  }`}>
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
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

      {/* TABS NAVIGATION */}
      <nav className={`border-b sticky top-[98px] md:top-[104px] z-40 transition-colors duration-300 flex overflow-x-auto no-scrollbar ${
        activeDarkMode 
          ? 'border-white/10 bg-black/90 text-white/50 backdrop-blur-md' 
          : 'border-slate-200 bg-white/95 text-slate-500 shadow-sm backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center min-w-max px-2">
          {[
            { id: 'clima', label: 'Clima', icon: Cloud },
            { id: 'playas', label: 'Playas', icon: Umbrella },
            { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
            { id: 'estaciones', label: 'Estaciones', icon: Radio },
            { id: 'satelite', label: 'Satélite', icon: Satellite },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? (activeDarkMode ? 'border-white text-white' : 'border-brand-blue text-brand-blue')
                  : 'border-transparent hover:text-inherit'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

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
      <AnimatePresence mode="wait">
        <motion.main 
          key={currentCity.id + activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          id="bento-grid-dashboard" 
          className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start w-full"
        >
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

        {/* --- LEFT COLUMN --- */}
        <div id="main-weatherview-section" className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* TAB: CLIMA */}
          {activeTab === 'clima' && (
            <>
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
                {weather && (
                  <WeatherAnimations 
                    condition={weather.condition} 
                    calimaRating={weather.hourly6h && weather.hourly6h.length > 0 ? weather.hourly6h[0].calima : 'Bajo'} 
                  />
                )}

                {/* Floating refresh button positioned absolute in the top right corner */}
                <button
                  id="dashboard-weather-refresh"
                  onClick={() => getWeatherData(currentCity, true)}
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

                {/* Mid values section */}
                <div className="z-10 pt-2 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                  <div className="flex flex-col md:flex-row items-baseline md:items-end gap-4 md:gap-6">
                    <span className={`text-[100px] md:text-[130px] font-display font-thin leading-none tracking-tighter select-all flex ${
                      activeDarkMode ? 'text-white' : 'text-brand-blue font-bold'
                    }`}>
                      {weather ? formatTemperature(weather.temp).replace('°C', '').replace('°F', '').replace('F', '') : '--'}
                      <span className={`text-4xl md:text-5xl font-extralight align-top mt-2 ${
                        activeDarkMode ? 'text-white/90' : 'text-brand-blue/80'
                      }`}>{tempUnit === 'C' ? '°' : 'F'}</span>
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

                {/* High fidelity sensory metrics */}
                <div className={`mt-auto z-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-6 ${
                  activeDarkMode ? 'border-white/10' : 'border-slate-150'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      activeDarkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                    }`}>
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-[10px] block font-mono tracking-widest uppercase ${activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'}`}>HUMEDAD</span>
                      <span className={`text-base font-light block mt-0.5 ${activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'}`}>{weather ? `${weather.humidity}%` : '--'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      activeDarkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                    }`}>
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-[10px] block font-mono tracking-widest uppercase ${activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'}`}>VIENTO</span>
                      <span className={`text-base font-light block mt-0.5 ${activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'}`}>{weather ? `${weather.windSpeed.toFixed(0)} km/h` : '--'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      activeDarkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                    }`}>
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-[10px] block font-mono tracking-widest uppercase ${activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'}`}>ÍNDICE UV</span>
                      <span className={`text-base font-light block mt-0.5 ${activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'}`}>{weather ? `${weather.uvIndex.toFixed(0)}` : '--'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      activeDarkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-blue-50/50 border-brand-blue/15 text-brand-blue'
                    }`}>
                      <PressureIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-[10px] block font-mono tracking-widest uppercase ${activeDarkMode ? 'text-white/40' : 'text-slate-500 font-semibold'}`}>PRESIÓN</span>
                      <span className={`text-base font-light block mt-0.5 ${activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'}`}>{weather ? `${weather.pressure.toFixed(0)} hPa` : '--'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AQI */}
              <motion.div
                whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={`rounded-[28px] p-6 border backdrop-blur-md ${activeDarkMode ? 'border-white/10 bg-zinc-900/95 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
              >
                <AirQualityIndicator 
                  aqi={weather?.aqi} 
                  calimaRating={weather?.hourly6h && weather.hourly6h.length > 0 ? weather.hourly6h[0].calima : 'Bajo'}
                  activeDarkMode={activeDarkMode} 
                />
              </motion.div>

              {/* TENDENCIAS */}
              <motion.div
                whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={`rounded-[28px] p-6 border backdrop-blur-md ${activeDarkMode ? 'border-white/10 bg-zinc-900/95 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
              >
                {weather?.hourly ? (
                  <TrendChart hourly={weather.hourly} tempUnit={tempUnit} activeDarkMode={activeDarkMode} />
                ) : (
                  <div className="py-12 text-center text-xs opacity-50 font-mono">Calculando matriz...</div>
                )}
              </motion.div>

              {/* PRÓXIMAS 6 HORAS */}
              <motion.div
                whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={`rounded-[28px] p-6 border backdrop-blur-md ${activeDarkMode ? 'border-white/10 bg-zinc-900/95 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
              >
                <div className="mb-4">
                  <h3 className={`text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${activeDarkMode ? 'bg-teal-400' : 'bg-brand-yellow'}`}></span>
                    Pronóstico Detallado 6H
                  </h3>
                </div>
                <div className={`overflow-x-auto rounded-xl border ${activeDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <table className={`w-full text-left text-xs border-collapse min-w-[620px] ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <thead>
                      <tr className={`border-b font-mono text-[9px] uppercase tracking-wider ${activeDarkMode ? 'bg-white/5 border-b border-white/10 text-white/50' : 'bg-blue-50/50 border-brand-blue/10 text-brand-blue/80'}`}>
                        <th className="py-2 px-3 font-semibold">Hora</th>
                        <th className="py-2 px-3 font-semibold">Temp</th>
                        <th className="py-2 px-3 font-semibold">Sensación</th>
                        <th className="py-2 px-3 font-semibold">Viento</th>
                        <th className="py-2 px-3 font-semibold">Humedad</th>
                        <th className="py-2 px-3 font-semibold">Precip(%)</th>
                        <th className="py-2 px-3 font-semibold">Calima</th>
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
                            <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/95' : 'text-slate-800'}`}>{h.vientoVel.toFixed(0)} km/h {h.vientoDir}</td>
                            <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{h.humedad}%</td>
                            <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-teal-400 font-bold' : 'text-brand-blue font-bold bg-blue-50/20 px-1 py-0.5 rounded'}`}>{h.precipProb}%</td>
                            <td className="py-2.5 px-3 font-semibold"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${calimaColor}`}>{h.calima}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* TAB: PLAYAS */}
          {activeTab === 'playas' && (
            <motion.div
              whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[28px] p-6 border backdrop-blur-md ${activeDarkMode ? 'border-white/10 bg-zinc-900/95 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
            >
              <h3 className={`text-xs font-mono uppercase tracking-widest flex items-center gap-2 mb-6 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'}`}>
                <Compass className={`w-4 h-4 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue'}`} />
                <span>Datos Marítimos y Mareas</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-[10px] font-mono tracking-widest uppercase mb-3 ${activeDarkMode ? 'text-white/50' : 'text-slate-500 font-semibold'}`}>Estado de la Mar</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Altura del oleaje</span>
                      <span className={`font-mono text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{weather?.marine?.waveHeight?.toFixed(1) || '--'} m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Dirección del oleaje</span>
                      <span className={`font-mono text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{weather?.marine?.waveDirection}°</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Período de olas</span>
                      <span className={`font-mono text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{weather?.marine?.wavePeriod?.toFixed(1) || '--'} s</span>
                    </div>
                  </div>
                  {weather?.beachInfo && <BeachStatus beachInfo={weather.beachInfo} activeDarkMode={activeDarkMode} />}
                </div>

                <div>
                  <h4 className={`text-[10px] font-mono tracking-widest uppercase mb-3 ${activeDarkMode ? 'text-white/50' : 'text-slate-500 font-semibold'}`}>Mareas (IHM)</h4>
                  <div className={`text-[10px] mb-3 opacity-60 font-mono ${activeDarkMode ? 'text-white/70' : 'text-brand-blue/80'}`}>
                    {weather?.tides?.station || 'Cargando estación...'}
                  </div>
                  <div className="space-y-3">
                    {weather?.tides?.mareas?.map((marea, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-2 rounded-lg border ${activeDarkMode ? 'bg-white/5 border-white/10' : 'bg-blue-50/50 border-brand-blue/15'}`}>
                        <span className={`text-xs capitalize font-semibold ${marea.tipo === 'pleamar' ? 'text-teal-500' : 'text-brand-blue'}`}>{marea.tipo}</span>
                        <div className="flex gap-4">
                          <span className={`text-xs font-mono ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{marea.hora}</span>
                          <span className={`text-xs font-mono font-bold ${activeDarkMode ? 'text-white' : 'text-brand-blue'}`}>{marea.altura} m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {weather?.tides?.curve && <TideChart tides={weather.tides} activeDarkMode={activeDarkMode} />}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: ALERTAS */}
          {activeTab === 'alertas' && (
            <motion.div
              whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[28px] p-6 border backdrop-blur-md ${activeDarkMode ? 'border-white/10 bg-gradient-to-br from-zinc-900/90 to-black text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
            >
              <div className="mb-4">
                <h3 className={`text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${activeDarkMode ? 'bg-teal-400' : 'bg-brand-yellow'}`}></span>
                  Avisos y Alertas AEMET
                </h3>
              </div>
              {weather?.alertasAemet && weather.alertasAemet.length > 0 ? (
                <div className={`overflow-x-auto rounded-xl border ${activeDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <table className={`w-full text-left text-xs border-collapse ${activeDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <thead>
                      <tr className={`border-b font-mono text-[9px] uppercase tracking-wider ${activeDarkMode ? 'bg-white/5 border-white/10 text-white/50' : 'bg-blue-50/50 border-brand-blue/10 text-brand-blue/80'}`}>
                        <th className="py-2 px-3 font-semibold">Nivel</th>
                        <th className="py-2 px-3 font-semibold text-center">Tipo</th>
                        <th className="py-2 px-3 font-semibold">Duración</th>
                        <th className="py-2 px-3 font-semibold">Detalle del Aviso</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono text-[11px] ${activeDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {weather.alertasAemet.map((al, idx) => {
                        const levelColor = al.nivel === 'Rojo' ? 'text-red-500 bg-red-500/10 border-red-500/20' : al.nivel === 'Naranja' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-brand-blue bg-brand-yellow/15 border-brand-yellow/30';
                        return (
                          <tr key={idx} className={`transition ${activeDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                            <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${levelColor}`}>{al.nivel}</span></td>
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
                <div className={`flex flex-col items-center justify-center py-6 border rounded-2xl text-center gap-1.5 ${activeDarkMode ? 'bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-400' : 'bg-emerald-50/30 border-emerald-200/60 text-emerald-700'}`}>
                  <span className="text-xl">☀️</span>
                  <span className="text-xs font-mono font-medium tracking-wide">Sin alertas activas</span>
                  <span className={`text-[10px] truncate ${activeDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Condiciones normales de seguridad en la ubicación</span>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ESTACIONES */}
          {activeTab === 'estaciones' && (
            <motion.div
              whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[24px] p-6 border backdrop-blur-md flex flex-col items-stretch ${activeDarkMode ? 'border-white/10 bg-zinc-900/90 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
            >
              {weather?.aemetStations ? (
                <AemetStations stations={weather.aemetStations} activeDarkMode={activeDarkMode} />
              ) : (
                <div className="py-12 text-center text-xs opacity-50 font-mono">Cargando estaciones de observación...</div>
              )}
            </motion.div>
          )}

          {/* TAB: SATÉLITE */}
          {activeTab === 'satelite' && (
            <motion.div
              whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`rounded-[24px] p-4 border backdrop-blur-md flex flex-col min-h-[500px] ${activeDarkMode ? 'border-white/10 bg-zinc-900/90 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
            >
              <div className="flex items-center gap-2 mb-4 px-2">
                <Satellite className="w-5 h-5 opacity-70" />
                <h3 className="text-sm font-bold">Radar Meteorológico en Tiempo Real</h3>
              </div>
              <div className="flex-1 w-full rounded-[16px] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                <iframe 
                  src={`https://www.rainviewer.com/map.html?loc=${currentCity.lat},${currentCity.lon},7&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&c=1&o=83&lm=0&layer=radar&sm=1&sn=1`}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{border: 0, minHeight: '450px'}}
                  title="RainViewer Radar"
                ></iframe>
              </div>
            </motion.div>
          )}
        </div>

        {/* --- RIGHT SIDEBAR COLUMN --- */}
        <div id="sidebar-widgets-section" className="col-span-1 space-y-6">
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

          {activeTab === 'clima' && (
            <>
              {/* COMPARATIVA SEMANAL */}
              <motion.div
                whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={`rounded-[24px] p-6 border backdrop-blur-md flex flex-col items-stretch ${activeDarkMode ? 'border-white/10 bg-zinc-900/90 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}`}
              >
                <h3 className={`text-xs font-mono block mb-4 uppercase tracking-widest flex items-center gap-2 ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeDarkMode ? 'bg-teal-400' : 'bg-brand-yellow'}`}></span>
                  Próximos Días
                </h3>
                
                <div className="space-y-3">
                  {weather?.daily3d?.map((day, idx) => {
                    const uvColor = day.uvMax >= 8 ? 'text-red-500 bg-red-500/10 border-red-500/20' : day.uvMax >= 6 ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : day.uvMax >= 3 ? 'text-brand-blue bg-brand-yellow/15 border-brand-yellow/30' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15';
                    return (
                      <div key={`daily3d-${idx}`} className={`p-3 border rounded-2xl transition-all duration-300 ${activeDarkMode ? 'bg-white/[0.01] border-white/5 hover:border-white/15' : 'bg-[#ffffff] border-slate-205 hover:border-brand-blue/30 hover:bg-slate-50/50 shadow-3xs'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-sans text-xs font-semibold capitalize ${activeDarkMode ? 'text-white/95' : 'text-brand-blue font-bold'}`}>{day.fecha}</span>
                          <div className={`flex items-center gap-1.5 text-[10.5px] font-mono ${activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold bg-blue-50/40 px-1.5 py-0.5 rounded'}`}>
                            <span>💧 {day.precipProb}% precip</span>
                          </div>
                        </div>
                        <div className={`flex items-center justify-between border-t pt-2 mt-2 font-mono text-xs ${activeDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                          <div className="flex gap-2">
                            <span className={`font-medium ${activeDarkMode ? 'text-white' : 'text-brand-blue font-semibold'}`}>Máx: {Math.round(day.tempMax)}°C</span>
                            <span className={activeDarkMode ? 'text-white/40' : 'text-slate-500'}>Mín: {Math.round(day.tempMin)}°C</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] uppercase ${activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'}`}>UV:</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${uvColor}`}>{day.uvMax}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 7-DAY BAR CHART */}
                <div className={`mt-6 pt-6 border-t ${activeDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                  <h4 className={`text-[10px] font-mono tracking-widest uppercase mb-4 ${activeDarkMode ? 'text-white/50' : 'text-slate-500 font-bold'}`}>Gráfica 7 Días</h4>
                  {weather?.daily && (
                    <DailyComparisonChart daily={weather.daily} tempUnit={tempUnit} activeDarkMode={activeDarkMode} />
                  )}
                </div>
              </motion.div>
            </>
          )}

          {(activeTab === 'clima' || activeTab === 'alertas') && (
            <NotificationCenter
              notifications={notifications}
              onAddNotification={handleAddNotificationMessage}
              onClearNotifications={handleClearNotifications}
              onGrantGeolocation={handleSelectCity}
              activeDarkMode={activeDarkMode}
            />
          )}

        </div>
        </motion.main>
      </AnimatePresence>

      {/* 4. FOOTER CREDITS BRAND */}
      <footer id="main-footer" className={`border-t py-8 text-center mt-auto transition duration-300 ${
        activeDarkMode ? 'border-white/5 bg-black text-white/30' : 'border-slate-200 bg-white text-slate-400'
      }`}>
        <p className="text-[10px] font-mono uppercase tracking-widest">
          ESTACIÓN DE PRONÓSTICOS REGIONAL • DATOS COORDENADAS VÍA OPEN-METEO • PURE AMOLED © 2026 • v1.1.2
        </p>
      </footer>
    </div>
  );
}
