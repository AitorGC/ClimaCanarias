/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, FormEvent } from 'react';
import { Heart, Search, Star, Trash2, MapPin, Plus, RefreshCw, LogIn } from 'lucide-react';
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

// Pre-defined search database of awesome cities in Spain and Europe
export const PREDEFINED_CITIES: City[] = [
  { id: 'laspalmas', name: 'Las Palmas de GC', lat: 28.1235, lon: -15.4363, country: 'España', state: 'Gran Canaria' },
  { id: 'santacruz', name: 'Santa Cruz de Tenerife', lat: 28.4636, lon: -16.2518, country: 'España', state: 'Tenerife' },
  { id: 'lalaguna', name: 'La Laguna', lat: 28.4853, lon: -16.3201, country: 'España', state: 'Tenerife' },
  { id: 'arrecife', name: 'Arrecife', lat: 28.9630, lon: -13.5477, country: 'España', state: 'Lanzarote' },
  { id: 'puerto', name: 'Puerto del Rosario', lat: 28.5008, lon: -13.8627, country: 'España', state: 'Fuerteventura' },
  { id: 'scpalma', name: 'Santa Cruz de La Palma', lat: 28.6835, lon: -17.7642, country: 'España', state: 'La Palma' },
  { id: 'sansebastian', name: 'San Sebastián de La Gomera', lat: 28.0916, lon: -17.1133, country: 'España', state: 'La Gomera' },
  { id: 'valverde', name: 'Valverde', lat: 27.8063, lon: -17.9158, country: 'España', state: 'El Hierro' },
  { id: 'telde', name: 'Telde', lat: 27.9942, lon: -15.4158, country: 'España', state: 'Gran Canaria' },
  { id: 'maspalomas', name: 'Maspalomas', lat: 27.7606, lon: -15.5860, country: 'España', state: 'Gran Canaria' },
  { id: 'adeje', name: 'Adeje', lat: 28.1188, lon: -16.7291, country: 'España', state: 'Tenerife' },
  { id: 'corralejo', name: 'Corralejo', lat: 28.7292, lon: -13.8679, country: 'España', state: 'Fuerteventura' }
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
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomCoordsForm, setShowCustomCoordsForm] = useState(false);

  // Filter search results based on query
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 1) {
      const filtered = PREDEFINED_CITIES.filter((city) =>
        city.name.toLowerCase().includes(query.toLowerCase()) || 
        (city.state && city.state.toLowerCase().includes(query.toLowerCase())) ||
        (city.country && city.country.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  // Select search result
  const handleSelectResult = (city: City) => {
    onSelectCity(city);
    // Add to favorites if not already there
    if (!favorites.some((fav) => fav.id === city.id)) {
      onAddFavorite(city);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add custom coordinate manual entry
  const handleAddCustomCoords = (e: FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(customLat);
    const lonNum = parseFloat(customLon);

    if (!customName.trim()) return;
    if (isNaN(latNum) || latNum < -90 || latNum > 90) return;
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) return;

    const newCity: City = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      lat: latNum,
      lon: lonNum,
      country: 'Personalizado',
    };

    onSelectCity(newCity);
    onAddFavorite(newCity);

    // Reset form
    setCustomName('');
    setCustomLat('');
    setCustomLon('');
    setShowCustomCoordsForm(false);
  };

  return (
    <div id="fav-manager-card" className={`rounded-[24px] p-5 flex flex-col h-full backdrop-blur-md transition-all duration-300 ${
      activeDarkMode 
        ? 'bg-white/5 border border-white/5 text-white' 
        : 'bg-[#ffffff] border border-slate-200/80 text-slate-800 shadow-xl shadow-brand-blue/2'
    }`}>
      <div className={`flex justify-between items-center mb-4 border-b pb-3 ${
        activeDarkMode ? 'border-white/5' : 'border-slate-100'
      }`}>
        <div>
          <h3 className={`font-display font-light text-sm flex items-center gap-2 ${
            activeDarkMode ? 'text-white' : 'text-slate-800'
          }`}>
            <Star className={`w-4 h-4 ${activeDarkMode ? 'text-white/80 fill-white/10' : 'text-amber-500 fill-amber-500/10'}`} />
            Mis Favoritos
          </h3>
          <p className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 ${
            activeDarkMode ? 'text-white/40' : 'text-slate-400'
          }`}>
            SOPORTE DE CIUDADES MÚLTIPLES
          </p>
        </div>

        {/* Firebase Synchronization Sync Status */}
        {isAuthenticated ? (
          <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-sans ${
            activeDarkMode 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
              : 'bg-emerald-100/60 text-emerald-700 border border-emerald-200'
          }`}>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            SYNC ACTIVO
          </span>
        ) : (
          <button
            id="fav-btn-login-cloud"
            onClick={onLogin}
            className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all duration-300 cursor-pointer ${
              activeDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10' 
                : 'bg-blue-50/50 hover:bg-blue-50 text-brand-blue border border-brand-blue/20 font-semibold'
            }`}
          >
            <LogIn className={`w-3 h-3 ${activeDarkMode ? 'text-white/80' : 'text-brand-blue'}`} />
            CONECTAR NUBE
          </button>
        )}
      </div>

      {/* Dynamic Search Autocomplete */}
      <div className="relative mb-3">
        <label htmlFor="city-search-input" className="sr-only">Buscar ciudad</label>
        <div className={`flex items-center rounded-2xl px-3 py-2 border transition-all duration-300 ${
          activeDarkMode 
            ? 'bg-white/5 border-white/5 text-white/60 focus-within:border-white/15 focus-within:ring-1 focus-within:ring-white/10' 
            : 'bg-slate-50/50 border-slate-250 text-slate-700 focus-within:border-brand-blue/30 focus-within:ring-1 focus-within:ring-brand-blue/5'
        }`}>
          <Search className={`w-4 h-4 mr-2 ${activeDarkMode ? 'text-white/30' : 'text-slate-400'}`} />
          <input
            id="city-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar ciudad española o europea..."
            className={`w-full bg-transparent text-xs focus:outline-hidden ${
              activeDarkMode ? 'text-white placeholder-white/30' : 'text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className={`absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto border rounded-2xl shadow-2xl py-1 divide-y ${
            activeDarkMode 
              ? 'bg-zinc-950 border-white/10 divide-white/5' 
              : 'bg-white border-slate-200/80 divide-slate-100 text-slate-700'
          }`}>
            {searchResults.map((city) => (
              <button
                key={city.id}
                id={`search-item-${city.id}`}
                onClick={() => handleSelectResult(city)}
                className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between cursor-pointer ${
                  activeDarkMode 
                    ? 'text-white/80 hover:bg-white/5 hover:text-white' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="font-medium">{city.name}</span>
                <span className={`text-[10px] italic ${activeDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                  {city.state ? `${city.state}, ` : ''}{city.country}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation list of active favorite cities */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-40 md:max-h-56 select-none pr-1 mb-3">
        {favorites.length === 0 ? (
          <div className={`h-full flex flex-col justify-center items-center py-6 text-center border-2 border-dashed rounded-2xl ${
            activeDarkMode ? 'border-white/10' : 'border-slate-200 bg-slate-50/20'
          }`}>
            <Heart className={`w-5 h-5 mb-1 ${activeDarkMode ? 'text-white/20' : 'text-slate-350'}`} />
            <p className={`text-[10px] ${activeDarkMode ? 'text-white/40' : 'text-slate-400'}`}>No hay favoritos guardados</p>
          </div>
        ) : (
          favorites.map((city) => {
            const isSelected = city.id === currentCity.id;
            return (
              <div
                key={city.id}
                id={`favorite-item-row-${city.id}`}
                className={`flex justify-between items-center rounded-2xl p-3 border transition duration-300 ${
                  isSelected
                    ? activeDarkMode
                      ? 'bg-white/10 border-white/25 text-white'
                      : 'bg-blue-50 border-brand-blue/30 text-brand-blue font-semibold shadow-2xs'
                    : activeDarkMode
                      ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                      : 'bg-[#ffffff] border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-brand-blue/20 hover:text-brand-blue shadow-3xs'
                }`}
              >
                <button
                  id={`favorite-select-btn-${city.id}`}
                  onClick={() => onSelectCity(city)}
                  className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <MapPin className={`w-3.5 h-3.5 ${
                    isSelected 
                      ? activeDarkMode ? 'text-white' : 'text-brand-blue' 
                      : activeDarkMode ? 'text-white/30' : 'text-slate-400'
                  }`} />
                  <div>
                    <span className={`text-xs block leading-tight ${
                      isSelected
                        ? activeDarkMode ? 'text-white font-normal' : 'text-brand-blue font-bold'
                        : activeDarkMode ? 'text-white/90 font-light' : 'text-slate-750 font-normal'
                    }`}>{city.name}</span>
                    <span className={`text-[9px] block font-mono mt-0.5 ${
                      isSelected
                        ? activeDarkMode ? 'text-white/40' : 'text-brand-blue/60'
                        : activeDarkMode ? 'text-white/30' : 'text-slate-400'
                    }`}>
                      {city.lat.toFixed(2)}°N • {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? 'E' : 'O'}
                    </span>
                  </div>
                </button>

                <button
                  id={`favorite-delete-btn-${city.id}`}
                  onClick={() => onRemoveFavorite(city.id)}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    activeDarkMode 
                      ? 'text-white/30 hover:text-red-400' 
                      : 'text-slate-400 hover:text-red-500'
                  }`}
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
      <div className={`border-t pt-3 ${activeDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
        <button
          id="fav-btn-toggle-custom"
          onClick={() => setShowCustomCoordsForm(!showCustomCoordsForm)}
          className={`w-full py-1.5 flex justify-center items-center gap-1 border border-dashed rounded-xl text-[10px] font-mono font-medium transition cursor-pointer ${
            activeDarkMode
              ? 'border-white/10 hover:border-white/20 bg-white/5 text-white/55'
              : 'border-brand-blue/30 hover:border-brand-blue/50 bg-blue-50/30 text-brand-blue'
          }`}
        >
          <Plus className={`w-3 h-3 ${activeDarkMode ? 'text-white/40' : 'text-brand-blue'}`} />
          {showCustomCoordsForm ? 'OCULTAR COORDENADAS MANUALES' : 'AÑADIR COORDENADAS MANUALES'}
        </button>

        {showCustomCoordsForm && (
          <form onSubmit={handleAddCustomCoords} className="mt-2.5 space-y-2 duration-300">
            <div>
              <label htmlFor="custom-coords-name" className={`text-[9px] font-mono block mb-0.5 ${
                activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'
              }`}>NOMBRE UBICACIÓN</label>
              <input
                id="custom-coords-name"
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej. Faro de Fisterra"
                className={`w-full text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden border ${
                  activeDarkMode 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/20' 
                    : 'bg-[#ffffff] border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
                }`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="custom-coords-lat" className={`text-[9px] font-mono block mb-0.5 ${
                  activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'
                }`}>LATITUD (-90 a 90)</label>
                <input
                  id="custom-coords-lat"
                  type="number"
                  step="0.0001"
                  required
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="Ej. 42.88"
                  className={`w-full text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden border ${
                    activeDarkMode 
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/20' 
                      : 'bg-[#ffffff] border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="custom-coords-lon" className={`text-[9px] font-mono block mb-0.5 ${
                  activeDarkMode ? 'text-white/40' : 'text-brand-blue/70 font-semibold'
                }`}>LONGITUD (-180 a 180)</label>
                <input
                  id="custom-coords-lon"
                  type="number"
                  step="0.0001"
                  required
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  placeholder="Ej. -9.26"
                  className={`w-full text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden border ${
                    activeDarkMode 
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/20' 
                      : 'bg-[#ffffff] border-slate-205 text-slate-805 placeholder-slate-400 focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/10'
                  }`}
                />
              </div>
            </div>
            <button
              id="custom-coords-submit"
              type="submit"
              className={`w-full py-2 rounded-xl text-xs font-semibold transition duration-300 cursor-pointer ${
                activeDarkMode 
                  ? 'bg-white hover:bg-white/90 text-black shadow-lg' 
                  : 'bg-brand-blue hover:bg-brand-blue-hover text-white shadow-md shadow-brand-blue/15'
              }`}
            >
              Ubicación a Favoritos
            </button>
          </form>
        )}
      </div>
    </div>
  );

}
