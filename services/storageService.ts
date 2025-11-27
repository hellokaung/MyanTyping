import { TypingResult, Lesson } from '../types';
import { STORAGE_KEY_RESULTS, STORAGE_KEY_CUSTOM_LESSONS } from '../constants';

export const saveResult = (result: TypingResult): void => {
  const existingStr = localStorage.getItem(STORAGE_KEY_RESULTS);
  const existing: TypingResult[] = existingStr ? JSON.parse(existingStr) : [];
  const updated = [result, ...existing]; // Prepend new result
  localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(updated));
};

export const getResults = (): TypingResult[] => {
  const str = localStorage.getItem(STORAGE_KEY_RESULTS);
  return str ? JSON.parse(str) : [];
};

export const saveCustomLesson = (lesson: Lesson): void => {
  const existingStr = localStorage.getItem(STORAGE_KEY_CUSTOM_LESSONS);
  const existing: Lesson[] = existingStr ? JSON.parse(existingStr) : [];
  const updated = [...existing, lesson];
  localStorage.setItem(STORAGE_KEY_CUSTOM_LESSONS, JSON.stringify(updated));
};

export const getCustomLessons = (): Lesson[] => {
  const str = localStorage.getItem(STORAGE_KEY_CUSTOM_LESSONS);
  return str ? JSON.parse(str) : [];
};

export const clearResults = (): void => {
  localStorage.removeItem(STORAGE_KEY_RESULTS);
};
