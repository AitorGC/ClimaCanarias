import React, { useState } from 'react';
import { Heart, Trash2, MapPin, Plus } from 'lucide-react';
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

export const PREDEFINED_CITIES: City[] = [
  { id: 'laspalmas', name: 'Las Palmas de GC', lat: 28.1235, lon: -15.4363, country: 'España', state: 'Gran Canaria' },
  { id: 'santacruz', name: 'Santa Cruz de Tenerife', lat: 28.4636, lon: -16.2518, country: 'España', state: 'Tenerife' },
  { id: 'lalaguna', name: 'La Laguna', lat: 28.4853, lon: -16.3201, country: 'España', state: 'Tenerife' },
  { id: 'arrecife', name: 'Arrecife', lat: 28.9630, lon: -13.5477, country: 'España', state: 'Lanzarote' }
];

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
  activeDarkMode = true,
}: FavoriteCitiesManagerProps) {
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomCoordsForm, setShowCustomCoordsForm] = useState(false);

  const handleAddCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert("Por favor ingrese coordenadas válidas.");
      return;
    }
    
    const newCity: City = {
      id: `custom-${Date.now()}`,
      name: customName || `Coord: ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
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
    <div className={`rounded-[28px] p-5 md:p-6 border backdrop-blur-md flex flex-col items-stretch transition-colors duration-300 md-card ${
      activeDarkMode 
        ? 'border-white/10 bg-[#1e2227] text-[#e8e5d8]' 
        : 'border-amber-200/70 bg-[#fffef7] text-[#1c1c18] shadow-lg shadow-amber-500/5'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
          activeDarkMode ? 'text-[#ffd600]' : 'text-amber-900'
        }`}>
          <Heart className="w-4 h-4 text-[#f5cf00] fill-current" />
          <span>Ubicaciones Favoritas</span>
        </span>
        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
          activeDarkMode ? 'bg-white/10 text-white/70' : 'bg-amber-100 text-amber-900'
        }`}>
          {favorites.length} guardadas
        </span>
      </div>

      {/* Material 3 List of Favorites */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-48 md:max-h-60 select-none pr-1 mb-3 no-scrollbar">
        {favorites.length === 0 ? (
          <div className={`h-full flex flex-col justify-center items-center py-6 text-center border-2 border-dashed rounded-2xl ${
            activeDarkMode ? 'border-white/10' : 'border-amber-200 bg-amber-50/30'
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
                className={`flex justify-between items-center rounded-2xl p-3 border transition duration-200 ${
                  isSelected
                    ? activeDarkMode
                      ? 'bg-[#ffd600]/25 border-[#ffd600]/50 text-white shadow-xs'
                      : 'bg-[#fff5b8] border-[#f5cf00] text-slate-950 font-semibold shadow-xs'
                    : activeDarkMode
                      ? 'bg-[#14171a]/80 border-white/5 text-white/80 hover:bg-white/10 hover:border-white/15'
                      : 'bg-white border-amber-100 text-slate-700 hover:bg-amber-50/80 hover:border-amber-300 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectCity(city)}
                  className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <MapPin className={`w-4 h-4 shrink-0 ${
                    isSelected 
                      ? activeDarkMode ? 'text-[#ffd600]' : 'text-[#d6a100]' 
                      : activeDarkMode ? 'text-white/30' : 'text-slate-400'
                  }`} />
                  <div>
                    <span className={`text-xs block leading-tight ${
                      isSelected
                        ? activeDarkMode ? 'text-[#ffd600] font-bold' : 'text-slate-900 font-bold'
                        : activeDarkMode ? 'text-white/90 font-normal' : 'text-slate-800 font-normal'
                    }`}>{city.name}</span>
                    <span className={`text-[9px] block font-mono mt-0.5 ${
                      isSelected
                        ? activeDarkMode ? 'text-white/60' : 'text-slate-600'
                        : activeDarkMode ? 'text-white/30' : 'text-slate-400'
                    }`}>
                      {city.lat.toFixed(2)}°N • {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? 'E' : 'O'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(city.id);
                  }}
                  className={`p-1.5 rounded-full transition cursor-pointer ${
                    activeDarkMode 
                      ? 'text-white/30 hover:text-red-400 hover:bg-white/10' 
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
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
      <div className={`border-t pt-3 ${activeDarkMode ? 'border-white/10' : 'border-amber-200/80'}`}>
        <button
          type="button"
          onClick={() => setShowCustomCoordsForm(!showCustomCoordsForm)}
          className={`w-full py-2 px-3 flex justify-center items-center gap-1.5 border border-dashed rounded-full text-[10px] font-mono font-bold transition cursor-pointer ${
            activeDarkMode
              ? 'border-[#ffd600]/40 hover:border-[#ffd600] bg-[#ffd600]/10 text-[#ffd600]'
              : 'border-[#f5cf00] hover:border-[#d6a100] bg-amber-50 text-amber-900'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 ${activeDarkMode ? 'text-[#ffd600]' : 'text-[#d6a100]'}`} />
          {showCustomCoordsForm ? 'OCULTAR COORDENADAS' : 'AÑADIR COORDENADAS MANUALES'}
        </button>

        {showCustomCoordsForm && (
          <form onSubmit={handleAddCustomCoords} className="mt-3 space-y-2.5 duration-300">
            <div>
              <label htmlFor="custom-coords-name" className={`text-[9px] font-mono block mb-1 font-semibold ${
                activeDarkMode ? 'text-white/50' : 'text-slate-600'
              }`}>NOMBRE UBICACIÓN</label>
              <input
                id="custom-coords-name"
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej. Faro de Maspalomas"
                className={`w-full text-xs rounded-xl px-3 py-2 focus:outline-hidden border ${
                  activeDarkMode 
                    ? 'bg-[#14171a] border-white/10 text-white placeholder-white/30 focus:border-[#ffd600]' 
                    : 'bg-white border-amber-300 text-slate-800 placeholder-slate-400 focus:border-[#f5cf00]'
                }`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="custom-coords-lat" className={`text-[9px] font-mono block mb-1 font-semibold ${
                  activeDarkMode ? 'text-white/50' : 'text-slate-600'
                }`}>LATITUD (-90 a 90)</label>
                <input
                  id="custom-coords-lat"
                  type="number"
                  step="0.0001"
                  required
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="Ej. 27.73"
                  className={`w-full text-xs rounded-xl px-3 py-2 focus:outline-hidden border ${
                    activeDarkMode 
                      ? 'bg-[#14171a] border-white/10 text-white placeholder-white/30 focus:border-[#ffd600]' 
                      : 'bg-white border-amber-300 text-slate-800 placeholder-slate-400 focus:border-[#f5cf00]'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="custom-coords-lon" className={`text-[9px] font-mono block mb-1 font-semibold ${
                  activeDarkMode ? 'text-white/50' : 'text-slate-600'
                }`}>LONGITUD (-180 a 180)</label>
                <input
                  id="custom-coords-lon"
                  type="number"
                  step="0.0001"
                  required
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  placeholder="Ej. -15.58"
                  className={`w-full text-xs rounded-xl px-3 py-2 focus:outline-hidden border ${
                    activeDarkMode 
                      ? 'bg-[#14171a] border-white/10 text-white placeholder-white/30 focus:border-[#ffd600]' 
                      : 'bg-white border-amber-300 text-slate-800 placeholder-slate-400 focus:border-[#f5cf00]'
                  }`}
                />
              </div>
            </div>
            <button
              type="submit"
              className={`w-full py-2.5 rounded-full text-xs font-bold transition duration-200 cursor-pointer shadow-md ${
                activeDarkMode 
                  ? 'bg-[#ffd600] hover:bg-[#ffe066] text-[#1a1600]' 
                  : 'bg-[#f5cf00] hover:bg-[#e0bd00] text-[#1a1600]'
              }`}
            >
              Guardar en Favoritos
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
