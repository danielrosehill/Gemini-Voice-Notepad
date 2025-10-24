import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingState } from '../types';
import { RecordIcon, PauseIcon, StopIcon, SendIcon } from './icons';

interface RecordingPaneProps {
  onSend: (audioBlob: Blob) => void;
  isBusy: boolean;
}

export const RecordingPane: React.FC<RecordingPaneProps> = ({ onSend, isBusy }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    mediaRecorderRef.current = null;
    audioContextRef.current = null;
  }, []);
  
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    setAudioLevel(average);
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, []);

  const setupMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      // Fix: Cast window to `any` to support `webkitAudioContext` for older browsers without TypeScript errors.
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      audioSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      audioSourceRef.current.connect(analyserRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        audioChunksRef.current = [];
        cleanup();
      };
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your browser permissions.");
      return false;
    }
  };

  const startTimer = () => {
    const startTime = Date.now() - elapsedTime * 1000;
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const handleRecord = async () => {
    if (recordingState === RecordingState.Paused) {
      mediaRecorderRef.current?.resume();
      setRecordingState(RecordingState.Recording);
      startTimer();
      monitorAudioLevel();
    } else {
      setAudioBlob(null);
      audioChunksRef.current = [];
      const setupSuccess = await setupMediaRecorder();
      if (setupSuccess) {
        mediaRecorderRef.current?.start();
        setRecordingState(RecordingState.Recording);
        setElapsedTime(0);
        startTimer();
        monitorAudioLevel();
      }
    }
  };

  const handlePause = () => {
    mediaRecorderRef.current?.pause();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setRecordingState(RecordingState.Paused);
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    setRecordingState(RecordingState.Stopped);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setAudioLevel(0);
  };

  const handleCancel = () => {
    cleanup();
    setRecordingState(RecordingState.Idle);
    setElapsedTime(0);
    setAudioLevel(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      setRecordingState(RecordingState.Idle);
      setAudioBlob(null);
      setElapsedTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const canRecord = recordingState === RecordingState.Idle || recordingState === RecordingState.Paused;
  const canPause = recordingState === RecordingState.Recording;
  const canStop = recordingState === RecordingState.Recording || recordingState === RecordingState.Paused;
  const canCancel = recordingState !== RecordingState.Idle && recordingState !== RecordingState.Stopped;
  const canSend = recordingState === RecordingState.Stopped;
  
  const tallyLightColor = audioLevel > 10 ? 'bg-green-500' : 'bg-slate-600';

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg h-full flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Record Audio</h2>
        <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full transition-colors ${tallyLightColor} ${recordingState === RecordingState.Recording ? 'animate-pulse' : ''}`}></div>
            <span className="font-mono text-lg text-slate-300 tracking-wider">{formatTime(elapsedTime)}</span>
          </div>
          <span className="text-sm text-slate-500">
            {recordingState === RecordingState.Recording && "Recording..."}
            {recordingState === RecordingState.Paused && "Paused"}
            {recordingState === RecordingState.Stopped && "Ready to send"}
            {recordingState === RecordingState.Idle && "Ready to record"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={canRecord ? handleRecord : handlePause}
            disabled={isBusy || (!canRecord && !canPause)}
            className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200
              ${ (isBusy || (!canRecord && !canPause)) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md' }`}
          >
            {recordingState === RecordingState.Recording ? <PauseIcon /> : <RecordIcon />}
            {recordingState === RecordingState.Recording ? 'Pause' : 'Record'}
          </button>
          <button
            onClick={handleStop}
            disabled={isBusy || !canStop}
            className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200
              ${ (isBusy || !canStop) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-md' }`}
          >
            <StopIcon /> Stop
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCancel}
            disabled={isBusy || !canCancel}
            className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center transition-all duration-200
            ${ (isBusy || !canCancel) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-600 hover:bg-slate-500 text-white' }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isBusy || !canSend}
            className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200
            ${ (isBusy || !canSend) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-md' }`}
          >
            <SendIcon /> Send
          </button>
        </div>
      </div>
    </div>
  );
};
