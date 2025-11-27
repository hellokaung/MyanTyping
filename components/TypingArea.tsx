import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCcw, AlertCircle, Clock, Hourglass, ArrowRight, Home } from 'lucide-react';
import { Lesson, TypingResult } from '../types';
import { saveResult } from '../services/storageService';

interface TypingAreaProps {
  lesson: Lesson;
  onComplete: () => void;
  onNext?: () => void;
}

type TimeOption = 0 | 15 | 30 | 60;

const TypingArea: React.FC<TypingAreaProps> = ({ lesson, onComplete, onNext }) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  
  // Timer State
  const [timeLimit, setTimeLimit] = useState<TimeOption>(0); // 0 = unlimited
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const text = lesson.content;

  // Reset when lesson changes
  useEffect(() => {
    resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // Timer Countdown / Countup Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (startTime && !isFinished) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1000;

        if (timeLimit > 0) {
          // Countdown Mode
          const remaining = Math.max(0, timeLimit - diff);
          setTimeLeft(Math.ceil(remaining));

          if (remaining <= 0) {
            finishTest();
          }
        } else {
          // Unlimited Mode (Count up)
          setElapsedSeconds(Math.floor(diff));
        }
      }, 100);
    } else {
      // Reset logic for display if not running
      if (!startTime && timeLimit > 0) setTimeLeft(timeLimit);
      if (!startTime && timeLimit === 0) setElapsedSeconds(0);
    }

    return () => clearInterval(interval);
  }, [startTime, isFinished, timeLimit]);

  // Auto-scroll logic for large paragraphs
  useEffect(() => {
    if (activeCharRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeCharRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Check if element is near the bottom or top of the visible area
      const relativeTop = elementRect.top - containerRect.top;
      const relativeBottom = elementRect.bottom - containerRect.top;

      // Scroll if the active character is getting close to the bottom edge or top edge
      if (relativeBottom > containerRect.height - 60 || relativeTop < 40) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [input]);

  // Shortcuts Listener
  useEffect(() => {
    if (!isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.ctrlKey && e.altKey) {
          // Home
          onComplete();
        } else if (e.altKey) {
          // Retry
          resetState();
        } else {
          // Continue
          if (onNext) {
            onNext();
          } else {
            onComplete();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, onComplete, onNext]);

  const resetState = () => {
    setInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setElapsedSeconds(0);
    setTimeLeft(timeLimit);
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleTimeLimitChange = (limit: TimeOption) => {
    setTimeLimit(limit);
    setInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setElapsedSeconds(0);
    setTimeLeft(limit);
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const calculateStats = useCallback((currentInput: string, endTime: number) => {
    const start = startTime || endTime; // If just started, diff is 0
    const durationInMinutes = Math.max(0.001, (endTime - start) / 60000);

    let correctChars = 0;
    // Only check up to the length of what user typed
    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === text[i]) {
        correctChars++;
      }
    }

    const accuracyVal = currentInput.length > 0 
      ? Math.round((correctChars / currentInput.length) * 100) 
      : 100;
    
    // Standard WPM: (all characters / 5) / time in minutes
    const wpmVal = Math.round((currentInput.length / 5) / durationInMinutes);

    return { wpmVal, accuracyVal };
  }, [startTime, text]);

  const finishTest = () => {
    if (isFinished) return;

    const endTime = Date.now();
    setIsFinished(true);
    
    // Recalculate final stats
    const stats = calculateStats(input, endTime);
    setWpm(stats.wpmVal);
    setAccuracy(stats.accuracyVal);

    const durationSeconds = startTime ? (endTime - startTime) / 1000 : 0;

    const result: TypingResult = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      lessonId: lesson.id,
      wpm: stats.wpmVal,
      accuracy: stats.accuracyVal,
      durationSeconds: durationSeconds
    };

    saveResult(result);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;

    const val = e.target.value;
    const now = Date.now();

    if (!startTime) {
      setStartTime(now);
    }

    // Logic for Unlimited Mode: Prevent typing more than text
    if (timeLimit === 0 && val.length > text.length) return;
    
    // Logic for Time Limit Mode: Stop if text is finished
    if (val.length > text.length) return;

    setInput(val);

    // Update stats live
    const currentStart = startTime || now;
    const durationInMinutes = Math.max(0.001, (now - currentStart) / 60000);
    
    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === text[i]) correctChars++;
    }
    const curAcc = val.length > 0 ? Math.round((correctChars / val.length) * 100) : 100;
    const curWpm = Math.round((val.length / 5) / durationInMinutes);

    setAccuracy(curAcc);
    setWpm(curWpm);

    // Check completion (Text finished)
    if (val.length === text.length) {
      finishTest();
    }
  };

  // Render text with highlighting
  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = "text-2xl md:text-3xl leading-relaxed transition-colors duration-100 font-medium ";
      const isCurrent = index === input.length;
      
      if (index < input.length) {
        if (input[index] === char) {
          className += "text-emerald-600 dark:text-emerald-400"; // Keep green for success
        } else {
          className += "text-red-500 bg-red-100/50 dark:bg-red-900/50 rounded"; // Red for error
        }
      } else if (isCurrent) {
        // Active character
        className += "bg-blue-100 border-b-4 border-blue-500 text-zinc-900 dark:bg-blue-900/40 dark:border-blue-400 dark:text-white"; 
      } else {
        // Future character
        className += "text-zinc-300 dark:text-zinc-600";
      }

      return (
        <span 
          key={index} 
          ref={isCurrent ? activeCharRef : null}
          className={className} 
          style={{ fontFamily: '"Pyidaungsu", "Padauk", sans-serif' }}
        >
          {char}
        </span>
      );
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Control Bar: Time Limit & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
        {/* Time Selector */}
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Clock size={16} className="text-zinc-500 dark:text-zinc-400 ml-2" />
          {[0, 15, 30, 60].map((opt) => (
            <button
              key={opt}
              onClick={() => handleTimeLimitChange(opt as TimeOption)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                timeLimit === opt 
                ? 'bg-white dark:bg-zinc-700 text-red-600 dark:text-red-400 shadow-sm border border-zinc-200 dark:border-zinc-600' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {opt === 0 ? 'Unlimited' : `${opt}s`}
            </button>
          ))}
        </div>

        {/* Live Stats */}
        <div className="flex items-center gap-6">
           <div className="text-center min-w-[80px]">
             <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase flex items-center justify-center gap-1">
               {timeLimit > 0 ? <Clock size={12}/> : <Hourglass size={12}/>}
               {timeLimit > 0 ? 'Time Left' : 'Time'}
             </p>
             <p className={`text-2xl font-mono font-bold ${
               timeLimit > 0 && timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-zinc-700 dark:text-zinc-200'
             }`}>
               {timeLimit > 0 ? `${timeLeft}s` : formatTime(elapsedSeconds)}
             </p>
           </div>
           
           <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700"></div>

           <div className="text-center">
             <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase">WPM</p>
             <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 w-16">{wpm}</p>
           </div>
           
           <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700"></div>

           <div className="text-center">
             <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase">Accuracy</p>
             <p className={`text-2xl font-bold w-16 ${accuracy < 90 ? 'text-amber-500' : 'text-emerald-500'}`}>
               {accuracy}%
             </p>
           </div>
        </div>
      </div>

      {/* Typing Surface */}
      <div className="flex flex-col shadow-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
        
        {/* Main Text Display */}
        <div 
          ref={scrollContainerRef}
          className="p-8 max-h-[40vh] overflow-y-auto bg-white dark:bg-zinc-900 text-justify leading-loose cursor-text select-none scroll-smooth transition-colors"
          onClick={() => inputRef.current?.focus()}
        >
           {renderText()}
        </div>

        {/* Visible Input Box */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleChange}
              disabled={isFinished}
              placeholder={startTime ? "Keep typing..." : "Type the text above to start..."}
              className="w-full px-4 py-3 text-lg font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm font-myanmar placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:text-zinc-400"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ fontFamily: '"Pyidaungsu", "Padauk", sans-serif' }}
            />
            {isFinished && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-medium text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                Done
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
             <AlertCircle size={12} />
             Type exactly as shown above.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={resetState}
          className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-600 dark:text-zinc-400 shadow-sm"
        >
          <RefreshCcw size={16} />
          Restart Test
        </button>
      </div>

      {isFinished && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl scale-100 border border-zinc-200 dark:border-zinc-700">
            <h2 className="text-2xl font-bold text-center mb-6 text-zinc-800 dark:text-zinc-100">
              {timeLimit > 0 && timeLeft === 0 ? "Time's Up! ⏰" : "Lesson Complete! 🎉"}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">WPM</p>
                <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{wpm}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Accuracy</p>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">{accuracy}%</p>
              </div>
            </div>

            <div className="text-center mb-6 text-zinc-500 dark:text-zinc-400 font-medium">
              Time: {formatTime(elapsedSeconds)}
            </div>

            <div className="flex flex-col gap-3">
              {onNext && (
                <button 
                  onClick={onNext}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-200 dark:shadow-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  Next Lesson <ArrowRight size={18} />
                </button>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={resetState}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-medium transition-colors"
                >
                  Retry
                </button>
                <button 
                  onClick={onComplete}
                  className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-medium transition-colors"
                >
                  Home
                </button>
              </div>
            </div>

            <div className="mt-6 text-xs text-zinc-400 dark:text-zinc-500 text-center space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              {onNext && <p><kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Enter</kbd> to next lesson</p>}
              {!onNext && <p><kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Enter</kbd> to home</p>}
              <p><kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Alt</kbd> + <kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Enter</kbd> to retry</p>
              <p><kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Ctrl</kbd> + <kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Alt</kbd> + <kbd className="font-sans bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">Enter</kbd> to home</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingArea;