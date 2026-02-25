import { useEffect, useRef, useCallback, useState } from 'react';
import { drawFlower } from '../utils/pixelFlower';

const PIXEL_SIZE = parseInt(import.meta.env.VITE_PIXEL_SIZE || '8');
const CANVAS_W = parseInt(import.meta.env.VITE_CANVAS_WIDTH || '1500');
const CANVAS_H = parseInt(import.meta.env.VITE_CANVAS_HEIGHT || '1500');

export default function Canvas({ pixels, onPixelClick }) {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  // Redraw the entire canvas whenever pixels state changes
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const [key, pixel] of Object.entries(pixels)) {
      const [x, y] = key.split(':').map(Number);
      drawFlower(ctx, x, y, pixel.color, PIXEL_SIZE);
    }
  }, [pixels]);

  const handleMouseDown = useCallback((e) => {
    didDragRef.current = false;
    if (e.altKey) {
      e.preventDefault();
      isPanningRef.current = true;
      setIsPanning(true);
      startRef.current = {
        x: e.clientX - panRef.current.x,
        y: e.clientY - panRef.current.y,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanningRef.current) return;
    didDragRef.current = true;
    const newPan = {
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    };
    panRef.current = newPan;
    setPan(newPan);
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    setIsPanning(false);
  }, []);

  const handleClick = useCallback(
    (e) => {
      if (didDragRef.current) return; // ignore click after alt-drag
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
      onPixelClick(x, y);
    },
    [onPixelClick]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: isPanning ? 'grabbing' : 'crosshair',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        style={{
          border: '1px solid #30363d',
          borderRadius: '4px',
          display: 'block',
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          userSelect: 'none',
        }}
      />
    </div>
  );
}
