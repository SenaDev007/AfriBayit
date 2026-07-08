'use client';

/**
 * DroneViewPlayer — CDC §5.1.2 "Drone view et time-lapse jour/nuit"
 *
 * Displays drone footage of the property with day/night toggle and time-lapse.
 * Falls back to an aerial photo if no video is available.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Sun, Moon, Clock, Maximize2, Plane } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

interface DroneViewPlayerProps {
  propertyTitle: string;
  /** Drone video URL (MP4, YouTube, etc.) */
  videoUrl?: string;
  /** Aerial day photo */
  dayImage?: string;
  /** Aerial night photo */
  nightImage?: string;
  hasDroneView?: boolean;
  onClose?: () => void;
}

export default function DroneViewPlayer({
  propertyTitle,
  videoUrl,
  dayImage,
  nightImage,
  hasDroneView = false,
  onClose,
}: DroneViewPlayerProps) {
  const [mode, setMode] = useState<'day' | 'night'>('day');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTimeLapse, setShowTimeLapse] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const aerialImage =
    mode === 'day'
      ? dayImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop'
      : nightImage || 'https://images.unsplash.com/photo-1535313142515-9b6de1d1c83d?w=1200&h=600&fit=crop';

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // No video — simulate time-lapse with image transition
      setShowTimeLapse(true);
      setTimeout(() => {
        setMode(mode === 'day' ? 'night' : 'day');
        setShowTimeLapse(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${NAVY}10` }}>
            <Plane className="w-4 h-4" style={{ color: NAVY }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Vue drone aérienne</h3>
            <p className="text-xs text-gray-400">{propertyTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Video/Image viewer */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.img
              key={mode}
              src={aerialImage}
              alt={`${propertyTitle} - Vue drone ${mode === 'day' ? 'jour' : 'nuit'}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: showTimeLapse ? 0.5 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </AnimatePresence>
        )}

        {/* Drone badge */}
        {hasDroneView && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(0, 48, 135, 0.8)' }}>
            <Plane className="w-3.5 h-3.5" />
            Drone View
          </div>
        )}

        {/* Play/Pause button overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: 'rgba(0, 48, 135, 0.8)' }}
          >
            {isPlaying || showTimeLapse ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-white ml-1" />
            )}
          </motion.div>
        </button>

        {/* Time-lapse indicator */}
        {showTimeLapse && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Time-lapse jour → nuit...
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50/50">
        {/* Day/Night toggle */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-white border border-gray-200">
          <button
            onClick={() => setMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mode === 'day' ? 'text-white' : 'text-gray-500'
            }`}
            style={mode === 'day' ? { background: NAVY } : {}}
          >
            <Sun className="w-3.5 h-3.5" />
            Jour
          </button>
          <button
            onClick={() => setMode('night')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mode === 'night' ? 'text-white' : 'text-gray-500'
            }`}
            style={mode === 'night' ? { background: NAVY } : {}}
          >
            <Moon className="w-3.5 h-3.5" />
            Nuit
          </button>
        </div>

        {/* Time-lapse button */}
        <button
          onClick={() => {
            setShowTimeLapse(true);
            setTimeout(() => {
              setMode(mode === 'day' ? 'night' : 'day');
              setShowTimeLapse(false);
            }, 2000);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:bg-white transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          Time-lapse
        </button>
      </div>
    </div>
  );
}
