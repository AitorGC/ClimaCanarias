const fs = require('fs');

const code = `import React, { FormEvent, useState, useRef, useEffect } from 'react';
import { Heart, Search, Star, Trash2, MapPin, Plus, Loader2, Anchor, Radio } from 'lucide-react';
import { City } from '../types';

interface FavoriteCitiesManagerProps {
  favorites: City[];
  currentCity: City;
  onSelectCity: (city: City) => void;
  onAddFavorite: (city: City) => void;
  onRemoveFavorite: (id: string) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  activeDarkMode?: boolean;
}

export const PREDEFINED_BEACHES: City[] = [
  { id: 'b-canteras', name: 'Playa de Las Canteras', lat: 28.1402, lon: -15.4385, country: 'España', state: 'Gran Canaria' },
  { id: 'b-maspalomas', name: 'Playa de Maspalomas', lat: 27.7377, lon: -15.5866, country: 'España', state: 'Gran Canaria' },
  { id: 'b-las-teresitas', name: 'Playa de Las Teresitas', lat: 28.5110, lon: -16.1855, country: 'España', state: 'Tenerife' },
  { id: 'b-famara', name: 'Playa de Famara', lat: 29.1172, lon: -13.5593, country: 'España', state: 'Lanzarote' }
];

export const PREDEFINED_STATIONS: City[] = [
  { id: 's-izana', name: 'Estación de Izaña (AEMET)', lat: 28.3090, lon: -16.4990, country: 'España', state: 'Tenerife' },
  { id: 's-gc-airport', name: 'Aeropuerto Gran Canaria (AEMET)', lat: 27.9319, lon: -15.3866, country: 'España', state: 'Gran Canaria' },
  { id: 's-tfn-airport', name: 'Aeropuerto Tenerife Norte (AEMET)', lat: 28.4826, lon: -16.3415, country: 'España', state: 'Tenerife' }
];

export default function FavoriteCitiesManager({
  favorites,
  currentCity,
  onSelectCity,
  onAddFavorite,
  onRemoveFavorite,
  isAuthenticated,
  onLogin,
  activeDarkMode = true,
}: FavoriteCitiesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'ciudades' | 'playas' | 'estaciones'>('ciudades');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomCoordsForm, setShowCustomCoordsForm] = useState(false);

  useEffect(() => {
    if (searchType !== 'ciudades') {
      const results = searchType === 'playas' ? PREDEFINED_BEACHES : PREDEFINED_STATIONS;
      if (searchQuery.trim()) {
        setSearchResults(results.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())));
      } else {
        setSearchResults(results);
      }
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(\`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(searchQuery)}&count=10&language=es\`);
        const data = await response.json();
        
        if (data.results) {
          const results: City[] = data.results.map((r: any) => ({
            id: \`geo-\${r.id}\`,
            name: r.name,
            lat: r.latitude,
            lon: r.longitude,
            country: r.country,
            state: r.admin1 || r.admin2 || ''
          }));
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, searchType]);

  const handleAddCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert("Por favor ingrese coordenadas válidas.");
      return;
    }
    
    const newCity: City = {
      id: \`custom-\${Date.now()}\`,
      name: customName || \`Coord: \${lat.toFixed(2)}, \${lon.toFixed(2)}\`,
      lat,
      lon,
      country: 'Manual',
      state: ''
    };
    
    onAddFavorite(newCity);
    onSelectCity(newCity);
    
    setCustomLat('');
    setCustomLon('');
    setCustomName('');
    setShowCustomCoordsForm(false);
  };

  return (
    <div className={\`rounded-[24px] p-5 md:p-6 border backdrop-blur-md flex flex-col items-stretch transition-colors duration-300 \${
      activeDarkMode ? 'border-white/10 bg-zinc-900/90 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'
    }\`}>
      {/* Search Header */}
      <div className="mb-4">
        <h3 className={\`text-xs font-mono uppercase tracking-widest flex items-center justify-between gap-2 mb-3 \${
          activeDarkMode ? 'text-teal-400' : 'text-brand-blue font-bold'
        }\`}>
          <div className="flex items-center gap-2">
            <Search className={\`w-4 h-4 \${activeDarkMode ? 'text-teal-400' : 'text-brand-blue'}\`} />
            <span>Buscador y Favoritos</span>
          </div>
        </h3>
        
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => { setSearchType('ciudades'); setSearchQuery(''); }}
            className={\`flex-1 text-[9px] py-1.5 px-2 rounded-lg font-bold flex flex-col items-center gap-1 transition-colors \${
            searchType === 'ciudades' 
              ? activeDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-brand-blue text-white' 
              : activeDarkMode ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'
          }\`}>
            <MapPin className="w-3.5 h-3.5" />
            Municipios
          </button>
          <button 
            onClick={() => { setSearchType('playas'); setSearchQuery(''); }}
            className={\`flex-1 text-[9px] py-1.5 px-2 rounded-lg font-bold flex flex-col items-center gap-1 transition-colors \${
            searchType === 'playas' 
              ? activeDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-brand-blue text-white' 
              : activeDarkMode ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'
          }\`}>
            <Anchor className="w-3.5 h-3.5" />
            Playas
          </button>
          <button 
             onClick={() => { setSearchType('estaciones'); setSearchQuery(''); }}
            className={\`flex-1 text-[9px] py-1.5 px-2 rounded-lg font-bold flex flex-col items-center gap-1 transition-colors \${
            searchType === 'estaciones' 
              ? activeDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-brand-blue text-white' 
              : activeDarkMode ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'
          }\`}>
            <Radio className="w-3.5 h-3.5" />
            Estaciones
          </button>
        </div>
        
        <div className="relative">
          <label htmlFor="city-search-input" className="sr-only">Buscar lugares...</label>
          <input
            id="city-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              searchType === 'ciudades' ? "Buscar municipio mundial..." 
              : searchType === 'playas' ? "Buscar playas (Canarias)..." 
              : "Buscar estaciones AEMET..."
            }
            className={\`w-full text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-hidden border transition-colors \${
              activeDarkMode 
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/20' 
                : 'bg-slate-50 border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
            }\`}
          />
          {isSearching ? (
             <Loader2 className={\`absolute left-3 top-2.5 w-4 h-4 animate-spin \${
              activeDarkMode ? 'text-white/40' : 'text-slate-400'
            }\`} />
          ) : (
            <Search className={\`absolute left-3 top-2.5 w-4 h-4 \${
              activeDarkMode ? 'text-white/40' : 'text-slate-400'
            }\`} />
          )}
        </div>

        {searchResults.length > 0 && (
          <div className={\`mt-2 rounded-xl border max-h-48 overflow-y-auto \${
            activeDarkMode ? 'bg-zinc-800/90 border-white/10' : 'bg-white border-slate-200 shadow-lg'
          }\`}>
            {searchResults.map((city) => (
              <button
                key={city.id}
                onClick={() => {
                  onSelectCity(city);
                  setSearchQuery('');
                  setSearchType('ciudades');
                  setSearchResults([]);
                }}
                className={\`w-full text-left px-4 py-2.5 text-xs flex justify-between items-center transition \${
                  activeDarkMode 
                    ? 'hover:bg-white/10 text-white' 
                    : 'hover:bg-blue-50 text-slate-800 hover:text-brand-blue'
                }\`}
              >
                <div>
                  <span className="font-semibold">{city.name}</span>
                  <span className={\`ml-2 text-[10px] \${
                    activeDarkMode ? 'text-white/50' : 'text-slate-500'
                  }\`}>
                    {city.state ? \`\${city.state}, \` : ''}{city.country}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFavorite(city);
                    setSearchQuery('');
                    setSearchType('ciudades');
                    setSearchResults([]);
                  }}
                  className={\`p-1.5 rounded-full \${
                    activeDarkMode ? 'hover:bg-white/20 text-white/50' : 'hover:bg-blue-100 text-brand-blue/60'
                  }\`}
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation list of active favorite cities */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-40 md:max-h-56 select-none pr-1 mb-3">
        {favorites.length === 0 ? (
          <div className={\`h-full flex flex-col justify-center items-center py-6 text-center border-2 border-dashed rounded-2xl \${
            activeDarkMode ? 'border-white/10' : 'border-slate-200 bg-slate-50/20'
          }\`}>
            <Heart className={\`w-5 h-5 mb-1 \${activeDarkMode ? 'text-white/20' : 'text-slate-350'}\`} />
            <p className={\`text-[10px] \${activeDarkMode ? 'text-white/40' : 'text-slate-400'}\`}>No hay favoritos guardados</p>
          </div>
        ) : (
          favorites.map((city) => {
            const isSelected = city.id === currentCity.id;
            return (
              <div
                key={city.id}
                className={\`flex justify-between items-center rounded-2xl p-3 border transition duration-300 \${
                  isSelected
                    ? activeDarkMode
                      ? 'bg-white/10 border-white/25 text-white'
                      : 'bg-blue-50 border-brand-blue/30 text-brand-blue font-semibold shadow-2xs'
                    : activeDarkMode
                      ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                      : 'bg-[#ffffff] border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-brand-blue/20 hover:text-brand-blue shadow-3xs'
                }\`}
              >
                <button
                  onClick={() => onSelectCity(city)}
                  className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <MapPin className={\`w-3.5 h-3.5 \${
                    isSelected 
                      ? activeDarkMode ? 'text-white' : 'text-brand-blue' 
                      : activeDarkMode ? 'text-white/30' : 'text-slate-400'
                  }\`} />
                  <div>
                    <span className={\`text-xs block leading-tight \${
                      isSelected
                        ? activeDarkMode ? 'text-white font-normal' : 'text-brand-blue font-bold'
                        : activeDarkMode ? 'text-white/90 font-light' : 'text-slate-750 font-normal'
                    }\`}>{city.name}</span>
                    <span className={\`text-[9px] block font-mono mt-0.5 \${
                      isSelected
                        ? activeDarkMode ? 'text-white/40' : 'text-brand-blue/60'
                        : activeDarkMode ? 'text-white/30' : 'text-slate-400'
                    }\`}>
                      {city.lat.toFixed(2)}°N • {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? 'E' : 'O'}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => onRemoveFavorite(city.id)}
                  className={\`p-1 rounded-lg transition cursor-pointer \${
                    activeDarkMode 
                      ? 'text-white/30 hover:text-red-400' 
                      : 'text-slate-400 hover:text-red-500'
                  }\`}
                  title="Eliminar de favoritos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Button to toggle Custom Coordinates manual tool */}
      <div className={\`border-t pt-3 \${activeDarkMode ? 'border-white/5' : 'border-slate-100'}\`}>
        <button
          onClick={() => setShowCustomCoordsForm(!showCustomCoordsForm)}
          className={\`w-full py-1.5 flex justify-center items-center gap-1 border border-dashed rounded-xl text-[10px] font-mono font-medium transition cursor-pointer \${
            activeDarkMode
              ? 'border-white/10 hover:border-white/20 bg-white/5 text-white/55'
              : 'border-brand-blue/30 hover:border-brand-blue/50 bg-blue-50/30 text-brand-blue'
          }\`}
        >
          <Plus className={\`w-3 h-3 \${activeDarkMode ? 'text-white/40' : 'text-brand-blue'}\`} />
          {showCustomCoordsForm ? 'OCULTAR COORDENADAS MANUALES' : 'AÑADIR COORDENADAS MANUALES'}
        </button>

        {showCustomCoordsForm && (
          <form onSubmit={handleAddCustomCoords} className="mt-2.5 space-y-2 duration-300">
            <div>
              <label htmlFor="custom-coords-name" className={\`text-[9px] font-mono block mb-0.5 \${
                activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'
              }\`}>NOMBRE UBICACIÓN</label>
              <input
                id="custom-coords-name"
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej. Faro de Fisterra"
                className={\`w-full text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden border \${
                  activeDarkMode 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/20' 
                    : 'bg-[#ffffff] border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
                }\`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="custom-coords-lat" className={\`text-[9px] font-mono block mb-0.5 \${
                  activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'
                }\`}>LATITUD (-90 a 90)</label>
                <input
                  id="custom-coords-lat"
                  type="number"
                  step="0.0001"
                  required
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="Ej. 42.88"
                  className={\`w-full text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden border \${
                    activeDarkMode 
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/20' 
                      : 'bg-[#ffffff] border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
                  }\`}
                />
              </div>
              <div>
                <label htmlFor="custom-coords-lon" className={\`text-[9px] font-mono block mb-0.5 \${
                  activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'
                }\`}>LONGITUD (-180 a 180)</label>
                <input
                  id="custom-coords-lon"
                  type="number"
                  step="0.0001"
                  required
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  placeholder="Ej. -9.26"
                  className={\`w-full text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden border \${
                    activeDarkMode 
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/20' 
                      : 'bg-[#ffffff] border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
                  }\`}
                />
              </div>
            </div>
            <button
              type="submit"
              className={\`w-full py-2 rounded-xl text-xs font-semibold transition duration-300 cursor-pointer \${
                activeDarkMode 
                  ? 'bg-white hover:bg-white/90 text-black shadow-lg' 
                  : 'bg-brand-blue hover:bg-brand-blue-hover text-white shadow-md shadow-brand-blue/15'
              }\`}
            >
              Ubicación a Favoritos
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/FavoriteCitiesManager.tsx', code);
