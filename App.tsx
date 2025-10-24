
import React, { useState, useCallback } from 'react';
import { RecordingPane } from './components/RecordingPane';
import { ResultsPane } from './components/ResultsPane';
import { transcribeAudio, reformatText } from './services/geminiService';
import { blobToBase64 } from './utils/blob';
import type { Transcription, ReformatOptions } from './types';
import { ClearIcon } from './components/icons';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState({ transcription: false, reformatting: false });
  const [error, setError] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<Transcription | null>(null);
  const [reformattedResult, setReformattedResult] = useState<Transcription | null>(null);

  const handleSendAudio = useCallback(async (audioBlob: Blob) => {
    setIsLoading({ transcription: true, reformatting: false });
    setError(null);
    setTranscriptionResult(null);
    setReformattedResult(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await transcribeAudio(base64Audio, audioBlob.type);
      setTranscriptionResult(result);
    } catch (err) {
      console.error("Transcription Error:", err);
      setError("Failed to transcribe audio. Please try again.");
    } finally {
      setIsLoading({ transcription: false, reformatting: false });
    }
  }, []);

  const handleReformat = useCallback(async (options: ReformatOptions) => {
    if (!transcriptionResult) return;

    setIsLoading({ ...isLoading, reformatting: true });
    setError(null);
    setReformattedResult(null);

    try {
      const result = await reformatText(transcriptionResult.content, options.format, options.style);
      setReformattedResult(result);
    } catch (err) {
      console.error("Reformatting Error:", err);
      setError("Failed to reformat text. Please try again.");
    } finally {
      setIsLoading({ ...isLoading, reformatting: false });
    }
  }, [transcriptionResult, isLoading]);

  const handleClear = () => {
    setTranscriptionResult(null);
    setReformattedResult(null);
    setError(null);
    setIsLoading({ transcription: false, reformatting: false });
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Audio Scribe</h1>
            <p className="text-slate-400 mt-1">Record, Transcribe, and Reformat with Gemini</p>
          </div>
           { (transcriptionResult || reformattedResult) && (
             <button onClick={handleClear} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                <ClearIcon />
                Clear All
             </button>
           )}
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecordingPane onSend={handleSendAudio} isBusy={isLoading.transcription} />
          <ResultsPane
            transcription={transcriptionResult}
            reformattedText={reformattedResult}
            onReformat={handleReformat}
            isLoading={isLoading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
