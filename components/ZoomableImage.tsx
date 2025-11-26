
import React, { useState, useRef, MouseEvent, WheelEvent } from 'react';
import { Icon } from './Icon';

interface ZoomableImageProps {
  src: string;
  alt: string;
  filterClassName?: string;
}

const MAX_SCALE = 5;
const MIN_SCALE = 0.5;
const ZOOM_SENSITIVITY = 0.001;

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, filterClassName = '' }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale - e.deltaY * ZOOM_SENSITIVITY));
    setScale(newScale);
  };

  const handleMouseDown = (e: MouseEvent<HTMLImageElement>) => {
    if (scale <= 1) return;
    e.preventDefault();
    isPanning.current = true;
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent<HTMLImageElement>) => {
    if (!isPanning.current) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y,
    });
  };

  const handleMouseUpOrLeave = (e: MouseEvent<HTMLImageElement>) => {
    if (isPanning.current) {
        e.preventDefault();
        isPanning.current = false;
        e.currentTarget.style.cursor = 'grab';
    }
  };
  
  const adjustScale = (newScale: number) => {
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
  }

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
        className="relative w-full h-80 bg-gray-700 rounded-lg overflow-hidden group select-none"
        onWheel={handleWheel}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain transition-transform duration-100 ease-out ${filterClassName}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          cursor: scale > 1 ? 'grab' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        draggable="false"
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-gray-900/50 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => adjustScale(scale * 1.25)} className="p-1.5 text-white hover:bg-gray-700/80 rounded-md" title="Aumentar zoom"><Icon name="zoom-in" className="w-5 h-5"/></button>
        <button onClick={() => adjustScale(scale / 1.25)} className="p-1.5 text-white hover:bg-gray-700/80 rounded-md" title="Diminuir zoom"><Icon name="zoom-out" className="w-5 h-5"/></button>
        <button onClick={handleReset} className="p-1.5 text-white hover:bg-gray-700/80 rounded-md" title="Resetar zoom"><Icon name="zoom-reset" className="w-5 h-5"/></button>
      </div>
    </div>
  );
};