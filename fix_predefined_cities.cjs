const fs = require('fs');

let code = fs.readFileSync('src/components/FavoriteCitiesManager.tsx', 'utf8');

const insertPoint = "export const PREDEFINED_BEACHES";

const predefCities = `export const PREDEFINED_CITIES: City[] = [
  { id: 'laspalmas', name: 'Las Palmas de GC', lat: 28.1235, lon: -15.4363, country: 'España', state: 'Gran Canaria' },
  { id: 'santacruz', name: 'Santa Cruz de Tenerife', lat: 28.4636, lon: -16.2518, country: 'España', state: 'Tenerife' },
  { id: 'lalaguna', name: 'La Laguna', lat: 28.4853, lon: -16.3201, country: 'España', state: 'Tenerife' },
  { id: 'arrecife', name: 'Arrecife', lat: 28.9630, lon: -13.5477, country: 'España', state: 'Lanzarote' }
];

`;

code = code.replace(insertPoint, predefCities + insertPoint);

fs.writeFileSync('src/components/FavoriteCitiesManager.tsx', code);
