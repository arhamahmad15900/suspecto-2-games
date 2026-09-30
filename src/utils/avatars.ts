/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GAMER_PROFILES, getGamerProfile } from './gamerProfiles.js';

export interface AvatarDef {
  id: string;
  name: string;
  color: string;
  iconName: string;
  archetype?: string;
  neonColor?: string;
}

export const AVATAR_LIST: AvatarDef[] = GAMER_PROFILES.map((p) => ({
  id: p.id,
  name: p.name,
  color: p.bgGradient,
  iconName: p.iconName,
  archetype: p.archetype,
  neonColor: p.neonColor,
}));

export function getAvatarColor(avatarId: string): string {
  const profile = getGamerProfile(avatarId);
  return profile.bgGradient;
}

export { GAMER_PROFILES, getGamerProfile } from './gamerProfiles.js';
