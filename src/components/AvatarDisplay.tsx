/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AvatarDisplay — High-fidelity cyber gamer profile avatars inspired directly
 * by the Suspecto demo screenshots: glowing circular neon rings, custom vector
 * silhouettes, and distinct per-gamer colorways.
 */

import React from 'react';
import { getGamerProfile } from '../utils/gamerProfiles.js';

interface AvatarDisplayProps {
  avatarId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
  isSpeaking?: boolean;
  isDrawing?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  size = 'md',
  className = '',
  showBorder = true,
  isSpeaking = false,
  isDrawing = false,
}) => {
  const profile = getGamerProfile(avatarId);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Custom vector avatar artwork tailored to each profile
  const renderGamerVector = () => {
    const c = profile.neonColor;

    switch (profile.id) {
      case 'pixel_painter':
        // Hooded cyber hacker with glowing glasses (as in demo drawing screenshot)
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Hood outline */}
            <path
              d="M 50 12 C 32 12, 22 28, 22 52 C 22 75, 30 84, 18 92 L 82 92 C 70 84, 78 75, 78 52 C 78 28, 68 12, 50 12 Z"
              fill="none"
              stroke={c}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Inner face silhouette */}
            <path
              d="M 36 44 C 36 34, 42 28, 50 28 C 58 28, 64 34, 64 44 C 64 58, 58 68, 50 72 C 42 68, 36 58, 36 44 Z"
              fill={c}
              fillOpacity="0.15"
            />
            {/* Neon rectangular glasses */}
            <rect x="33" y="44" width="14" height="8" rx="2" fill="none" stroke={c} strokeWidth="3.5" />
            <rect x="53" y="44" width="14" height="8" rx="2" fill="none" stroke={c} strokeWidth="3.5" />
            <line x1="47" y1="48" x2="53" y2="48" stroke={c} strokeWidth="3" />
            {/* Collar glow line */}
            <path d="M 32 78 L 50 86 L 68 78" fill="none" stroke={c} strokeWidth="3" />
          </svg>
        );

      case 'detective_dora':
        // Sleek detective silhouette with glowing brim & fedora
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Fedora Crown */}
            <path
              d="M 32 40 C 32 24, 40 18, 50 18 C 60 18, 68 24, 68 40 Z"
              fill={c}
              fillOpacity="0.2"
              stroke={c}
              strokeWidth="3.5"
            />
            {/* Fedora Brim */}
            <path d="M 16 46 Q 50 40 84 46 Q 50 48 16 46 Z" fill={c} fillOpacity="0.8" />
            {/* Face & detective spectacles */}
            <path d="M 34 52 Q 50 78 66 52" fill="none" stroke={c} strokeWidth="3" />
            <circle cx="41" cy="56" r="4.5" fill="none" stroke={c} strokeWidth="2.5" />
            <circle cx="59" cy="56" r="4.5" fill="none" stroke={c} strokeWidth="2.5" />
            <line x1="45.5" y1="56" x2="54.5" y2="56" stroke={c} strokeWidth="2.5" />
            {/* Trenchcoat collar */}
            <path d="M 28 88 L 44 68 L 50 76 L 56 68 L 72 88" fill="none" stroke={c} strokeWidth="3.5" />
          </svg>
        );

      case 'silent_sam':
        // Modern sleek cyber helmet / visor (Astra/Sivera archetype)
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Helmet dome */}
            <path
              d="M 50 16 C 30 16, 24 32, 24 55 C 24 74, 34 84, 50 84 C 66 84, 76 74, 76 55 C 76 32, 70 16, 50 16 Z"
              fill={c}
              fillOpacity="0.12"
              stroke={c}
              strokeWidth="3.5"
            />
            {/* Glowing visor bar */}
            <path
              d="M 30 46 Q 50 42 70 46 L 68 56 Q 50 52 32 56 Z"
              fill={c}
              fillOpacity="0.9"
            />
            {/* Cheek vents */}
            <line x1="32" y1="66" x2="42" y2="70" stroke={c} strokeWidth="2.5" />
            <line x1="68" y1="66" x2="58" y2="70" stroke={c} strokeWidth="2.5" />
          </svg>
        );

      case 'mystery_max':
        // Sleek cyber scholar / optic lenses
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Head profile */}
            <circle cx="50" cy="46" r="26" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="3.5" />
            {/* Cyber hex optic spectacles */}
            <polygon points="32,44 44,40 46,52 38,58 28,54" fill="none" stroke={c} strokeWidth="3" />
            <polygon points="68,44 56,40 54,52 62,58 72,54" fill="none" stroke={c} strokeWidth="3" />
            <line x1="45" y1="46" x2="55" y2="46" stroke={c} strokeWidth="2.5" />
            {/* Tech antenna/jack */}
            <path d="M 24 40 L 16 34 M 16 34 L 16 26" stroke={c} strokeWidth="3" strokeLinecap="round" />
            {/* Neck guard */}
            <path d="M 36 74 L 50 80 L 64 74" stroke={c} strokeWidth="3" fill="none" />
          </svg>
        );

      case 'clue_claire':
        // Bio-Signal analyst with glowing tactical headset
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Head curve */}
            <path
              d="M 50 20 C 34 20, 28 32, 28 50 C 28 68, 36 78, 50 78 C 64 78, 72 68, 72 50 C 72 32, 66 20, 50 20 Z"
              fill={c}
              fillOpacity="0.15"
              stroke={c}
              strokeWidth="3.5"
            />
            {/* Headset Arc */}
            <path d="M 22 52 C 20 28, 80 28, 78 52" fill="none" stroke={c} strokeWidth="3.5" />
            {/* Ear pads */}
            <rect x="18" y="44" width="8" height="18" rx="3" fill={c} />
            <rect x="74" y="44" width="8" height="18" rx="3" fill={c} />
            {/* Mic boom */}
            <path d="M 24 58 Q 30 74 42 74" fill="none" stroke={c} strokeWidth="2.5" />
            <circle cx="44" cy="74" r="3" fill={c} />
          </svg>
        );

      case 'spy_steve':
        // Armored Spec-Ops Helmet with glowing red slit eyes (matching voting screenshot!)
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Tactical Helmet outline */}
            <path
              d="M 50 14 L 74 24 L 78 56 L 68 84 L 50 90 L 32 84 L 22 56 L 26 24 Z"
              fill={c}
              fillOpacity="0.18"
              stroke={c}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Menacing angular glowing eyes */}
            <polygon points="32,46 45,49 43,55 31,52" fill={c} />
            <polygon points="68,46 55,49 57,55 69,52" fill={c} />
            {/* Central brow ridge */}
            <path d="M 50 22 L 50 46" stroke={c} strokeWidth="3" />
            <path d="M 38 68 L 50 74 L 62 68" stroke={c} strokeWidth="3" fill="none" />
          </svg>
        );

      case 'artist_anna':
        // Valkyrie / Chromatic Specialist with sleek winged crown
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Crest / Wing ears */}
            <path d="M 18 30 L 32 46 L 24 64" fill="none" stroke={c} strokeWidth="3.5" />
            <path d="M 82 30 L 68 46 L 76 64" fill="none" stroke={c} strokeWidth="3.5" />
            {/* Face mask */}
            <path
              d="M 50 22 C 38 22, 32 34, 32 50 C 32 68, 42 78, 50 82 C 58 78, 68 68, 68 50 C 68 34, 62 22, 50 22 Z"
              fill={c}
              fillOpacity="0.15"
              stroke={c}
              strokeWidth="3.5"
            />
            {/* Star/Gem forehead */}
            <polygon points="50,28 53,36 61,36 54,41 57,48 50,43 43,48 46,41 39,36 47,36" fill={c} />
            {/* Cyber cheek markings */}
            <line x1="38" y1="56" x2="46" y2="60" stroke={c} strokeWidth="2.5" />
            <line x1="62" y1="56" x2="54" y2="60" stroke={c} strokeWidth="2.5" />
          </svg>
        );

      case 'hunter_hank':
      default:
        // Space bounty hunter with glowing blast shield visor
        return (
          <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-md">
            {/* Helmet shell */}
            <path
              d="M 50 16 C 30 16, 22 28, 22 50 C 22 72, 32 86, 50 86 C 68 86, 78 72, 78 50 C 78 28, 70 16, 50 16 Z"
              fill={c}
              fillOpacity="0.16"
              stroke={c}
              strokeWidth="4"
            />
            {/* Hex visor shield */}
            <polygon
              points="30,42 70,42 74,58 64,68 36,68 26,58"
              fill={c}
              fillOpacity="0.85"
            />
            {/* Forehead crest */}
            <rect x="46" y="22" width="8" height="12" rx="2" fill={c} />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#0A0D14] transition-all duration-300 ${currentSizeClass} ${
        showBorder ? `border-2 ${profile.ringClass}` : ''
      } ${className} shrink-0`}
      style={{
        boxShadow: showBorder ? profile.glowShadow : 'none',
      }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 rounded-full opacity-35 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${profile.neonColor} 0%, transparent 70%)`,
        }}
      />

      {/* Render Persona Vector Silhouette */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {renderGamerVector()}
      </div>

      {/* Speaking Animated Ripple Halos */}
      {isSpeaking && (
        <span
          className="absolute -inset-1.5 rounded-full border-2 animate-ping pointer-events-none opacity-75"
          style={{ borderColor: profile.neonColor }}
        />
      )}

      {/* Drawing Active Spark Indicator */}
      {isDrawing && (
        <div
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg border border-black z-20 animate-pulse"
          style={{ backgroundColor: profile.neonColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
};
