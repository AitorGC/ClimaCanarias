# ClimaCanarias

ClimaCanarias es una aplicación meteorológica minimalista diseñada específicamente para proporcionar información climática en tiempo real en las Islas Canarias.

## Características

- **Datos Meteorológicos Unificados**: Integración de previsiones de AEMET, OpenWeatherMap y Open-Meteo para mayor precisión.
- **Previsión Regional Especializada**: Identificación automática de fenómenos locales como la calima y el efecto de los vientos alisios.
- **Alertas AEMET**: Visualización clara de avisos meteorológicos de Protección Civil.
- **Sincronización en la Nube**: Inicio de sesión con Google y sincronización de preferencias mediante Firebase Firestore.
- **Diseño Minimalista**: Interfaz optimizada con modo AMOLED automático para ahorro de batería y legibilidad en entornos oscuros.
- **Alta Resolución**: Visualización de tendencias horarias detalladas.

## Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS.
- **Backend*: Firebase (Authentication & Firestore).
- **Herramientas**: Vite, Motion (para animaciones).

## Configuración y Despliegue

La aplicación requiere las siguientes variables de entorno para su correcto funcionamiento:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
