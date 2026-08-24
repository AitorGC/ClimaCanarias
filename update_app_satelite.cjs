const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSatelite = `          {activeTab === 'satelite' && (
            <motion.div
              whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={\`rounded-[24px] p-6 border backdrop-blur-md flex flex-col items-center justify-center min-h-[400px] \${activeDarkMode ? 'border-white/10 bg-zinc-900/90 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}\`}
            >
              <Satellite className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-bold mb-2">Mapa Radar por Satélite</h3>
              <p className="text-sm opacity-60 text-center max-w-sm">Visualización de masas nubosas y precipitaciones conectando con la API de AEMET Radar (Próximamente).</p>
            </motion.div>
          )}`;

const newSatelite = `          {activeTab === 'satelite' && (
            <motion.div
              whileHover={{ y: -4, scale: 1.012, borderColor: activeDarkMode ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 73, 148, 0.25)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={\`rounded-[24px] p-4 border backdrop-blur-md flex flex-col min-h-[500px] \${activeDarkMode ? 'border-white/10 bg-zinc-900/90 text-white' : 'border-slate-205 bg-white text-slate-900 shadow-xl shadow-brand-blue/2'}\`}
            >
              <div className="flex items-center gap-2 mb-4 px-2">
                <Satellite className="w-5 h-5 opacity-70" />
                <h3 className="text-sm font-bold">Radar Meteorológico en Tiempo Real</h3>
              </div>
              <div className="flex-1 w-full rounded-[16px] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                <iframe 
                  src={\`https://www.rainviewer.com/map.html?loc=\${currentCity.lat},\${currentCity.lon},7&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&c=1&o=83&lm=0&layer=radar&sm=1&sn=1\`}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{border: 0, minHeight: '450px'}}
                  title="RainViewer Radar"
                ></iframe>
              </div>
            </motion.div>
          )}`;

code = code.replace(oldSatelite, newSatelite);

fs.writeFileSync('src/App.tsx', code);
