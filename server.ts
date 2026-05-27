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
        const text = await response.text();
        let errorReason = `API error (${response.status})`;
        if (text.trim().startsWith('<')) {
           console.error(`Error from Open-Meteo AQI API (${response.status}): [HTML Response] Gateway or server error.`);
        } else {
           console.error(`Error from Open-Meteo AQI API (${response.status}):`, text.substring(0, 200));
           errorReason += `: ${text.substring(0, 100)}`;
        }
        return res.status(502).json({ error: errorReason });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error proxying AQI request:', error);
      res.status(500).json({ error: 'Failed to fetch AQI data' });
    }
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
