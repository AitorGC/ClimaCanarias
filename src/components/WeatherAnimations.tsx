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
}

export default function WeatherAnimations({ condition, calimaRating }: WeatherAnimationsProps) {
  // Memoize arrays for static elements to preserve memoization and prevent memory leaks/re-renders
  const sandParticles = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 5,
      size: 1.5 + Math.random() * 3,
      opacity: 0.25 + Math.random() * 0.45,
    }));
  }, [calimaRating]);

  const rainDrops = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 0.8,
      height: 12 + Math.random() * 20,
    }));
  }, [condition]);

  const snowFlakes = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 3,
      duration: 2.5 + Math.random() * 2,
      size: 4 + Math.random() * 6,
    }));
  }, [condition]);

  const cloudPuffs = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      top: `${15 + i * 20}%`,
      delay: i * 2,
      duration: 16 + Math.random() * 10,
      scale: 0.8 + Math.random() * 0.6,
    }));
  }, [condition]);

  const foglayers = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      top: `${40 + i * 15}%`,
      delay: i * 1.5,
      duration: 18 + i * 4,
    }));
  }, [condition]);

  const windLines = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      top: `${20 + i * 14}%`,
      width: `${100 + Math.random() * 150}px`,
      duration: 2 + Math.random() * 1.5,
      delay: i * 0.9,
    }));
  }, [condition]);

  return (
    <div id={`anim-container-${condition}`} className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0 select-none">
      {/* 1. SUNNY: Ambient rotating soft sun flare */}
      {condition === 'sunny' && (
        <div className="absolute top-2 right-2 w-72 h-72">
          <motion.div
            id="sunny-radial-flare"
            className="w-full h-full bg-radial from-amber-400/20 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 0.9, 0.7],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            id="sunny-ring"
            className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-300/10 rounded-full"
            animate={{
              scale: [0.9, 1.2, 0.9],
              rotate: 360,
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      )}

      {/* 2. CLOUDY: Soft horizontal drifting clouds */}
      {(condition === 'cloudy' || condition === 'storm' || condition === 'rainy') && (
        <>
          {cloudPuffs.map((cloud) => (
            <motion.div
              key={`cloud-${cloud.id}`}
              id={`cloud-puff-${cloud.id}`}
              className="absolute w-56 h-20 bg-gray-400/10 dark:bg-zinc-600/10 blur-xl rounded-full"
              style={{
                top: cloud.top,
                scale: cloud.scale,
              }}
              initial={{ x: '-110%' }}
              animate={{ x: '110%' }}
              transition={{
                delay: cloud.delay,
                duration: cloud.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </>
      )}

      {/* 3. RAINY: Downward falling raindrop columns */}
      {condition === 'rainy' && (
        <div className="absolute inset-x-0 top-0 bottom-0">
          {rainDrops.map((drop) => (
            <motion.div
              key={`rain-drop-${drop.id}`}
              id={`rain-drop-elem-${drop.id}`}
              className="absolute bg-sky-400/30 w-[1px] md:w-[1.5px] rounded-full"
              style={{
                left: drop.left,
                height: `${drop.height}px`,
                bottom: '100%',
              }}
              animate={{
                y: ['0vh', '45vh'],
              }}
              transition={{
                delay: drop.delay,
                duration: drop.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* 4. STORM: Raindrops + Intermittent Lightning Flashes */}
      {condition === 'storm' && (
        <div className="absolute inset-0">
          {/* Falling heavy rain */}
          {rainDrops.slice(0, 15).map((drop) => (
            <motion.div
              key={`storm-rain-${drop.id}`}
              id={`storm-rain-elem-${drop.id}`}
              className="absolute bg-sky-300/40 w-[1.5px] rounded-full transform rotate-12"
              style={{
                left: drop.left,
                height: `${drop.height + 8}px`,
                top: '-50px',
              }}
              animate={{
                y: ['0vh', '50vh'],
              }}
              transition={{
                delay: drop.delay,
                duration: drop.duration * 0.8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
          {/* Lightning flashes */}
          <motion.div
            id="lightning-flash"
            className="absolute inset-0 bg-sky-200/25 dark:bg-white/15 mix-blend-overlay"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 0, 0.8, 0.1, 0.9, 0, 0, 0, 0, 0.4, 0, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* 5. SNOWY: Soft fluffy drifting snowflakes */}
      {condition === 'snowy' && (
        <div className="absolute inset-0">
          {snowFlakes.map((flake) => (
            <motion.div
              key={`snow-flake-${flake.id}`}
              id={`snow-flake-elem-${flake.id}`}
              className="absolute bg-white/70 rounded-full dark:bg-zinc-200/80"
              style={{
                left: flake.left,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                top: '-20px',
              }}
              animate={{
                y: ['0vh', '45vh'],
                x: ['0px', `${(Math.random() - 0.5) * 40}px`, '0px'],
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
                  duration: flake.duration * 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                rotate: {
                  delay: flake.delay,
                  duration: flake.duration * 2,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            />
          ))}
        </div>
      )}

      {/* 6. FOGGY: horizontal thick gray clouds */}
      {condition === 'foggy' && (
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-zinc-400/5 to-transparent">
          {foglayers.map((layer) => (
            <motion.div
              key={`fog-layer-${layer.id}`}
              id={`fog-layer-puff-${layer.id}`}
              className="absolute w-[150%] h-16 bg-zinc-300/[0.04] dark:bg-zinc-800/[0.12] blur-xl"
              style={{
                top: layer.top,
              }}
              initial={{ x: '-20%' }}
              animate={{ x: '10%' }}
              transition={{
                delay: layer.delay,
                duration: layer.duration,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 7. WINDY: Horizontal swift particles */}
      {condition === 'windy' && (
        <div className="absolute inset-0">
          {windLines.map((line) => (
            <motion.div
              key={`wind-line-${line.id}`}
              id={`wind-line-elem-${line.id}`}
              className="absolute bg-linear-to-r from-transparent via-sky-300/15 to-transparent h-[1.5px]"
              style={{
                top: line.top,
                width: line.width,
                left: '-150px',
              }}
              animate={{
                left: ['-200px', '550px'],
              }}
              transition={{
                delay: line.delay,
                duration: line.duration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 8. CALIMA: Warm Saharan dust and orange-golden micro particles */}
      {(calimaRating === 'Moderado' || calimaRating === 'Alto') && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {/* Ambient yellow/amber light fog */}
          <div className="absolute inset-0 bg-amber-500/[0.04] mix-blend-color-burn blur-md animate-pulse duration-[6000ms]" />
          {sandParticles.map((pt) => (
            <motion.div
              key={`sand-particle-${pt.id}`}
              id={`sand-pt-elem-${pt.id}`}
              className={`absolute rounded-full ${
                calimaRating === 'Alto' ? 'bg-amber-600/50' : 'bg-amber-400/40'
              }`}
              style={{
                top: pt.top,
                width: `${pt.size}px`,
                height: `${pt.size}px`,
                opacity: pt.opacity,
                left: '-20px',
              }}
              animate={{
                left: ['-5%', '105%'],
                y: [0, (pt.id % 2 === 0 ? 15 : -15), 0],
              }}
              transition={{
                delay: pt.delay,
                duration: pt.duration * (calimaRating === 'Alto' ? 0.75 : 1),
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
