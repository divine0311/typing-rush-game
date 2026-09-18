import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../lib/GameEngine';
import { UIState } from '../types';

interface GameCanvasProps {
  onUIUpdate: (ui: UIState) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export function GameCanvas({ onUIUpdate, engineRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const engine = new GameEngine(canvasRef.current, onUIUpdate);
    engineRef.current = engine;

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          engine.resize(width, height);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      engine.destroy();
    };
  }, []); // Empty dependency array ensures this runs once

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
