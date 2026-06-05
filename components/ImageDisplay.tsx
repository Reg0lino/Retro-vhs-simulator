
import React from 'react';
import LoadingSpinner from './LoadingSpinner'; // Using the separate LoadingSpinner component
import { ImageIcon, AlertTriangleIcon } from './Icons';


interface ImageDisplayProps {
  imageSrc: string | null;
  isLoading: boolean;
  error: string | null;
  promptText: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageSrc, isLoading, error, promptText }) => {
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
      <div className="mt-6 w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-2xl border-2 border-pink-500/50">
        <img
          src={imageSrc}
          alt={promptText ? `Pixel art: ${promptText}` : 'Generated pixel art'}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }} // Helps browsers scale pixel art correctly
        />
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
    