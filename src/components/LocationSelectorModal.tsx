import { useState, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MapPin, Plus, Loader2, Check } from 'lucide-react';
import { City } from '../types';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDarkMode: boolean;
  onSelectCity: (city: City) => void;
}

const POPULAR_CANARY_SUGGESTIONS: City[] = [
  { id: 'laspalmas', name: 'Las Palmas de GC', lat: 28.1235, lon: -15.4363, country: 'España', state: 'Gran Canaria' },
  { id: 'maspalomas', name: 'Maspalomas', lat: 27.7606, lon: -15.5860, country: 'España', state: 'Gran Canaria' },
  { id: 'santacruz', name: 'Santa Cruz de Tenerife', lat: 28.4636, lon: -16.2518, country: 'España', state: 'Tenerife' },
  { id: 'lalaguna', name: 'La Laguna', lat: 28.4853, lon: -16.3201, country: 'España', state: 'Tenerife' },
  { id: 'puertocruz', name: 'Puerto de la Cruz', lat: 28.4167, lon: -16.5500, country: 'España', state: 'Tenerife' },
  { id: 'adeje', name: 'Adeje', lat: 28.1227, lon: -16.7260, country: 'España', state: 'Tenerife' },
  { id: 'arrecife', name: 'Arrecife', lat: 28.9630, lon: -13.5477, country: 'España', state: 'Lanzarote' },
  { id: 'corralejo', name: 'Corralejo', lat: 28.7366, lon: -13.8674, country: 'España', state: 'Fuerteventura' },
  { id: 'santacruzlapalma', name: 'Santa Cruz de La Palma', lat: 28.6835, lon: -17.7642, country: 'España', state: 'La Palma' },
  { id: 'sansebastian', name: 'San Sebastián de La Gomera', lat: 28.0916, lon: -17.1133, country: 'España', state: 'La Gomera' },
  { id: 'valverde', name: 'Valverde', lat: 27.8063, lon: -17.9158, country: 'España', state: 'El Hierro' },
];

export default function LocationSelectorModal({ isOpen, onClose, activeDarkMode, onSelectCity }: LocationSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addedCityName, setAddedCityName] = useState<string | null>(null);

  if (!isOpen) return null;

  const performSearch = async (query: string): Promise<City[]> => {
    const q = query.trim();
    if (!q) return [];

    // Check predefined popular Canary suggestions first for exact or partial name match
    const localMatches = POPULAR_CANARY_SUGGESTIONS.filter(item =>
      item.name.toLowerCase().includes(q.toLowerCase()) ||
      (item.state && item.state.toLowerCase().includes(q.toLowerCase()))
    );

    let apiResults: City[] = [];
    try {
      const response = await fetch(`/api/geocoding?name=${encodeURIComponent(q)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          apiResults = data.results.map((r: any) => ({
            id: `geo-${r.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: r.name,
            lat: Number(r.latitude.toFixed(4)),
            lon: Number(r.longitude.toFixed(4)),
            country: r.country || 'España',
            state: r.admin1 || r.country || ''
          }));
        }
      }
    } catch {
      // Fallback direct open-meteo geocoding
      try {
        const direct = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=es&format=json`);
        if (direct.ok) {
          const directData = await direct.json();
          if (directData.results && Array.isArray(directData.results)) {
            apiResults = directData.results.map((r: any) => ({
              id: `geo-${r.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: r.name,
              lat: Number(r.latitude.toFixed(4)),
              lon: Number(r.longitude.toFixed(4)),
              country: r.country || 'España',
              state: r.admin1 || r.country || ''
            }));
          }
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    }

    // Combine local matches and api results without duplicates
    const combined: City[] = [...localMatches];
    for (const item of apiResults) {
      if (!combined.some(c => c.name.toLowerCase() === item.name.toLowerCase())) {
        combined.push(item);
      }
    }
    return combined;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSearchError(null);
  };

  const handleSelectAndAdd = (city: City) => {
    setAddedCityName(city.name);
    onSelectCity(city);
    setTimeout(() => {
      onClose();
      setAddedCityName(null);
      setSearchQuery('');
      setSearchResults([]);
    }, 450);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchError('Por favor escribe el nombre de una ubicación.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await performSearch(q);
      setSearchResults(results);
      if (results.length > 0) {
        // Automatically add and select the best match
        handleSelectAndAdd(results[0]);
      } else {
        setSearchError(`No se encontraron resultados para "${q}". Intenta con otro nombre de municipio o playa.`);
      }
    } catch {
      setSearchError('Hubo un error al buscar la ubicación. Inténtalo de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg flex flex-col overflow-hidden rounded-[28px] shadow-2xl z-10 ${
            activeDarkMode ? 'bg-[#1b2025] text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'
          }`}
        >
          {/* Header */}
          <div className="p-5 md:p-6 border-b shrink-0 flex justify-between items-center dark:border-white/10 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${activeDarkMode ? 'bg-white/10 text-[#ffd600]' : 'bg-blue-50 text-[#004993]'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-display font-bold">Añadir Ubicación</h2>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className={`p-2 rounded-full transition-colors cursor-pointer ${activeDarkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-600'}`}
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form with Search Input and "Buscar y Añadir" Button */}
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
            <div>
              <label htmlFor="location-search-input" className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
                activeDarkMode ? 'text-white/70' : 'text-slate-600'
              }`}>
                Escribe la ubicación
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                activeDarkMode 
                  ? 'bg-white/5 border-white/15 focus-within:border-[#ffd600] text-white' 
                  : 'bg-slate-50 border-slate-200 focus-within:border-[#004993] focus-within:bg-white text-slate-900 shadow-2xs'
              }`}>
                <Search className={`w-5 h-5 shrink-0 ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#004993]'}`} />
                <input 
                  id="location-search-input"
                  type="text"
                  autoFocus
                  placeholder="Ej. Maspalomas, Adeje, Corralejo, La Laguna..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="bg-transparent border-none outline-none w-full text-sm font-sans placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchError(null); }}
                    className="text-xs text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* "Buscar y Añadir" Button */}
            <button
              type="submit"
              disabled={isSearching}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                activeDarkMode 
                  ? 'bg-[#ffd600] hover:bg-[#ffe24d] text-slate-950 hover:shadow-[#ffd600]/20 active:scale-[0.99]' 
                  : 'bg-[#004993] hover:bg-[#003d7a] text-white hover:shadow-blue-900/20 active:scale-[0.99]'
              } ${isSearching ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : addedCityName ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Añadida {addedCityName}!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Buscar y Añadir</span>
                </>
              )}
            </button>

            {searchError && (
              <div className="p-3 rounded-xl text-xs font-mono bg-red-500/10 border border-red-500/20 text-red-400">
                {searchError}
              </div>
            )}
          </form>

          {/* Quick Suggestions & Results */}
          <div className="px-5 md:px-6 pb-6 pt-1 border-t dark:border-white/10 border-slate-100 max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div>
                <p className={`text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                  Resultados encontrados ({searchResults.length}):
                </p>
                <div className="space-y-1.5">
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectAndAdd(city)}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                        activeDarkMode 
                          ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`w-4 h-4 shrink-0 ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#004993]'}`} />
                        <div>
                          <div className="font-semibold text-sm">{city.name}</div>
                          <div className="text-[11px] opacity-60 font-mono">
                            {city.state ? `${city.state} • ` : ''}{city.lat.toFixed(2)}, {city.lon.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        activeDarkMode ? 'bg-[#ffd600]/15 text-[#ffd600]' : 'bg-blue-100 text-[#004993]'
                      }`}>
                        Añadir
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className={`text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5 ${activeDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                  Sugerencias canarias:
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CANARY_SUGGESTIONS.slice(0, 8).map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectAndAdd(city)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        activeDarkMode 
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90 hover:text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Plus className="w-3 h-3 opacity-60" />
                      <span>{city.name}</span>
                    </button>
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
