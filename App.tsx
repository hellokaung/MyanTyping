import React, { useState, useEffect } from 'react';
import { Keyboard, ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import { Lesson, ThemeMode } from './types';
import { STORAGE_KEY_THEME, DEFAULT_LESSONS } from './constants';
import Dashboard from './components/Dashboard';
import TypingArea from './components/TypingArea';

const App: React.FC = () => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('system');

  // Load theme from storage
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem(STORAGE_KEY_THEME, theme);

    const applyDark = () => root.classList.add('dark');
    const removeDark = () => root.classList.remove('dark');

    if (theme === 'dark') {
      applyDark();
    } else if (theme === 'light') {
      removeDark();
    } else if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyDark();
      } else {
        removeDark();
      }
    }
  }, [theme]);

  // Listen for system changes if in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mediaQuery.matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun size={20} />;
      case 'dark': return <Moon size={20} />;
      case 'system': return <Monitor size={20} />;
    }
  };

  const hasNextLesson = currentLesson && DEFAULT_LESSONS.some(l => l.id === currentLesson.id) && 
    DEFAULT_LESSONS.findIndex(l => l.id === currentLesson.id) < DEFAULT_LESSONS.length - 1;

  const handleNextLesson = () => {
    if (!currentLesson) return;
    const idx = DEFAULT_LESSONS.findIndex(l => l.id === currentLesson.id);
    if (idx !== -1 && idx < DEFAULT_LESSONS.length - 1) {
      setCurrentLesson(DEFAULT_LESSONS[idx + 1]);
    } else {
      setCurrentLesson(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans selection:bg-red-200 dark:selection:bg-red-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white cursor-pointer"
            onClick={() => setCurrentLesson(null)}
          >
            <div className="bg-red-600 text-white p-1.5 rounded-lg">
              <Keyboard size={20} />
            </div>
            <span>MyanType</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Master Burmese Typing
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-all"
              title={`Theme: ${theme}`}
            >
              {getThemeIcon()}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {currentLesson ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
              <button 
                onClick={() => setCurrentLesson(null)}
                className="flex items-center gap-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors font-medium"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </button>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 font-myanmar">{currentLesson.title}</h2>
            </div>
            <TypingArea 
              lesson={currentLesson} 
              onComplete={() => setCurrentLesson(null)}
              onNext={hasNextLesson ? handleNextLesson : undefined}
            />
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10 pt-4">
              <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-3 tracking-tight">
                Practice Burmese Typing
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                Improve your speed and accuracy with standard lessons or generate your own using AI.
              </p>
            </div>
            <Dashboard onSelectLesson={setCurrentLesson} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-zinc-400 dark:text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} MyanType. Designed for learning.</p>
      </footer>
    </div>
  );
};

export default App;