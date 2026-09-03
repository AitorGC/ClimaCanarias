/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { WeatherCondition } from '../types';

interface WeatherAnimationsProps {
  condition: WeatherCondition;
  calimaRating?: 'Bajo' | 'Moderado' | 'Alto';
  windSpeed?: number; // wind speed in km/h
}

export default function WeatherAnimations({ condition, calimaRating, windSpeed = 22 }: WeatherAnimationsProps) {
  // Normalize wind speed (minimum 10 km/h, max 100 km/h)
  const windKmh = Math.max(10, Math.min(100, windSpeed));
  // Calculate dynamic animation duration factor (higher speed = faster animation)
  const speedFactor = windKmh / 25; // 1.0 at 25km/h

  // 2. RAIN: Background drizzle & foreground droplets
  const bgDrizzle = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: (i % 5) * 0.05,
      duration: 0.6 + Math.random() * 0.4,
      height: 10 + Math.random() * 10,
    }));
  }, [condition]);

  const fgDroplets = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: (i % 4) * 0.05,
      duration: 0.4 + Math.random() * 0.3,
      height: 22 + Math.random() * 16,
    }));
  }, [condition]);

  // Rain splash ripple positions near ground
  const splashRipples = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      top: `${78 + Math.random() * 16}%`,
      delay: (i % 3) * 0.08,
      duration: 0.8 + Math.random() * 0.4,
      size: 16 + Math.random() * 20,
    }));
  }, [condition]);

  // 3. THUNDERSTORM: Angled heavy rain & lightning bolts
  const stormRain = useMemo(() => {
    return Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      left: `${-10 + Math.random() * 115}%`,
      delay: (i % 5) * 0.04,
      duration: 0.35 + Math.random() * 0.3,
      height: 25 + Math.random() * 20,
    }));
  }, [condition]);

  // 4. WIND: Breeze currents & floating air particles
  const breezeCurrents = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      top: `${15 + i * 17}%`,
      waveAmp: 12 + Math.random() * 18,
      length: 220 + Math.random() * 120,
      duration: Math.max(1.2, (3.8 / speedFactor) + Math.random() * 0.8),
      delay: i * 0.1,
      strokeWidth: 1.5 + (i % 2 === 0 ? 1 : 0),
    }));
  }, [condition, speedFactor]);

  const windSpecks = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      top: `${10 + Math.random() * 80}%`,
      delay: (i % 4) * 0.08,
      duration: Math.max(1.0, (2.8 / speedFactor) + Math.random() * 0.6),
      size: 2 + Math.random() * 3,
    }));
  }, [condition, speedFactor]);

  // 5. CALIMA: Sand particles & dust cloud silhouettes
  const calimaSand = useMemo(() => {
    // Substantially increased particle density so it looks like authentic suspended desert dust & sand
    const count = calimaRating === 'Alto' ? 140 : calimaRating === 'Moderado' ? 95 : 65;
    const colors = ['#f59e0b', '#d97706', '#fef08a', '#b45309', '#fbbf24', '#fde68a'];
    
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Distribute initial positions across full container width and height
      initialLeft: `${Math.random() * 100}%`,
      top: `${2 + Math.random() * 96}%`,
      delay: (i % 6) * 0.03, // Starts virtually immediately with gentle phase variation
      duration: 3 + Math.random() * 3.5,
      size: 1 + Math.random() * 2.8,
      color: colors[i % colors.length],
      opacity: 0.35 + Math.random() * 0.55,
      ySineAmp: 6 + Math.random() * 16,
      driftX: 20 + Math.random() * 50, // gentle lateral drift
    }));
  }, [calimaRating, condition]);

  const calimaClouds = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      top: `${10 + i * 28}%`,
      delay: 0,
      duration: 18 + i * 6,
      scale: 0.85 + Math.random() * 0.4,
      initialOffset: (i * 35) - 20,
    }));
  }, [condition]);

  // 6. CLOUDY: Layered cloud silhouettes with silver lining
  const silverClouds = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      top: `${12 + i * 20}%`,
      delay: 0,
      duration: 16 + Math.random() * 6,
      scale: 0.8 + Math.random() * 0.4,
      initialOffset: (i * 30) - 20,
    }));
  }, [condition]);

  // 7. SNOWFALL: Sinusoidal swaying snowflakes
  const snowflakes = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: (i % 5) * 0.08,
      duration: 3 + Math.random() * 2,
      size: 3.5 + Math.random() * 5.5,
      swayAmp: 15 + Math.random() * 25,
    }));
  }, [condition]);

  const cond = condition as string;
  const isSunny = cond === 'sunny' || cond === 'clear';
  const isRainy = cond === 'rainy' || cond === 'rain';
  const isStorm = cond === 'storm' || cond === 'thunderstorm';
  const isSnowy = cond === 'snowy' || cond === 'snow';
  const isCloudy = cond === 'cloudy' || cond === 'clouds';
  const isFoggy = cond === 'foggy' || cond === 'fog';
  const isWindy = (cond === 'windy' && windSpeed >= 28) || windSpeed >= 38; 
  const isCalima = calimaRating === 'Alto' || calimaRating === 'Moderado' || cond === 'calima';

  return (
    <div
      id={`anim-container-${condition.replace(/\s+/g, '-')}`}
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px] z-0 select-none"
    >
      {/* ==========================================
          1. SUNSHINE (CLEAR SKY)
          ========================================== */}
      {isSunny && !isRainy && !isStorm && (
        <div className="absolute inset-0">
          {/* Atmospheric Golden Radial Glow */}
          <motion.div
            id="sunny-atmospheric-glow"
            className="absolute -top-12 -right-12 w-96 h-96 bg-radial from-amber-300/30 via-yellow-400/15 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.75, 0.95, 0.75],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Dual Concentric Solar Ray Wheels */}
          <div className="absolute top-2 right-2 w-64 h-64 flex items-center justify-center opacity-70">
            {/* Outer Ray Wheel (Clockwise) */}
            <motion.svg
              className="absolute w-56 h-56 text-amber-300/20"
              viewBox="0 0 200 200"
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              <g stroke="currentColor" strokeWidth="2" strokeDasharray="6 12">
                <circle cx="100" cy="100" r="85" fill="none" />
              </g>
              {Array.from({ length: 12 }).map((_, idx) => {
                const angle = (idx * 30 * Math.PI) / 180;
                const x1 = 100 + Math.cos(angle) * 35;
                const y1 = 100 + Math.sin(angle) * 35;
                const x2 = 100 + Math.cos(angle) * 90;
                const y2 = 100 + Math.sin(angle) * 90;
                return (
                  <line
                    key={`outer-ray-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </motion.svg>

            {/* Inner Ray Wheel (Counter-Clockwise) */}
            <motion.svg
              className="absolute w-40 h-40 text-amber-400/25"
              viewBox="0 0 200 200"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              {Array.from({ length: 8 }).map((_, idx) => {
                const angle = (idx * 45 * Math.PI) / 180;
                const x1 = 100 + Math.cos(angle) * 25;
                const y1 = 100 + Math.sin(angle) * 25;
                const x2 = 100 + Math.cos(angle) * 70;
                const y2 = 100 + Math.sin(angle) * 70;
                return (
                  <line
                    key={`inner-ray-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </motion.svg>

            {/* Central Sun Corona */}
            <motion.div
              className="w-20 h-20 bg-linear-to-br from-amber-200 via-amber-300 to-yellow-400 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.6)]"
              animate={{
                scale: [0.95, 1.08, 0.95],
                boxShadow: [
                  '0 0 30px rgba(251,191,36,0.5)',
                  '0 0 55px rgba(251,191,36,0.8)',
                  '0 0 30px rgba(251,191,36,0.5)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}

      {/* ==========================================
          2. RAIN & SPLASH RIPPLES
          ========================================== */}
      {isRainy && !isStorm && (
        <div className="absolute inset-0">
          {/* Blue-Cyan Ambient Mist Overlay */}
          <motion.div
            className="absolute inset-0 bg-linear-to-b from-sky-500/10 via-cyan-500/5 to-transparent pointer-events-none"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Background Fine Drizzle */}
          {bgDrizzle.map((drop) => (
            <motion.div
              key={`bg-drizzle-${drop.id}`}
              className="absolute bg-sky-300/30 w-[1px] rounded-full"
              style={{
                left: drop.left,
                height: `${drop.height}px`,
                top: '-30px',
              }}
              animate={{ y: ['0vh', '48vh'] }}
              transition={{
                delay: drop.delay,
                duration: drop.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Foreground Crisp Droplets (Slanted) */}
          {fgDroplets.map((drop) => (
            <motion.div
              key={`fg-drop-${drop.id}`}
              className="absolute bg-linear-to-b from-sky-200 to-sky-400/80 w-[1.5px] rounded-full transform -rotate-12 shadow-[0_0_4px_rgba(56,189,248,0.4)]"
              style={{
                left: drop.left,
                height: `${drop.height}px`,
                top: '-40px',
              }}
              animate={{ y: ['0vh', '50vh'] }}
              transition={{
                delay: drop.delay,
                duration: drop.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Dynamic Splash Rings Near Ground */}
          {splashRipples.map((ripple) => (
            <motion.div
              key={`splash-ripple-${ripple.id}`}
              className="absolute rounded-full border border-sky-300/60 pointer-events-none"
              style={{
                left: ripple.left,
                top: ripple.top,
                width: `${ripple.size}px`,
                height: `${ripple.size * 0.4}px`,
              }}
              animate={{
                scale: [0.1, 1.8],
                opacity: [0.9, 0],
              }}
              transition={{
                delay: ripple.delay,
                duration: ripple.duration,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ==========================================
          3. THUNDERSTORM
          ========================================== */}
      {isStorm && (
        <div className="absolute inset-0">
          {/* Heavy Downpour with Angled Streaks */}
          {stormRain.map((drop) => (
            <motion.div
              key={`storm-rain-${drop.id}`}
              className="absolute bg-linear-to-b from-cyan-200/90 to-sky-400/50 w-[2px] rounded-full transform -rotate-18"
              style={{
                left: drop.left,
                height: `${drop.height}px`,
                top: '-40px',
              }}
              animate={{ y: ['0vh', '55vh'] }}
              transition={{
                delay: drop.delay,
                duration: drop.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Electric Flash Overlays */}
          <motion.div
            id="storm-flash-bg"
            className="absolute inset-0 bg-sky-100/30 dark:bg-white/20 mix-blend-overlay"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 0.9, 0.15, 0.95, 0, 0, 0, 0, 0.6, 0, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Stylized Multi-Segment Lightning Bolts */}
          <motion.svg
            className="absolute top-0 right-1/4 w-36 h-64 text-cyan-200 drop-shadow-[0_0_12px_rgba(186,230,253,0.9)]"
            viewBox="0 0 100 200"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 1, 0.2, 1, 0, 0, 0, 0, 0.8, 0, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M 50 0 L 35 60 L 55 65 L 20 130 L 40 135 L 10 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>

          <motion.svg
            className="absolute top-2 left-1/3 w-28 h-48 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
            viewBox="0 0 100 200"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 0, 0, 0, 0, 0, 1, 0.1, 0.9, 0, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M 60 0 L 40 50 L 58 55 L 25 120 L 45 125 L 15 180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </div>
      )}

      {/* ==========================================
          4. WIND BREEZE CURRENTS
          ========================================== */}
      {isWindy && (
        <div className="absolute inset-0">
          {/* Flowing Sinusoidal Breeze Streams */}
          {breezeCurrents.map((breeze) => (
            <motion.div
              key={`breeze-stream-${breeze.id}`}
              className="absolute left-0 w-full"
              style={{ top: breeze.top }}
              initial={{ x: '-100%', opacity: 0.1 }}
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 0.8, 0.8, 0],
              }}
              transition={{
                delay: breeze.delay,
                duration: breeze.duration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg
                width={breeze.length}
                height={breeze.waveAmp * 3}
                viewBox={`0 0 ${breeze.length} ${breeze.waveAmp * 3}`}
                className="overflow-visible"
              >
                <defs>
                  <linearGradient id={`breezeGrad-${breeze.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                    <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="70%" stopColor="#7dd3fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Curved Sinusoidal Wave Path */}
                <path
                  d={`M 0 ${breeze.waveAmp} 
                     Q ${breeze.length * 0.25} 0, ${breeze.length * 0.5} ${breeze.waveAmp} 
                     T ${breeze.length * 0.85} ${breeze.waveAmp} 
                     Q ${breeze.length * 0.95} ${breeze.waveAmp * 2.2}, ${breeze.length} ${breeze.waveAmp}`}
                  fill="none"
                  stroke={`url(#breezeGrad-${breeze.id})`}
                  strokeWidth={breeze.strokeWidth}
                  strokeLinecap="round"
                />

                {/* Swirling Terminal Curl */}
                <path
                  d={`M ${breeze.length * 0.85} ${breeze.waveAmp} 
                     C ${breeze.length * 0.92} ${breeze.waveAmp * 0.2}, 
                       ${breeze.length * 0.98} ${breeze.waveAmp * 1.8}, 
                       ${breeze.length * 0.94} ${breeze.waveAmp * 2.2}`}
                  fill="none"
                  stroke={`url(#breezeGrad-${breeze.id})`}
                  strokeWidth={breeze.strokeWidth * 0.8}
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          ))}

          {/* Gliding Wind Specks */}
          {windSpecks.map((speck) => (
            <motion.div
              key={`wind-speck-${speck.id}`}
              className="absolute bg-sky-200/70 rounded-full blur-[0.5px]"
              style={{
                top: speck.top,
                width: `${speck.size * 2}px`,
                height: `${speck.size}px`,
                left: '-20px',
              }}
              animate={{
                x: ['0vw', '110vw'],
                y: [0, (speck.id % 2 === 0 ? 12 : -12), 0],
              }}
              transition={{
                delay: speck.delay,
                duration: speck.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* ==========================================
          5. SAHARAN DUST (CALIMA)
          ========================================== */}
      {isCalima && (
        <div className="absolute inset-0">
          {/* Amber Haze Atmosphere */}
          <motion.div
            className="absolute inset-0 bg-linear-to-tr from-amber-600/20 via-orange-500/12 to-amber-700/20 mix-blend-color-burn"
            animate={{ opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Hazy Dust Cloud Silhouettes */}
          {calimaClouds.map((c) => (
            <motion.div
              key={`calima-cloud-${c.id}`}
              className="absolute w-72 h-24 bg-amber-700/15 dark:bg-amber-900/25 blur-2xl rounded-full"
              style={{ top: c.top, scale: c.scale }}
              initial={{ x: `${c.initialOffset}%` }}
              animate={{ x: [`${c.initialOffset}%`, '115%'] }}
              transition={{
                delay: 0,
                duration: c.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Microscopic Sand & Dust Particles Suspended in Air */}
          {calimaSand.map((sand) => (
            <motion.div
              key={`calima-sand-${sand.id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                top: sand.top,
                left: sand.initialLeft,
                width: `${sand.size}px`,
                height: `${sand.size}px`,
                backgroundColor: sand.color,
                boxShadow: sand.size > 2 ? `0 0 2px ${sand.color}` : undefined,
              }}
              animate={{
                x: [0, sand.driftX, sand.driftX * 1.5, 0],
                y: [0, sand.ySineAmp, -sand.ySineAmp, 0],
                opacity: [sand.opacity * 0.4, sand.opacity, sand.opacity * 0.8, sand.opacity * 0.4],
                scale: [0.8, 1.2, 0.9, 0.8],
              }}
              transition={{
                delay: sand.delay,
                duration: sand.duration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ==========================================
          6. CLOUDY & OVERCAST
          ========================================== */}
      {(isCloudy || isFoggy) && !isRainy && !isStorm && (
        <div className="absolute inset-0">
          {/* Layered Cloud Silhouettes with Silver Lining */}
          {silverClouds.map((cloud) => (
            <motion.div
              key={`silver-cloud-${cloud.id}`}
              className="absolute w-64 h-24"
              style={{ top: cloud.top, scale: cloud.scale }}
              initial={{ x: `${cloud.initialOffset}%` }}
              animate={{ x: [`${cloud.initialOffset}%`, '115%'] }}
              transition={{
                delay: 0,
                duration: cloud.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {/* Cloud Body with soft organic gradients */}
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-full blur-xl transform scale-110" />
                <div className="absolute inset-2 bg-slate-200/15 dark:bg-slate-300/10 rounded-full blur-lg" />
                <div className="absolute -top-3 left-6 w-24 h-24 bg-white/10 dark:bg-white/5 rounded-full blur-md" />
                <div className="absolute -top-1 left-20 w-28 h-20 bg-white/12 dark:bg-white/5 rounded-full blur-md" />
              </div>
            </motion.div>
          ))}

          {/* Foggy Ground Haze for Foggy Condition */}
          {isFoggy && (
            <motion.div
              className="absolute inset-0 bg-linear-to-t from-slate-300/20 via-slate-200/10 to-transparent blur-md"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      )}

      {/* ==========================================
          7. SNOWFALL
          ========================================== */}
      {isSnowy && (
        <div className="absolute inset-0">
          {/* Cold Ground Shimmer Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-sky-200/30 via-sky-100/10 to-transparent pointer-events-none" />

          {/* Swaying Snowflakes with Lateral Oscillation */}
          {snowflakes.map((flake) => (
            <motion.div
              key={`snowflake-${flake.id}`}
              className="absolute bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)] dark:bg-slate-100"
              style={{
                left: flake.left,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                top: '-20px',
              }}
              animate={{
                y: ['0vh', '50vh'],
                x: [0, flake.swayAmp, -flake.swayAmp, 0],
                rotate: 360,
              }}
              transition={{
                y: {
                  delay: flake.delay,
                  duration: flake.duration,
                  repeat: Infinity,
                  ease: 'linear',
                },
                x: {
                  delay: flake.delay,
                  duration: flake.duration * 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                rotate: {
                  duration: flake.duration * 2,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
