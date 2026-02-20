import { useEffect, useRef, useCallback } from 'react';
import { drawFlower } from '../utils/pixelFlower';

const PIXEL_SIZE = parseInt(import.meta.env.VITE_PIXEL_SIZE || '8');
const CANVAS_W = parseInt(import.meta.env.VITE_CANVAS_WIDTH || '800');
const CANVAS_H = parseInt(import.meta.env.VITE_CANVAS_HEIGHT || '600');

export default function Canvas({ pixels, onPixelClick }) {
  const canvasRef = useRef(null);

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

  const handleClick = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
      onPixelClick(x, y);
    },
    [onPixelClick]
  );

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={handleClick}
      style={{
        cursor: 'crosshair',
        border: '1px solid #30363d',
        borderRadius: '4px',
        display: 'block',
      }}
    />
  );
}
