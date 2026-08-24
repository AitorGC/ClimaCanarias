const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Wrap Clima left side (up to Sec 1.8)
// Wait, I already added `{activeTab === 'clima' && (` before `<motion.div id="primary-weather-focus-card"`.
// I need to close it before Sec 1.8.
code = code.replace(
  '{/* Sec 1.8. DATOS MARÍTIMOS Y MAREAS */}',
  `            </>
          )}
          
          {/* TAB: PLAYAS */}
          {activeTab === 'playas' && (
            <div className="space-y-4">
              {/* Sec 1.8. DATOS MARÍTIMOS Y MAREAS */}`
);

// Close Playas after Sec 1.8 and reopen Clima for Sec 2
code = code.replace(
  '{/* Sec 2. PRÓXIMAS 6 HORAS */}',
  `            </div>
          )}

          {/* TAB: CLIMA (cont) */}
          {activeTab === 'clima' && (
            <div className="space-y-4">
              {/* Sec 2. PRÓXIMAS 6 HORAS */}`
);

// Close Clima after Sec 2 (before the end of left column)
code = code.replace(
  '              </div>\n            </motion.div>\n          </div>\n\n        </div>',
  `              </div>\n            </motion.div>\n            </div>\n          )}

          {/* TAB: ALERTAS (Left column) */}
          {activeTab === 'alertas' && (
             <div className="space-y-4">
               <motion.div
                 className="rounded-[28px] p-6 border backdrop-blur-md border-white/10 bg-zinc-900/95 text-white"
               >
                 <h3 className="text-xs font-mono tracking-widest uppercase mb-4 text-brand-blue font-bold">Resumen de Alertas Regionales</h3>
                 <p className="text-sm">Consulte el panel de notificaciones para más detalles o las alertas de AEMET.</p>
               </motion.div>
             </div>
          )}

          {/* TAB: ESTACIONES (Left column) */}
          {activeTab === 'estaciones' && (
             <div className="space-y-4">
               {weather?.aemetStations && (
                 <motion.div
                   className="rounded-[24px] p-6 border backdrop-blur-md bg-white text-slate-900 shadow-xl shadow-brand-blue/2 dark:bg-zinc-900/90 dark:text-white dark:border-white/10"
                 >
                   <AemetStations stations={weather.aemetStations} activeDarkMode={activeDarkMode} />
                 </motion.div>
               )}
             </div>
          )}

          {/* TAB: SATELITE (Left column) */}
          {activeTab === 'satelite' && (
             <div className="space-y-4">
               <motion.div
                 className="rounded-[24px] p-6 border backdrop-blur-md bg-white text-slate-900 shadow-xl shadow-brand-blue/2 dark:bg-zinc-900/90 dark:text-white dark:border-white/10 min-h-[400px] flex items-center justify-center flex-col gap-4"
               >
                 <span className="text-4xl">🛰️</span>
                 <h3 className="text-lg font-bold">Mapa Radar por Satélite</h3>
                 <p className="text-sm opacity-60">Visualización de masas nubosas y precipitaciones (Próximamente conectando API de AEMET Radar)</p>
               </motion.div>
             </div>
          )}

        </div>`
);


// Now for the right sidebar conditionals
code = code.replace(
  '{/* 3. PRÓXIMOS 3 DÍAS */}',
  `{/* 3. PRÓXIMOS 3 DÍAS */}
          {activeTab === 'clima' && (`
);

code = code.replace(
  '          <NotificationCenter',
  `          )}
          
          {(activeTab === 'clima' || activeTab === 'alertas') && (
            <NotificationCenter`
);

code = code.replace(
  '          {weather?.aemetStations && (',
  `          )}
          
          {/* Estaciones are moved to main left column in estaciones tab, removing from here */}`
);

// Remove the old aemet stations rendering in right sidebar:
code = code.replace(
  /<motion\.div[\s\S]*?<AemetStations stations={weather\.aemetStations} activeDarkMode={activeDarkMode} \/>\n\s*<\/motion\.div>\n\s*\)}/,
  ''
);


fs.writeFileSync('src/App.tsx', code);
