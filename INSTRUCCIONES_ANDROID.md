# 🚀 Guía para Instalar tu Aplicación de Clima en tu Teléfono Android

¡He pre-configurado e integrado completamente tu aplicación con **Capacitor**! Esto te permite empaquetar, compilar y ejecutar todo este diseño web minimalista como una**aplicación celular 100% nativa de Android** con acceso a geolocalización GPS en tiempo real.

He realizado las siguientes configuraciones clave por ti:
1. **Soporte de Capacitor:** Instalación de dependencias `@capacitor/core`, `@capacitor/cli` y `@capacitor/android`.
2. **Estructura Nativa:** Creación del proyecto nativo en el directorio `/android`.
3. **Permisos de Ubicación:** Configurado `AndroidManifest.xml` con los permisos `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` para que el GPS de tu celular te dé el pronóstico al instante.
4. **Scripts de Automatización:** Agregados atajos listos para usar en tu `package.json`.

---

## 🛠️ Requisitos Previos en tu Computadora

Antes de compilar, asegúrate de tener instalado lo siguiente en tu máquina local:
1. **Node.js** (Versión 18 o superior).
2. **Java Development Kit (JDK)** versión 17 (necesario para compilar Android).
3. **Android Studio** (La suite oficial de Google para el desarrollo Android).

---

## 📦 Paso 1: Descargar el Código del Proyecto
En la interfaz de Google AI Studio, ve al menú superior de ajustes o exportación y haz clic en:
* **Export / Download ZIP** (Descargar archivo comprimido ZIP con todo el código).
* Descomprime el archivo ZIP en una carpeta de tu computadora.

---

## ⚙️ Paso 2: Instalar y Sincronizar (en tu terminal local)

Abre la terminal de tu computadora, entra a la carpeta descomprimida y ejecuta los siguientes comandos:

```bash
# 1. Instalar todas las dependencias
npm install

# 2. Compilar el diseño web y sincronizarlo con el proyecto de Android
npm run android:sync
```

> **¿Qué hace `npm run android:sync`?**
> Compila los archivos modernos de React usando Vite (`npm run build`) y copia de manera automática toda la web interactiva, animaciones de Framer Motion y componentes AMOLED directo al contenedor nativo de Android.

---

## 📱 Paso 3: Abrir en Android Studio y Compilar el APK

Para compilar la aplicación que instalarás en tu teléfono:

```bash
# Abre de manera automática el proyecto nativo en tu Android Studio
npm run android:open
```

*O si lo prefieres de manera manual:* Abre **Android Studio**, selecciona **"Open an Existing Project"** (Abrir Proyecto Existente) y elige la carpeta `android` dentro de tu proyecto.

### Pasos dentro de Android Studio para Compilar el APK:
1. Espera a que Android Studio termine de indexar y sincronizar el proyecto (verás una barra de progreso de **"Gradle"** abajo a la derecha). Esto tomará un par de minutos la primera vez.
2. En la barra de menú superior de Android Studio, ve a:
   👉 **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**
3. ¡Eso es todo! Android Studio compilará la app. Al finalizar, aparecerá una alerta flotante abajo a la derecha que dice **"APK(s) generated successfully"**.
4. Haz clic en el enlace azul **"locate"** dentro de esa notificación para abrir la carpeta donde se encuentra tu archivo instalable:
   📂 El APK se llamará generalmente `app-debug.apk`.

---

## 📲 Paso 4: Instalar en tu Celular Android

Una vez que tengas el archivo `app-debug.apk`:

1. **Envía el APK a tu teléfono:**
   * Utiliza **Google Drive** o **Telegram/WhatsApp** (enviándotelo a ti mismo).
   * O conecta tu teléfono por cable USB a la computadora y cópialo a la carpeta de descargas del almacenamiento interno.
2. **Instala la Aplicación:**
   * Abre el archivo `.apk` desde el explorador de archivos de tu teléfono o desde la aplicación con la que te lo enviaste.
   * Si es la primera vez que instalas una app externa, tu teléfono te pedirá activar la opción **"Permitir desde esta fuente"** (Instalar aplicaciones de fuentes desconocidas). ¡Es totalmente seguro ya que es tu propio código!
3. **Disfruta:** Abre la app **"Clima en Tiempo Real"** en tu lista de aplicaciones, concédele permiso de ubicación al iniciar y ¡tendrás el radar y pronósticos más rápidos en la palma de tu mano!
