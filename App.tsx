
import React, { useState, useCallback } from 'react';
import { generatePixelArt, resampleImageToGrid } from './services/geminiService';
import PromptForm from './components/PromptForm';
import ImageDisplay from './components/ImageDisplay';
import { GithubIcon, SparklesIcon } from './components/Icons';


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(64);
  const [height, setHeight] = useState<number>(64);

  const handleGenerateImage = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setSubmittedPrompt(currentPrompt);

    try {
      let imageUrl = await generatePixelArt(currentPrompt);

      // Always resample the image to the user-defined grid.
      imageUrl = await resampleImageToGrid(imageUrl, width, height);

      setGeneratedImage(imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [width, height]); 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-pink-500 selection:text-white">
      <div className="w-full max-w-2xl bg-slate-800 bg-opacity-60 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <SparklesIcon className="h-10 w-10 text-pink-500" />
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400">
              Pixel Art Genie
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Craft stunning pixel art from your imagination using AI.
          </p>
        </header>

        <main>
          <PromptForm
            onSubmit={handleGenerateImage}
            isLoading={isLoading}
            initialPrompt={prompt}
            setPrompt={setPrompt}
            width={width}
            setWidth={setWidth}
            height={height}
            setHeight={setHeight}
          />
          <ImageDisplay
            imageSrc={generatedImage}
            isLoading={isLoading}
            error={error}
            promptText={submittedPrompt}
          />
        </main>
      </div>
      <footer className="text-center mt-8 text-slate-500">
        <p>Powered by Google Gemini & Imagen 3</p>
        <a
          href="https://github.com/google/genai-js"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:text-pink-400 transition-colors mt-2"
        >
          <GithubIcon className="w-5 h-5 mr-2" />
          View GenAI SDK on GitHub
        </a>
      </footer>
    </div>
  );
};

export default App;