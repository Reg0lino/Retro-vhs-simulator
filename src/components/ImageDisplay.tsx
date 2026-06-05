
import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ImageIcon, AlertTriangleIcon } from './Icons';

interface ImageDisplayProps {
  imageSrc: string | null;
  isLoading: boolean;
  error: string | null;
  promptText: string | null;
  showGrid: boolean;
  width: number;
  height: number;
  gridOpacity: number;
}

const GridOverlay: React.FC<{ width: number; height: number; gridOpacity: number }> = ({ width, height, gridOpacity }) => {
    // We want lines *between* the pixels.
    // For a width of 8, we need 7 lines.
    const verticalLines = Array.from({ length: width - 1 }, (_, i) => `M ${((i + 1) / width) * 100}% 0 V 100%`).join(' ');
    const horizontalLines = Array.from({ length: height - 1 }, (_, i) => `M 0 ${((i + 1) / height) * 100}% H 100%`).join(' ');
    
    // Create a unique ID for the pattern to avoid conflicts if multiple grids are ever rendered.
    const patternId = `grid-pattern-${width}-${height}`;

    return (
        <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            aria-hidden="true"
        >
            <defs>
                <pattern id={patternId} width={1/width * 100 + '%'} height={1/height * 100 + '%'} patternUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="none" stroke={`rgba(255, 255, 255, ${gridOpacity})`} strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );
};


const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageSrc, 
  isLoading, 
  error, 
  promptText,
  showGrid,
  width,
  height,
  gridOpacity
}) => {
  const containerClasses = "mt-6 aspect-square w-full max-w-md mx-auto bg-slate-700 bg-opacity-50 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center p-6 transition-all duration-300 ease-in-out";

  if (isLoading) {
    return (
      <div className={`${containerClasses} animate-pulse`}>
        <LoadingSpinner />
        <p className="mt-3 text-slate-400 text-sm">Conjuring pixels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${containerClasses} border-red-500`}>
        <AlertTriangleIcon className="h-12 w-12 text-red-400 mb-3" />
        <p className="text-red-400 font-semibold">Oops! Something went wrong.</p>
        <p className="text-slate-400 text-sm text-center mt-1">{error}</p>
      </div>
    );
  }
  
  if (imageSrc) {
    return (
      <div className="mt-6 w-full max-w-md mx-auto flex flex-col items-center gap-4">
        <div 
          className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl border-2 border-pink-500/50 bg-slate-800/50"
          aria-label={promptText ? `Pixel art: ${promptText}` : 'Generated pixel art'}
        >
            <img
              src={imageSrc}
              alt={promptText ? `Pixel art: ${promptText}` : 'Generated pixel art'}
              className="w-full h-full object-contain block"
              style={{ imageRendering: 'pixelated' }}
            />
          {showGrid && <GridOverlay width={width} height={height} gridOpacity={gridOpacity} />}
        </div>
      </div>
    );
  }

  // Initial placeholder state
  return (
    <div className={containerClasses}>
      <ImageIcon className="h-16 w-16 text-slate-500 mb-3" />
      <p className="text-slate-400 text-center">Your generated pixel art will appear here.</p>
      <p className="text-slate-500 text-xs mt-1">Enter a prompt and click "Generate".</p>
    </div>
  );
};

export default ImageDisplay;
