/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * gamerProfiles.ts — Defines the unique visual gamer profile styles,
 * archetypes, neon colorways, and avatars inspired directly by the
 * Suspecto game UI demo screenshots.
 */

export interface GamerProfileStyle {
  id: string;
  name: string;
  archetype: string;
  neonColor: string;
  glowShadow: string;
  bgGradient: string;
  ringClass: string;
  textClass: string;
  iconName: string;
  title: string;
  bio: string;
}

export const GAMER_PROFILES: GamerProfileStyle[] = [
  {
    id: 'pixel_painter',
    name: 'PixelPainter',
    archetype: 'Astra',
    neonColor: '#00F0FF',
    glowShadow: '0 0 16px rgba(0, 240, 255, 0.65)',
    bgGradient: 'from-cyan-900/60 via-slate-900/90 to-black',
    ringClass: 'border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.55)]',
    textClass: 'text-[#00F0FF]',
    iconName: 'Palette',
    title: 'Neon Virtuoso',
    bio: 'Precision line drawer specializing in cyber strokes and deceptive detail.',
  },
  {
    id: 'detective_dora',
    name: 'DetectiveDora',
    archetype: 'Ethereal',
    neonColor: '#FFB800',
    glowShadow: '0 0 16px rgba(255, 184, 0, 0.65)',
    bgGradient: 'from-amber-900/60 via-slate-900/90 to-black',
    ringClass: 'border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.55)]',
    textClass: 'text-[#FFB800]',
    iconName: 'Search',
    title: 'Senior Inquisitor',
    bio: 'Observes hesitation patterns, stroke speeds, and voice inflections.',
  },
  {
    id: 'silent_sam',
    name: 'SilentSam',
    archetype: 'Sivera',
    neonColor: '#3B82F6',
    glowShadow: '0 0 16px rgba(59, 130, 246, 0.65)',
    bgGradient: 'from-blue-900/60 via-slate-900/90 to-black',
    ringClass: 'border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.55)]',
    textClass: 'text-[#3B82F6]',
    iconName: 'Eye',
    title: 'Covert Observer',
    bio: 'Maintains composure during intense tribunal votes; strikes unexpectedly.',
  },
  {
    id: 'mystery_max',
    name: 'MysteryMax',
    archetype: 'Oracle',
    neonColor: '#EAB308',
    glowShadow: '0 0 16px rgba(234, 179, 8, 0.65)',
    bgGradient: 'from-yellow-950/60 via-slate-900/90 to-black',
    ringClass: 'border-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.55)]',
    textClass: 'text-[#EAB308]',
    iconName: 'Cpu',
    title: 'Logic Decoder',
    bio: 'Cross-examines clue categories against suspected imposter bluffs.',
  },
  {
    id: 'clue_claire',
    name: 'ClueClaire',
    archetype: 'Syona',
    neonColor: '#10B981',
    glowShadow: '0 0 16px rgba(16, 185, 129, 0.65)',
    bgGradient: 'from-emerald-950/60 via-slate-900/90 to-black',
    ringClass: 'border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.55)]',
    textClass: 'text-[#10B981]',
    iconName: 'Sparkles',
    title: 'Bio-Signal Analyst',
    bio: 'Tracks rapid voting switches and builds solid crew consensus.',
  },
  {
    id: 'spy_steve',
    name: 'SpySteve',
    archetype: 'Katri',
    neonColor: '#EF4444',
    glowShadow: '0 0 16px rgba(239, 68, 68, 0.65)',
    bgGradient: 'from-red-950/60 via-slate-900/90 to-black',
    ringClass: 'border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.55)]',
    textClass: 'text-[#EF4444]',
    iconName: 'Shield',
    title: 'Apex Infiltrator',
    bio: 'Masters the plausible stroke. Feigns ignorance while steering suspicion.',
  },
  {
    id: 'artist_anna',
    name: 'ArtistAnna',
    archetype: 'Valkyrie',
    neonColor: '#EC4899',
    glowShadow: '0 0 16px rgba(236, 72, 153, 0.65)',
    bgGradient: 'from-pink-950/60 via-slate-900/90 to-black',
    ringClass: 'border-[#EC4899] shadow-[0_0_15px_rgba(236,72,153,0.55)]',
    textClass: 'text-[#EC4899]',
    iconName: 'Feather',
    title: 'Chromatic Specialist',
    bio: 'Executes subtle multi-color strokes that crew instantly decode.',
  },
  {
    id: 'hunter_hank',
    name: 'HunterHank',
    archetype: 'Vanguard',
    neonColor: '#F97316',
    glowShadow: '0 0 16px rgba(249, 115, 22, 0.65)',
    bgGradient: 'from-orange-950/60 via-slate-900/90 to-black',
    ringClass: 'border-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.55)]',
    textClass: 'text-[#F97316]',
    iconName: 'Flame',
    title: 'Relentless Tracker',
    bio: 'Pressures suspects during voice chat until the real imposter falters.',
  },
];

// Mapping for backwards compatibility with previous avatar IDs
const LEGACY_MAP: Record<string, string> = {
  detective: 'detective_dora',
  artist: 'pixel_painter',
  ninja: 'silent_sam',
  cyber: 'mystery_max',
  owl: 'clue_claire',
  fox: 'hunter_hank',
  alien: 'spy_steve',
  cat: 'artist_anna',
};

export function getGamerProfile(avatarId: string): GamerProfileStyle {
  const normalizedId = LEGACY_MAP[avatarId] || avatarId;
  const match = GAMER_PROFILES.find((p) => p.id === normalizedId);
  return match || GAMER_PROFILES[0];
}

export function getGamerProfileByIndex(index: number): GamerProfileStyle {
  return GAMER_PROFILES[index % GAMER_PROFILES.length];
}
