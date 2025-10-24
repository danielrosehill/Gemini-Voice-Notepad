import React, { useState } from 'react';
import type { Transcription, ReformatFormat, ReformatStyle, ReformatOptions } from '../types';
import { ClipboardIcon, DownloadIcon, CheckIcon } from './icons';

interface ResultsPaneProps {
  transcription: Transcription | null;
  reformattedText: Transcription | null;
  onReformat: (options: ReformatOptions) => void;
  isLoading: { transcription: boolean; reformatting: boolean };
  error: string | null;
}

const ResultCard: React.FC<{ title: string; content: string; label: string }> = ({ title, content, label }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const markdownContent = `# ${title}\n\n${content}`;
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg relative animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider">{label}</span>
                    <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300">
                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon />}
                    </button>
                    <button onClick={handleDownload} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300">
                        <DownloadIcon />
                    </button>
                </div>
            </div>
            <div className="prose prose-invert prose-slate max-w-none max-h-60 overflow-y-auto bg-slate-900/50 p-4 rounded-lg">
                {content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
        </div>
    );
};


const ReformatControls: React.FC<{ onReformat: (options: ReformatOptions) => void; isBusy: boolean }> = ({ onReformat, isBusy }) => {
    const [format, setFormat] = useState<ReformatFormat>('Email');
    const [styleValue, setStyleValue] = useState<number>(1); // 0: Informal, 1: Business, 2: Formal

    const commonFormats: ReformatFormat[] = ['Email', 'Memo', 'Blog Post', 'Summary'];
    const nicheFormats: ReformatFormat[] = ['Development Prompt', 'AI Prompt', 'Meeting Minutes', 'Social Media Post', 'Press Release', 'To-Do List'];
    
    const styleLabels: ReformatStyle[] = ['Informal', 'Business Appropriate', 'Formal'];
    const currentStyle: ReformatStyle = styleLabels[styleValue];

    const handleFormatButtonClick = (f: ReformatFormat) => {
        setFormat(f);
        const dropdown = document.getElementById('niche-formats-select') as HTMLSelectElement;
        if (dropdown) dropdown.value = "placeholder";
    };

    const handleFormatDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedFormat = e.target.value;
        if (selectedFormat !== "placeholder") {
            setFormat(selectedFormat as ReformatFormat);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReformat({ format, style: currentStyle });
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">Reformat Transcript</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                    <div className="flex flex-wrap gap-2">
                        {commonFormats.map(f => (
                            <button key={f} type="button" onClick={() => handleFormatButtonClick(f)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${format === f && !nicheFormats.includes(format) ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                     <select
                        id="niche-formats-select"
                        onChange={handleFormatDropdownChange}
                        value={nicheFormats.includes(format) ? format : 'placeholder'}
                        className="mt-3 w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        <option value="placeholder">More formats...</option>
                        {nicheFormats.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="style-slider" className="block text-sm font-medium text-slate-300 mb-2">Style: <span className="font-bold text-blue-400">{currentStyle}</span></label>
                    <input
                        id="style-slider"
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={styleValue}
                        onChange={(e) => setStyleValue(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                     <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                        <span>Informal</span>
                        <span>Business</span>
                        <span>Formal</span>
                    </div>
                </div>
                <button type="submit" disabled={isBusy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                    {isBusy ? 'Reformatting...' : 'Reformat'}
                </button>
            </form>
            <p className="text-xs text-slate-500 mt-4 text-center">Note: Reformatting will overwrite the previous reformatted version. Copy any text you wish to save.</p>
        </div>
    );
};


export const ResultsPane: React.FC<ResultsPaneProps> = ({ transcription, reformattedText, onReformat, isLoading, error }) => {
  return (
    <div className="space-y-8">
      {isLoading.transcription && <div className="text-center p-8 bg-slate-800 rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div><p className="mt-4">Transcribing audio...</p></div>}
      
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">{error}</div>}

      {transcription && <ResultCard title={transcription.title} content={transcription.content} label="Transcription" />}
      
      {transcription && <ReformatControls onReformat={onReformat} isBusy={isLoading.reformatting} />}

      {isLoading.reformatting && <div className="text-center p-8 bg-slate-800 rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div><p className="mt-4">Reformatting text...</p></div>}
      
      {reformattedText && <ResultCard title={reformattedText.title} content={reformattedText.content} label="Reformatted Text" />}

      {!isLoading.transcription && !transcription && (
        <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center h-full flex items-center justify-center">
            <p className="text-slate-500">Your transcription results will appear here.</p>
        </div>
      )}
    </div>
  );
};
