
import React from 'react';
import { ArrowRightIcon } from './Icons';

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  initialPrompt: string;
  setPrompt: (prompt: string) => void;
  width: number;
  setWidth: (width: number) => void;
  height: number;
  setHeight: (height: number) => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ 
  onSubmit, 
  isLoading, 
  initialPrompt, 
  setPrompt,
  width,
  setWidth,
  height,
  setHeight
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(initialPrompt);
  };

  const handleDimensionChange = (
    value: string,
    setter: (val: number) => void
  ) => {
    if (value === '') {
      setter(1); // Default to 1 if input is cleared
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      // Clamp the value between 1 and 256
      setter(Math.max(1, Math.min(num, 256)));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mb-8">
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-slate-300 mb-2">
              Width
            </label>
            <input
              type="number"
              id="width"
              value={width}
              onChange={(e) => handleDimensionChange(e.target.value, setWidth)}
              min="1"
              max="256"
              disabled={isLoading}
              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-slate-100 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150 ease-in-out"
              aria-label="Pixel width (1-256)"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-2">
              Height
            </label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => handleDimensionChange(e.target.value, setHeight)}
              min="1"
              max="256"
              disabled={isLoading}
              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-slate-100 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150 ease-in-out"
              aria-label="Pixel height (1-256)"
            />
          </div>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-1">
          Enter your pixel art vision
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={3}
          value={initialPrompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-sm text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-150 ease-in-out text-base resize-none"
          placeholder="e.g., a heroic knight, a mystical forest, a futuristic cityscape..."
          disabled={isLoading}
          aria-label="Pixel art prompt"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition duration-150 ease-in-out group"
        aria-label="Generate pixel art"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            Generate Pixel Art
            <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
};

export default PromptForm;