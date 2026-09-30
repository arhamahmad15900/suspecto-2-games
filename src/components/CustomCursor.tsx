/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CustomCursor — magnetic dot cursor for premium feel.
 * Hides on touch devices. Expands on interactive hover.
 */

import React, { useState, useEffect, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const posRef   = useRef({ x: -200, y: -200 });
  const ringPos  = useRef({ x: -200, y: -200 });
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    // Only on fine-pointer (mouse) devices
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);

    document.documentElement.classList.add('cursor-active');

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const onEnterInteractive = () => {
      if (dotRef.current) {
        dotRef.current.style.transform   = 'translate(-50%,-50%) scale(2.2)';
        dotRef.current.style.background  = 'rgba(245,166,35,0.9)';
      }
      if (ringRef.current) {
        ringRef.current.style.transform  = 'translate(-50%,-50%) scale(1.8)';
        ringRef.current.style.borderColor = 'rgba(245,166,35,0.6)';
      }
    };

    const onLeaveInteractive = () => {
      if (dotRef.current) {
        dotRef.current.style.transform  = 'translate(-50%,-50%) scale(1)';
        dotRef.current.style.background = 'rgba(245,166,35,0.95)';
      }
      if (ringRef.current) {
        ringRef.current.style.transform = 'translate(-50%,-50%) scale(1)';
        ringRef.current.style.borderColor = 'rgba(245,166,35,0.35)';
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });

    // Delegated interaction detection
    const delegatedEnter = (e: Event) => {
      const el = (e.target as Element)?.closest?.('button, a, input, select, textarea, [role="button"], label, .interactive');
      if (el) onEnterInteractive();
    };
    const delegatedLeave = (e: Event) => {
      const el = (e.target as Element)?.closest?.('button, a, input, select, textarea, [role="button"], label, .interactive');
      if (el) onLeaveInteractive();
    };
    document.addEventListener('mouseover', delegatedEnter, { passive: true });
    document.addEventListener('mouseout',  delegatedLeave, { passive: true });

    // RAF loop for smooth ring lag
    const loop = () => {
      const { x, y } = posRef.current;
      if (dotRef.current) {
        dotRef.current.style.left = x + 'px';
        dotRef.current.style.top  = y + 'px';
      }

      ringPos.current.x += (x - ringPos.current.x) * 0.12;
      ringPos.current.y += (y - ringPos.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ringPos.current.x + 'px';
        ringRef.current.style.top  = ringPos.current.y + 'px';
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('cursor-active');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', delegatedEnter);
      document.removeEventListener('mouseout',  delegatedLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'rgba(245,166,35,0.95)',
          pointerEvents: 'none',
          zIndex: 99999,
          transform: 'translate(-50%,-50%)',
          transition: 'transform 0.2s ease, background 0.2s ease',
          mixBlendMode: 'screen',
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(245,166,35,0.35)',
          pointerEvents: 'none',
          zIndex: 99998,
          transform: 'translate(-50%,-50%)',
          transition: 'transform 0.3s ease, border-color 0.3s ease',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
};
