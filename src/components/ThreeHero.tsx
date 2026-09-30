/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ThreeHero — Sketchfab embedded 3D model viewer.
 * Replaces the procedural Three.js scene with the Optimus Prime model.
 * Cross-device: fully responsive iframe with pointer-events handled correctly
 * so touch scrolling on mobile still works outside the embed area.
 */

import React, { useRef, useState } from 'react';

export const ThreeHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false);

  /**
   * On mobile/touch devices the iframe would capture all touch events and
   * prevent page scrolling. We solve this with an activation overlay:
   * - On pointer-coarse (touch) devices: show a "tap to interact" overlay.
   *   First tap activates the model; subsequent interaction goes to the iframe.
   * - On pointer-fine (mouse) devices: iframe is always interactive.
   */
  const isTouch =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;

  const handleActivate = () => setActivated(true);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#050608] rounded-3xl overflow-hidden"
    >
      {/* ── Sketchfab iframe ───────────────────────────────── */}
      <iframe
        title="Optimus Prime"
        src="https://sketchfab.com/models/d2dec383a022462b95e491d4e25fe7a1/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_annotations=0&ui_stop=0&ui_controls=0&ui_fullscreen=0&ui_vr=0&ui_loading=0&preload=1&transparent=1"
        frameBorder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{
          border: 'none',
          // On touch devices defer pointer events until user activates
          pointerEvents: isTouch && !activated ? 'none' : 'auto',
        }}
        loading="eager"
      />

      {/* ── Touch activation overlay (mobile only) ────────── */}
      {isTouch && !activated && (
        <button
          onClick={handleActivate}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 cursor-pointer"
          style={{ background: 'rgba(5,6,8,0.35)', backdropFilter: 'blur(2px)' }}
          aria-label="Tap to interact with 3D model"
        >
          {/* Animated touch icon */}
          <span className="text-4xl select-none" style={{ animation: 'float-y 2.4s ease-in-out infinite' }}>
            👆
          </span>
          <span className="font-mono text-xs font-bold text-white/70 uppercase tracking-widest">
            Tap to interact
          </span>
        </button>
      )}

      {/* ── Subtle vignette frame ─────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55), inset 0 0 120px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
};
