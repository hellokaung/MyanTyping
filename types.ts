export interface Lesson {
  id: string;
  title: string;
  content: string;
  source: 'default' | 'custom' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TypingResult {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  lessonId: string;
  durationSeconds: number;
}

export interface ChartDataPoint {
  date: string;
  wpm: number;
  accuracy: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
