import { useState, useEffect, useRef } from 'react';
import { 
  Sun, Moon, Compass, Wind, Droplets, Thermometer, Compass as PressureIcon, 
  MapPin, LogOut, RefreshCw, AlertTriangle, ExternalLink,
  LocateFixed, Cloud, Umbrella, Radio, Satellite, Sunrise, Sunset,
  Menu, Star, Settings, Activity, Trash, Plus, Bell, CloudRain,
  Calendar, BarChart3, TrendingUp, ArrowUp, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { getDb, getAuthSvc, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { City, CurrentWeather, NotificationMessage } from './types';
import { fetchWeather, getWindDirectionText } from './weatherService';
import WeatherAnimations from './components/WeatherAnimations';
import FavoriteCitiesManager, { PREDEFINED_CITIES } from './components/FavoriteCitiesManager';
import TrendChart from './components/TrendChart';
import AirQualityIndicator from './components/AirQualityIndicator';
import UvIndexIndicator from './components/UvIndexIndicator';
import DailyComparisonChart from './components/DailyComparisonChart';
import TideChart from './components/TideChart';
import BeachStatus from './components/BeachStatus';
import AemetStations from './components/AemetStations';
import SunTracker from './components/SunTracker';
import LocationSelectorModal from './components/LocationSelectorModal';
import SettingsModal from './components/SettingsModal';
import TelemetryModal from './components/TelemetryModal';

export const CANARY_LOCATIONS: City[] = [
  { id: 'laspalmas', name: 'Las Palmas de GC', lat: 28.1235, lon: -15.4363, country: 'España', state: 'Gran Canaria' },
  { id: 'telde', name: 'Telde', lat: 27.9924, lon: -15.4192, country: 'España', state: 'Gran Canaria' },
  { id: 'maspalomas', name: 'Maspalomas', lat: 27.7606, lon: -15.5860, country: 'España', state: 'Gran Canaria' },
  { id: 'agaete', name: 'Agaete', lat: 28.1017, lon: -15.7011, country: 'España', state: 'Gran Canaria' },
  { id: 'santacruz', name: 'Santa Cruz de Tenerife', lat: 28.4636, lon: -16.2518, country: 'España', state: 'Tenerife' },
  { id: 'lalaguna', name: 'La Laguna', lat: 28.4853, lon: -16.3201, country: 'España', state: 'Tenerife' },
  { id: 'puertocruz', name: 'Puerto de la Cruz', lat: 28.4167, lon: -16.5500, country: 'España', state: 'Tenerife' },
  { id: 'adeje', name: 'Adeje', lat: 28.1227, lon: -16.7260, country: 'España', state: 'Tenerife' },
  { id: 'arrecife', name: 'Arrecife', lat: 28.9630, lon: -13.5477, country: 'España', state: 'Lanzarote' },
  { id: 'teguise', name: 'Teguise', lat: 29.0594, lon: -13.5594, country: 'España', state: 'Lanzarote' },
  { id: 'puertodelrosario', name: 'Puerto del Rosario', lat: 28.5004, lon: -13.8627, country: 'España', state: 'Fuerteventura' },
  { id: 'corralejo', name: 'Corralejo', lat: 28.7366, lon: -13.8674, country: 'España', state: 'Fuerteventura' },
  { id: 'santacruzlapalma', name: 'Santa Cruz de La Palma', lat: 28.6835, lon: -17.7642, country: 'España', state: 'La Palma' },
  { id: 'losllanos', name: 'Los Llanos de Aridane', lat: 28.6585, lon: -17.9182, country: 'España', state: 'La Palma' },
  { id: 'sansebastian', name: 'San Sebastián de La Gomera', lat: 28.0916, lon: -17.1133, country: 'España', state: 'La Gomera' },
  { id: 'valverde', name: 'Valverde', lat: 27.8063, lon: -17.9158, country: 'España', state: 'El Hierro' },
];

export function getClosestCanaryLocation(lat: number, lon: number): City {
  let closest = CANARY_LOCATIONS[0];
  let minDistance = Infinity;
  for (const loc of CANARY_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lon - lon);
    if (d < minDistance) {
      minDistance = d;
      closest = loc;
    }
  }
  return {
    ...closest,
    id: `loc-${closest.id}`,
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

const DEFAULT_FAVORITES: City[] = [
  CANARY_LOCATIONS[0],
  CANARY_LOCATIONS[4],
  CANARY_LOCATIONS[8],
  CANARY_LOCATIONS[10],
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
      return local ? JSON.parse(local) : CANARY_LOCATIONS[0];
    } catch {
      return CANARY_LOCATIONS[0];
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

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [, setErrorMsg] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [, setIsCloudLoaded] = useState(false);
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

  // Sync dark class on root document element for Material 3 tokens
  useEffect(() => {
    if (activeDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activeDarkMode]);

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

  useEffect(() => {
    const hasChosen = localStorage.getItem('climatiempo_user_selected_city');
    if (!hasChosen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const closest = getClosestCanaryLocation(pos.coords.latitude, pos.coords.longitude);
          setCurrentCity(closest);
          setFavorites(prev => {
            if (!prev.find(c => c.name === closest.name)) {
              const next = [closest, ...prev];
              localStorage.setItem('climatiempo_favorites', JSON.stringify(next));
              return next;
            }
            return prev;
          });
        },
        () => {
          // Default remains CANARY_LOCATIONS[0]
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const handleSelectCity = (city: City) => {
    setCurrentCity(city);
    localStorage.setItem('climatiempo_user_selected_city', 'true');
    localStorage.setItem('climatiempo_current_city', JSON.stringify(city));
    setFavorites(prev => {
      if (!prev.find(c => c.name === city.name)) {
        const next = [city, ...prev];
        localStorage.setItem('climatiempo_favorites', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  const handleAddFavorite = (city: City) => {
    setFavorites(prev => {
      if (!prev.find(c => c.name === city.name)) {
        const next = [...prev, city];
        localStorage.setItem('climatiempo_favorites', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  const handleRemoveFavorite = (identifier: string) => {
    setFavorites(prev => {
      const next = prev.filter(c => c.id !== identifier && c.name !== identifier);
      localStorage.setItem('climatiempo_favorites', JSON.stringify(next));

      // If current active city was removed, immediately switch to another city
      if (currentCity.id === identifier || currentCity.name === identifier) {
        const fallbackCity = next.length > 0 ? next[0] : CANARY_LOCATIONS[0];
        setCurrentCity(fallbackCity);
        localStorage.setItem('climatiempo_city', JSON.stringify(fallbackCity));
      }
      return next;
    });
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
        const closest = getClosestCanaryLocation(latitude, longitude);
        setCurrentCity(closest);
        localStorage.setItem('climatiempo_user_selected_city', 'true');
        localStorage.setItem('climatiempo_current_city', JSON.stringify(closest));
        setFavorites(prev => {
          if (!prev.find(c => c.name === closest.name)) {
            const next = [closest, ...prev];
            localStorage.setItem('climatiempo_favorites', JSON.stringify(next));
            return next;
          }
          return prev;
        });
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        console.error("Geolocation error:", error);
        alert("No se pudo obtener la ubicación GPS. Por favor revisa los permisos.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const formatTemperature = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return (
    <div id="app-root-wrapper" className={`min-h-screen font-sans flex flex-col justify-start items-stretch select-none transition-colors duration-300 ${
      activeDarkMode ? 'bg-[#14171a] text-[#e8e5d8]' : 'bg-[#f4f7fa] text-[#1c1c18]'
    }`}>
      {/* 1. BRAND TOP APP BAR & NAVIGATION */}
      <header id="main-header" className={`border-b sticky top-0 z-50 flex flex-col transition-colors duration-300 ${
        activeDarkMode 
          ? 'border-white/10 bg-[#002f5e] text-white' 
          : 'border-[#003875] bg-[#004993] text-white shadow-md'
      }`}>
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-none flex items-center gap-2">
              ClimaCanarias 
              <span className="inline-flex items-center shadow-xs overflow-hidden rounded-[3px] border border-white/30 w-6 h-4 flex-shrink-0" title="Canarias">
                <span className="w-1/3 h-full bg-white"></span>
                <span className="w-1/3 h-full bg-[#0060ac]"></span>
                <span className="w-1/3 h-full bg-[#ffd600]"></span>
              </span>
            </h1>
            <p className="text-[11px] font-mono font-medium tracking-wider mt-1 text-[#ffd600]">
              con 💛 por{' '}
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(true)}
                className="underline hover:text-white transition cursor-pointer font-bold inline-flex items-center gap-1 focus:outline-none"
                title="Ver Telemetría de APIs"
              >
                Aitor Santana
              </button>
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0 relative">
            {/* Temperature Unit Segmented Switch */}
            <div className="hidden md:flex items-center rounded-full p-1 bg-white/10 text-xs font-mono font-bold">
              <button
                onClick={() => setTempUnit('C')}
                className={`px-3 py-1 rounded-full transition-all ${
                  tempUnit === 'C' ? 'bg-[#ffd600] text-[#004993]' : 'text-white/70 hover:text-white'
                }`}
              >
                °C
              </button>
              <span className="text-white/30">|</span>
              <button
                onClick={() => setTempUnit('F')}
                className={`px-3 py-1 rounded-full transition-all ${
                  tempUnit === 'F' ? 'bg-[#ffd600] text-[#004993]' : 'text-white/70 hover:text-white'
                }`}
              >
                F
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDarkModeSetting(activeDarkMode ? 'light' : 'dark')}
              className="p-1.5 rounded-full transition-all text-[#ffd600] hover:bg-white/10 cursor-pointer"
              title="Modo Noche"
            >
              <Moon className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 rounded-full transition-all text-white hover:bg-white/10 cursor-pointer"
              title="Ajustes"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Top Navigation Menu (Web Style) */}
        <nav className={`flex overflow-x-auto no-scrollbar w-full border-t ${activeDarkMode ? 'border-white/10' : 'border-[#003875]'}`}>
          <div className="flex px-2 md:px-5">
            {[
              { id: 'clima', label: 'CLIMA', icon: Sun },
              { id: 'playas', label: 'PLAYA', icon: Umbrella },
              { id: 'alertas', label: 'ALERTAS', icon: Bell },
              { id: 'estaciones', label: 'ESTACIONES', icon: MapPin },
              { id: 'satelite', label: 'SATÉLITE', icon: Satellite },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors border-b-2 whitespace-nowrap ${
                    isActive 
                      ? 'border-[#ffd600] text-[#ffd600]' 
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                  <span className="text-[12px] font-bold tracking-wider">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>



      {/* DYNAMIC BROADCAST EMERGENCY CARD STRIP */}
      {weather && weather.alerts.length > 0 && (
        <div id="urgent-broadcast-ribbon" className="bg-[#ba1a1a] text-white py-2 px-4 shadow-md z-15 relative flex items-center justify-center gap-2 border-b border-red-700">
          <AlertTriangle className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <p className="text-xs font-medium text-center">
            {weather.alerts[0].title}. {weather.alerts[0].description} (Emitido por {weather.alerts[0].sender})
          </p>
        </div>
      )}

      {/* 3. MATERIAL DESIGN 3 BENTO GRID MAIN DASHBOARD */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={currentCity.id + activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          id="bento-grid-dashboard" 
          className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start w-full"
        >
          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`col-span-1 lg:col-span-3 border p-5 rounded-[28px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-300 ${
                activeDarkMode 
                  ? 'bg-red-950/25 border-red-900/40 text-red-200' 
                  : 'bg-red-50/90 border-red-200/50 text-red-900 shadow-sm'
              }`}
            >
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-mono uppercase font-bold text-red-500">RESTRICCIÓN DE VISTA EMBEBIDA DE ARQUITECTURA (IFRAME)</h4>
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    activeDarkMode
                      ? 'bg-red-900/40 hover:bg-red-900/60 text-red-200'
                      : 'bg-white hover:bg-neutral-50 text-red-800'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Nueva Pestaña
                </a>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                    activeDarkMode ? 'text-red-300 hover:bg-white/5' : 'text-red-700 hover:bg-red-100/50'
                  }`}
                >
                  Ignorar
                </button>
              </div>
            </motion.div>
          )}

          {/* LEFT MAIN CONTENT COLUMN */}
          <div id="main-weatherview-section" className="col-span-1 lg:col-span-2 space-y-6">
            
            {/* TAB: CLIMA */}
            {activeTab === 'clima' && (
              <>
                {/* FAVORITES LOCATIONS - Tus Ubicaciones Canarias */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className={`font-bold text-[17px] md:text-xl flex items-center gap-2 ${activeDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Tus Ubicaciones Canarias
                    </h2>
                    <div className="flex items-center gap-2 md:gap-3">
                      <button
                        type="button"
                        onClick={handleLocateUser}
                        className={`p-1.5 rounded-full transition-all cursor-pointer ${
                          activeDarkMode ? 'text-[#ffd600] hover:bg-white/10' : 'text-[#004993] hover:bg-blue-100'
                        }`}
                        title="Detectar mi ubicación más cercana (GPS)"
                      >
                        <LocateFixed className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button onClick={() => setIsLocationModalOpen(true)} className={`flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#004993]'}`}>
                        <Plus className="w-4 h-4" /> Añadir
                      </button>
                    </div>
                  </div>
                  <div className="flex overflow-x-auto gap-3 pb-2 pt-1 px-1 no-scrollbar snap-x">
                    {/* Active Card */}
                    <div className={`shrink-0 snap-start flex justify-between items-center w-64 p-4 rounded-[24px] ${activeDarkMode ? 'bg-[#ffd600] text-black shadow-[0_0_15px_rgba(255,214,0,0.2)]' : 'bg-[#ffe000] text-black shadow-md'}`}>
                      <div className="flex gap-3 items-center">
                        <MapPin className="w-5 h-5 font-bold" />
                        <div>
                          <div className="font-bold text-[15px] truncate max-w-[150px] leading-tight">{currentCity.name}</div>
                          <div className="text-[11px] opacity-70 mt-0.5">{currentCity.lat.toFixed(2)}, {currentCity.lon.toFixed(2)}</div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(currentCity.id);
                        }} 
                        className="text-black/60 hover:text-red-700 p-1 cursor-pointer transition-colors"
                        title="Eliminar de ubicaciones"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Inactive Cards */}
                    {favorites.filter(c => c.id !== currentCity.id).map(fav => (
                       <div key={fav.id} className={`shrink-0 snap-start flex justify-between items-center w-64 p-4 rounded-[24px] border transition-all ${activeDarkMode ? 'bg-[#1b2025] border-white/10 text-white hover:bg-white/10' : 'bg-white border-[#d0e1f9] text-[#004993] hover:bg-blue-50 shadow-sm'}`}>
                        <button onClick={() => handleSelectCity(fav)} className="flex gap-3 items-center text-left flex-1 cursor-pointer">
                          <MapPin className="w-5 h-5 opacity-60" />
                          <div>
                            <div className="font-bold text-[15px] truncate max-w-[140px] leading-tight">{fav.name}</div>
                            <div className="text-[11px] opacity-60 mt-0.5">{fav.lat.toFixed(2)}, {fav.lon.toFixed(2)}</div>
                          </div>
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(fav.id);
                          }} 
                          className="text-red-500/50 hover:text-red-600 p-1 ml-2 cursor-pointer transition-colors"
                          title="Eliminar de ubicaciones"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hero Active Weather Card - Screenshot Style */}
                <motion.div
                  id="primary-weather-focus-card"
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`relative rounded-[32px] p-6 md:p-8 overflow-hidden shadow-lg flex flex-col justify-start min-h-[340px] md-card ${
                    activeDarkMode 
                      ? 'bg-gradient-to-br from-[#0c233e] to-[#061220] text-white border border-white/10' 
                      : 'bg-gradient-to-br from-[#1a5b9c] to-[#0d3b66] text-white border-none shadow-[0_8px_30px_rgba(13,59,102,0.3)]'
                  }`}
                >
                  {/* Background Animations */}
                  {weather && (
                    <div className="absolute inset-0 z-0">
                      <WeatherAnimations 
                        condition={weather.condition} 
                        calimaRating={weather.hourly6h && weather.hourly6h.length > 0 ? weather.hourly6h[0].calima : 'Bajo'} 
                        windSpeed={weather.windSpeed}
                      />
                    </div>
                  )}

                  {/* Title & Sun */}
                  <div className="flex justify-between items-start z-20 relative">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-white">{currentCity.name}</h2>
                      <p className="text-sm text-white/80 mt-1">Islas Canarias / España</p>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="flex items-center gap-6 mt-6 md:mt-10 z-20 relative">
                    <div className="text-[80px] md:text-[100px] font-display font-bold leading-none tracking-tighter text-white">
                      {weather ? (tempUnit === 'F' ? Math.round((weather.temp * 9) / 5 + 32) : Math.round(weather.temp)) : '--'}
                      <span className="text-4xl md:text-5xl font-normal align-top leading-none">{tempUnit === 'C' ? '°C' : 'F'}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-white">
                      <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        <span className="text-base md:text-lg font-bold">{weather ? weather.description : 'Cargando...'}</span>
                      </div>
                      <span className="text-xs md:text-sm text-white/90">
                        Viento: {weather ? `${weather.windSpeed.toFixed(0)} km/h (${getWindDirectionText(weather.windDir)})` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Translucent Stats Pill */}
                  <div className="mt-8 z-20 relative bg-white/10 backdrop-blur-md rounded-[20px] p-4 flex justify-between items-center text-sm md:text-base font-medium text-white">
                    <div className="flex flex-col items-center gap-1 w-1/3 border-r border-white/20">
                      <div className="flex items-center gap-1.5 text-white/90"><Droplets className="w-4 h-4 text-blue-200" /> {weather ? `${weather.humidity}%` : '--'}</div>
                      <span className="text-[10px] uppercase tracking-wider text-white/70">Humedad</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-1/3 border-r border-white/20">
                      <div className="flex items-center gap-1.5 text-white/90"><Wind className="w-4 h-4 text-sky-200" /> {weather ? `${weather.windSpeed.toFixed(0)} km/h` : '--'}</div>
                      <span className="text-[10px] uppercase tracking-wider text-white/70">Viento</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-1/3">
                      <div className="flex items-center gap-1.5 text-white/90"><MapPin className="w-4 h-4 text-red-300" /> {Math.abs(currentCity.lat).toFixed(0)}m</div>
                      <span className="text-[10px] uppercase tracking-wider text-white/70">Altitud</span>
                    </div>
                  </div>
                </motion.div>

                {/* Sunrise & Sunset Astronomical Cycle Section */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <SunTracker 
                    city={currentCity} 
                    sunData={weather?.sunData} 
                    activeDarkMode={activeDarkMode} 
                  />
                </motion.div>

                {/* Trend Chart Card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-[#e8e5d8]' 
                      : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
                  }`}
                >
                  {weather?.hourly ? (
                    <TrendChart hourly={weather.hourly} tempUnit={tempUnit} activeDarkMode={activeDarkMode} />
                  ) : (
                    <div className="py-12 text-center text-xs opacity-50 font-mono">Calculando matriz...</div>
                  )}
                </motion.div>

                {/* 12H Detailed Forecast Card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-[#e8e5d8]' 
                      : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className={`text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 ${
                      activeDarkMode ? 'text-[#ffd600]' : 'text-slate-900'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${activeDarkMode ? 'bg-[#ffd600]' : 'bg-amber-500'}`}></span>
                      Pronóstico Detallado Próximas 12 Horas
                    </h3>
                  </div>
                  <div className={`overflow-x-auto rounded-2xl border ${
                    activeDarkMode ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <table className={`w-full text-left text-xs border-collapse min-w-[620px] ${
                      activeDarkMode ? 'text-white' : 'text-[#181c20]'
                    }`}>
                      <thead>
                        <tr className={`border-b font-mono text-[10px] uppercase tracking-wider ${
                          activeDarkMode 
                            ? 'bg-white/5 border-white/10 text-white/50' 
                            : 'bg-amber-100/50 border-slate-200 text-slate-700'
                        }`}>
                          <th className="py-2.5 px-3 font-semibold">Hora</th>
                          <th className="py-2.5 px-3 font-semibold">Temp</th>
                          <th className="py-2.5 px-3 font-semibold">Sensación</th>
                          <th className="py-2.5 px-3 font-semibold">Viento</th>
                          <th className="py-2.5 px-3 font-semibold">Humedad</th>
                          <th className="py-2.5 px-3 font-semibold">Precip(%)</th>
                          <th className="py-2.5 px-3 font-semibold">Calima</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${
                        activeDarkMode ? 'divide-white/5' : 'divide-slate-100'
                      }`}>
                        {weather?.hourly6h?.map((h, idx) => {
                          const calimaColor = 
                            h.calima === 'Alto' ? 'text-red-500 bg-red-500/10' :
                            h.calima === 'Moderado' ? 'text-[#00639a] bg-[#cce5ff]' :
                            activeDarkMode ? 'text-white/40' : 'text-slate-400';
                          return (
                            <tr key={idx} className={`transition ${
                              activeDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/60'
                            }`}>
                              <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{h.hora}</td>
                              <td className={`py-2.5 px-3 font-bold ${activeDarkMode ? 'text-white' : 'text-[#00639a]'}`}>{formatTemperature(h.temp)}</td>
                              <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/70' : 'text-slate-600'}`}>{formatTemperature(h.sensacion)}</td>
                              <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/90' : 'text-slate-800'}`}>{h.vientoVel.toFixed(0)} km/h {h.vientoDir}</td>
                              <td className={`py-2.5 px-3 ${activeDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{h.humedad}%</td>
                              <td className={`py-2.5 px-3 font-bold ${activeDarkMode ? 'text-[#4fd8eb]' : 'text-[#00639a]'}`}>{h.precipProb}%</td>
                              <td className="py-2.5 px-3 font-semibold"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${calimaColor}`}>{h.calima}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </>
            )}

            {/* TAB: PLAYAS & MARÍTIMO */}
            {activeTab === 'playas' && (
              <div className="space-y-6">
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-white' 
                      : 'border-[var(--md-sys-color-outline-variant)]/60 bg-[#eaeff5] text-[#181c20] shadow-lg shadow-black/5'
                  }`}
                >
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 mb-6 ${
                    activeDarkMode ? 'text-[#91cdff]' : 'text-[#00639a]'
                  }`}>
                    <Umbrella className="w-4 h-4" />
                    <span>Estado de las Playas (InfoPlayas)</span>
                  </h3>
                  {weather?.beachInfo && <BeachStatus beachInfo={weather.beachInfo} activeDarkMode={activeDarkMode} />}
                </motion.div>

                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-white' 
                      : 'border-[var(--md-sys-color-outline-variant)]/60 bg-[#eaeff5] text-[#181c20] shadow-lg shadow-black/5'
                  }`}
                >
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 mb-6 ${
                    activeDarkMode ? 'text-[#91cdff]' : 'text-[#00639a]'
                  }`}>
                    <Compass className="w-4 h-4" />
                    <span>Datos Marítimos y Mareas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`text-xs font-mono font-bold tracking-wider uppercase mb-3 ${
                        activeDarkMode ? 'text-white/50' : 'text-[#50606e]'
                      }`}>Estado de la Mar</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Altura del oleaje</span>
                          <span className={`font-mono text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-[#00639a]'}`}>{weather?.marine?.waveHeight?.toFixed(1) || '--'} m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Dirección del oleaje</span>
                          <span className={`font-mono text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-[#00639a]'}`}>{weather?.marine?.waveDirection}°</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>Período de olas</span>
                          <span className={`font-mono text-xs font-bold ${activeDarkMode ? 'text-white' : 'text-[#00639a]'}`}>{weather?.marine?.wavePeriod?.toFixed(1) || '--'} s</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-xs font-mono font-bold tracking-wider uppercase mb-3 ${
                        activeDarkMode ? 'text-white/50' : 'text-[#50606e]'
                      }`}>Mareas (IHM)</h4>
                      <div className={`text-xs mb-3 font-mono ${activeDarkMode ? 'text-white/60' : 'text-[#00639a]'}`}>
                        {weather?.tides?.station || 'Cargando estación...'}
                      </div>
                      <div className="space-y-2.5">
                        {weather?.tides?.mareas?.map((marea, idx) => (
                          <div key={idx} className={`flex justify-between items-center p-3 rounded-2xl border ${
                            activeDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
                          }`}>
                            <span className={`text-xs capitalize font-bold ${
                              marea.tipo === 'pleamar' ? 'text-[#4fd8eb]' : 'text-[#00639a]'
                            }`}>{marea.tipo}</span>
                            <div className="flex gap-4">
                              <span className={`text-xs font-mono ${activeDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{marea.hora}</span>
                              <span className={`text-xs font-mono font-bold ${activeDarkMode ? 'text-white' : 'text-[#00639a]'}`}>{marea.altura} m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {weather?.tides?.curve && <TideChart tides={weather.tides} activeDarkMode={activeDarkMode} />}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* TAB: ALERTAS */}
            {activeTab === 'alertas' && (
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`rounded-[28px] p-6 border backdrop-blur-md md-card ${
                  activeDarkMode 
                    ? 'border-white/10 bg-[#1b2025] text-white' 
                    : 'border-[var(--md-sys-color-outline-variant)]/60 bg-[#eaeff5] text-[#181c20] shadow-lg shadow-black/5'
                }`}
              >
                <div className="mb-4">
                  <h3 className={`text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 ${
                    activeDarkMode ? 'text-[#91cdff]' : 'text-[#00639a]'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${activeDarkMode ? 'bg-[#91cdff]' : 'bg-[#00639a]'}`}></span>
                    Avisos y Alertas AEMET
                  </h3>
                </div>
                {weather?.alertasAemet && weather.alertasAemet.length > 0 ? (
                  <div className={`overflow-x-auto rounded-2xl border ${
                    activeDarkMode ? 'border-white/10' : 'border-slate-300/70'
                  }`}>
                    <table className={`w-full text-left text-xs border-collapse ${
                      activeDarkMode ? 'text-white' : 'text-[#181c20]'
                    }`}>
                      <thead>
                        <tr className={`border-b font-mono text-[10px] uppercase tracking-wider ${
                          activeDarkMode 
                            ? 'bg-white/5 border-white/10 text-white/50' 
                            : 'bg-[#d4e4f6]/60 border-slate-300/70 text-[#0c1d29]'
                        }`}>
                          <th className="py-2.5 px-3 font-semibold">Nivel</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Tipo</th>
                          <th className="py-2.5 px-3 font-semibold">Duración</th>
                          <th className="py-2.5 px-3 font-semibold">Detalle del Aviso</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${
                        activeDarkMode ? 'divide-white/5' : 'divide-slate-200/60'
                      }`}>
                        {weather.alertasAemet.map((al, idx) => {
                          const levelColor = 
                            al.nivel === 'Rojo' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                            al.nivel === 'Naranja' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 
                            'text-[#00639a] bg-[#cce5ff] border-[#00639a]/30';
                          return (
                            <tr key={idx} className={`transition ${
                              activeDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/60'
                            }`}>
                              <td className="py-2.5 px-3"><span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${levelColor}`}>{al.nivel}</span></td>
                              <td className="py-2.5 px-3 text-center text-base">{al.icono}</td>
                              <td className={`py-2.5 px-3 text-xs ${activeDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{al.duracion}</td>
                              <td className={`py-2.5 px-3 font-sans text-xs leading-snug ${activeDarkMode ? 'text-white/95' : 'text-slate-800'}`}>{al.texto}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center py-8 border rounded-2xl text-center gap-2 ${
                    activeDarkMode ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <span className="text-2xl">☀️</span>
                    <span className="text-xs font-mono font-bold tracking-wide">Sin alertas activas</span>
                    <span className={`text-xs ${activeDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Condiciones normales de seguridad en la ubicación</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: ESTACIONES */}
            {activeTab === 'estaciones' && (
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`rounded-[28px] p-6 border backdrop-blur-md flex flex-col items-stretch md-card ${
                  activeDarkMode 
                    ? 'border-white/10 bg-[#1b2025] text-white' 
                    : 'border-[var(--md-sys-color-outline-variant)]/60 bg-[#eaeff5] text-[#181c20] shadow-lg shadow-black/5'
                }`}
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
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`rounded-[28px] p-5 border backdrop-blur-md flex flex-col min-h-[500px] md-card ${
                  activeDarkMode 
                    ? 'border-white/10 bg-[#1b2025] text-white' 
                    : 'border-[var(--md-sys-color-outline-variant)]/60 bg-[#eaeff5] text-[#181c20] shadow-lg shadow-black/5'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-4 px-2">
                  <Satellite className="w-5 h-5 text-[#00639a] dark:text-[#91cdff]" />
                  <h3 className="text-sm font-bold">Radar Meteorológico en Tiempo Real</h3>
                </div>
                <div className="flex-1 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/10">
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

          {/* RIGHT SIDEBAR COLUMN */}
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
                {/* WIDGET ÍNDICE RADIACIÓN UV */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-[#e8e5d8]' 
                      : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
                  }`}
                >
                  <UvIndexIndicator 
                    uvIndex={weather?.uvIndex}
                    activeDarkMode={activeDarkMode} 
                  />
                </motion.div>

                {/* WIDGET CALIDAD DEL AIRE */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-[#e8e5d8]' 
                      : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
                  }`}
                >
                  <AirQualityIndicator 
                    aqi={weather?.aqi} 
                    calimaRating={weather?.hourly6h && weather.hourly6h.length > 0 ? weather.hourly6h[0].calima : 'Bajo'}
                    activeDarkMode={activeDarkMode} 
                  />
                </motion.div>

                {/* WIDGET PRÓXIMOS DÍAS (EN LA BARRA LATERAL) */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-[#e8e5d8]' 
                      : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                      activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'
                    }`}>
                      <Calendar className="w-4 h-4 text-[#ffd600]" />
                      <span>Próximos Días</span>
                    </h3>
                    <span className="text-[11px] font-mono opacity-60">3 Días</span>
                  </div>

                  <div className="space-y-3">
                    {weather?.daily3d?.map((day, idx) => {
                      const uvBadge = 
                        day.uvMax >= 8 ? 'text-red-500 bg-red-500/10 border-red-500/30' : 
                        day.uvMax >= 6 ? 'text-orange-500 bg-orange-500/10 border-orange-500/30' : 
                        day.uvMax >= 3 ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' : 
                        'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';

                      return (
                        <div key={`sidebar-daily3d-${idx}`} className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                          activeDarkMode 
                            ? 'bg-white/5 border-white/10 hover:border-white/20' 
                            : 'bg-white border-amber-100 shadow-2xs hover:border-amber-300'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-xs capitalize">{day.fecha}</span>
                            <span className="text-[11px] font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                              💧 {day.precipProb}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1.5 border-y border-dashed border-slate-200 dark:border-white/10">
                            <div>
                              <span className="text-[9px] font-mono uppercase opacity-60 block">Máx / Mín</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className={`text-lg font-display font-extrabold ${activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'}`}>
                                  {formatTemperature(day.tempMax)}
                                </span>
                                <span className="text-xs font-mono opacity-50">
                                  / {formatTemperature(day.tempMin)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-mono uppercase opacity-60 block">Radiación UV</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${uvBadge}`}>
                                UV {day.uvMax}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* COMPARATIVA METEOROLÓGICA 7 DÍAS (EN LA BARRA LATERAL) */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md md-card ${
                    activeDarkMode 
                      ? 'border-white/10 bg-[#1b2025] text-[#e8e5d8]' 
                      : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                      activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'
                    }`}>
                      <BarChart3 className="w-4 h-4 text-[#ffd600]" />
                      <span>Comparativa • 7 Días</span>
                    </h3>
                    <span className="text-[11px] font-mono opacity-60">Tendencia</span>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="mb-4 p-2 rounded-2xl bg-black/5 dark:bg-white/5">
                    {weather?.daily && (
                      <DailyComparisonChart daily={weather.daily} tempUnit={tempUnit} activeDarkMode={activeDarkMode} />
                    )}
                  </div>

                  {/* Compact Table */}
                  <div className={`overflow-x-auto rounded-xl border ${
                    activeDarkMode ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <table className={`w-full text-left text-xs border-collapse min-w-[340px] ${
                      activeDarkMode ? 'text-white' : 'text-[#181c20]'
                    }`}>
                      <thead>
                        <tr className={`border-b font-mono text-[9px] uppercase tracking-wider ${
                          activeDarkMode 
                            ? 'bg-white/5 border-white/10 text-white/50' 
                            : 'bg-amber-100/50 border-slate-200 text-slate-700'
                        }`}>
                          <th className="py-2 px-2.5 font-semibold">Día</th>
                          <th className="py-2 px-2 font-semibold">Estado</th>
                          <th className="py-2 px-2 font-semibold text-right">Máx/Mín</th>
                          <th className="py-2 px-2 font-semibold text-right">Lluvia</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[10px] ${
                        activeDarkMode ? 'divide-white/5' : 'divide-slate-100'
                      }`}>
                        {weather?.daily?.map((d, idx) => {
                          const dateObj = new Date(d.date);
                          const dayName = !isNaN(dateObj.getTime())
                            ? dateObj.toLocaleDateString('es-ES', { weekday: 'short' })
                            : d.date;
                          const conditionMap: Record<string, { label: string; icon: string }> = {
                            sunny: { label: 'Despejado', icon: '☀️' },
                            cloudy: { label: 'Nuboso', icon: '⛅' },
                            rainy: { label: 'Lluvia', icon: '🌧️' },
                            windy: { label: 'Ventoso', icon: '💨' },
                            storm: { label: 'Tormenta', icon: '⛈️' },
                            foggy: { label: 'Calima', icon: '🌫️' },
                          };
                          const condInfo = conditionMap[d.condition] || { label: 'Variable', icon: '🌤️' };

                          return (
                            <tr key={`sidebar-comp-${idx}`} className={`transition ${
                              activeDarkMode ? 'hover:bg-white/5' : 'hover:bg-amber-50/50'
                            }`}>
                              <td className="py-2 px-2.5 font-bold capitalize">
                                {idx === 0 ? 'Hoy' : idx === 1 ? 'Mañ' : dayName}
                              </td>
                              <td className="py-2 px-2">
                                <span className="inline-flex items-center gap-1">
                                  <span>{condInfo.icon}</span>
                                  <span className="truncate max-w-[65px]">{condInfo.label}</span>
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-bold ${activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'}`}>
                                  {formatTemperature(d.tempMax)}
                                </span>
                                <span className="opacity-50 ml-1">
                                  {formatTemperature(d.tempMin)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-bold ${d.pop > 40 ? 'text-blue-500' : 'opacity-70'}`}>
                                  {d.pop}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </>
            )}

          </div>
        </motion.main>
      </AnimatePresence>

      {/* FOOTER: CRÉDITOS AL AUTOR */}
      <footer id="main-footer" className={`border-t py-6 text-center mt-auto transition-colors duration-300 ${
        activeDarkMode 
          ? 'border-white/10 bg-[#0a0e11] text-white/70' 
          : 'border-slate-200/60 bg-[#ebf0f6] text-slate-600'
      }`}>
        <p className="text-xs font-mono font-medium flex items-center justify-center gap-1.5">
          <span>Desarrollado con 💛 por</span>
          <span className={`font-bold ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#004993]'}`}>
            Aitor Santana
          </span>
        </p>
      </footer>

      {/* Modals */}
      <LocationSelectorModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
        activeDarkMode={activeDarkMode} 
        onSelectCity={handleSelectCity} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        activeDarkMode={activeDarkMode} 
        darkModeSetting={darkModeSetting}
        setDarkModeSetting={setDarkModeSetting}
        tempUnit={tempUnit}
        setTempUnit={setTempUnit}
        isAuthenticated={isAuthenticated}
        onLogin={handleAuthLogin}
        onLogout={handleAuthLogout}
        onLocateUser={handleLocateUser}
      />
      
      <TelemetryModal 
        isOpen={isTelemetryModalOpen} 
        onClose={() => setIsTelemetryModalOpen(false)} 
        activeDarkMode={activeDarkMode} 
      />
    </div>
  );
}
