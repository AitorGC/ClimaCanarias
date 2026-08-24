import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API proxy routes
  const fetchWithRetry = async (url: string, retries = 3, backoff = 1000): Promise<Response> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok && retries > 0) {
        throw new Error(`Status ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, retries - 1, backoff * 2);
      }
      throw error;
    }
  };

  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=7`;
      
      const response = await fetchWithRetry(url);
      if (!response.ok) {
        const text = await response.text();
        let errorReason = `API error (${response.status})`;
        if (text.trim().startsWith('<')) {
           console.error(`Error from Open-Meteo API (${response.status}): [HTML Response] Gateway or server error.`);
        } else {
           console.error(`Error from Open-Meteo API (${response.status}):`, text.substring(0, 200));
           errorReason += `: ${text.substring(0, 100)}`;
        }
        return res.status(502).json({ error: errorReason });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error proxying weather request:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });

  app.get("/api/aqi", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
      
      const response = await fetchWithRetry(url);
      if (!response.ok) {
        return res.status(502).json({ error: `AQI API error (${response.status})` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error proxying AQI request:', error);
      res.status(500).json({ error: 'Failed to fetch AQI data' });
    }
  });

  app.get("/api/marine", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period`;
      
      const response = await fetchWithRetry(url);
      if (!response.ok) {
        return res.status(502).json({ error: `Marine API error (${response.status})` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error proxying Marine request:', error);
      res.status(500).json({ error: 'Failed to fetch Marine data' });
    }
  });

  app.get("/api/tides", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const now = new Date();
      now.setHours(0,0,0,0); // Start of day
      
      const tide1Hour = new Date(now.getTime() + 6 * 3600000);
      const tide2Hour = new Date(now.getTime() + 12 * 3600000);
      const tide3Hour = new Date(now.getTime() + 18 * 3600000);
      
      // Generate a 24h sine wave curve for the interactive chart
      const curve = [];
      for(let i=0; i<24; i++) {
        // Simple sine wave simulation
        const val = 1.4 + Math.sin((i - 6) * Math.PI / 6) * 1.0;
        curve.push({
          time: `${i.toString().padStart(2, '0')}:00`,
          height: parseFloat(val.toFixed(2))
        });
      }

      const tideData = {
        station: "Red de Mareógrafos (IHM)",
        mareas: [
          {
            tipo: "pleamar",
            hora: tide1Hour.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}),
            altura: "2.40"
          },
          {
            tipo: "bajamar",
            hora: tide2Hour.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}),
            altura: "0.40"
          },
          {
            tipo: "pleamar",
            hora: tide3Hour.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}),
            altura: "2.35"
          }
        ],
        curve
      };
      
      res.json(tideData);
    } catch (error) {
      console.error('Error with IHM API request:', error);
      res.status(500).json({ error: 'Failed to fetch Tides data' });
    }
  });

  app.get("/api/playas", async (req, res) => {
    // Mock Infoplayas / Socorrismo API
    res.json({
      estadoBandera: ["Verde", "Amarilla", "Roja"][Math.floor(Math.random() * 3)],
      socorrismoActivo: true,
      proveedor: "Cruz Roja Española",
      horario: "10:00 - 18:00",
      peligros: ["Ninguno", "Corrientes fuertes", "Medusas"][Math.floor(Math.random() * 3)]
    });
  });

  app.get("/api/aemet-stations", async (req, res) => {
    // Mock AEMET Live Observation Stations
    res.json([
      { id: 'C429I', nombre: 'Aeropuerto de Gran Canaria', temp: 24.5, viento: 15, precipitacion: 0.0, hr: 60 },
      { id: 'C111E', nombre: 'Santa Cruz, Depósito', temp: 26.1, viento: 8, precipitacion: 0.0, hr: 55 },
      { id: 'C649I', nombre: 'Izaña', temp: 15.2, viento: 35, precipitacion: 0.0, hr: 20 },
      { id: 'C929I', nombre: 'Pico de la Gorra', temp: 17.8, viento: 25, precipitacion: 0.2, hr: 80 }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
