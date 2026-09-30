/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AudioWaveform — Animated soundwave bars for gamer speaking deliberation
 * matching the demo voting tribunal screenshot.
 */

import React from 'react';

interface AudioWaveformProps {
  color?: string;
  isActive?: boolean;
  barCount?: number;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  color = '#FFB800',
  isActive = true,
  barCount = 14,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-0.5 sm:gap-1 h-5 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        // Vary heights to form realistic sound waves
        const heights = [35, 60, 90, 45, 100, 75, 50, 85, 30, 95, 65, 40, 80, 55];
        const h = heights[i % heights.length];
        const animDuration = 0.6 + (i % 5) * 0.15;

        return (
          <span
            key={i}
            className="w-0.5 sm:w-1 rounded-full transition-all duration-150"
            style={{
              height: isActive ? `${h}%` : '20%',
              backgroundColor: color,
              boxShadow: isActive ? `0 0 6px ${color}` : 'none',
              animation: isActive ? `waveBar ${animDuration}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${(i * 0.08).toFixed(2)}s`,
            }}
          />
        );
      })}
    </div>
  );
};
