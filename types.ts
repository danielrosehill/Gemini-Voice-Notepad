export enum RecordingState {
  Idle = 'idle',
  Recording = 'recording',
  Paused = 'paused',
  Stopped = 'stopped',
}

export interface Transcription {
  title: string;
  content: string;
}

export type ReformatFormat = 
  | 'Email' 
  | 'Memo' 
  | 'Blog Post' 
  | 'Summary'
  | 'Development Prompt' 
  | 'AI Prompt'
  | 'Meeting Minutes'
  | 'Social Media Post'
  | 'Press Release'
  | 'To-Do List';

export type ReformatStyle = 'Business Appropriate' | 'Formal' | 'Informal';

export interface ReformatOptions {
  format: ReformatFormat;
  style: ReformatStyle;
}
