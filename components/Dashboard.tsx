import React, { useState, useEffect, useMemo } from 'react';
import { Play, Plus, Trash2, BarChart2, BookOpen, Wand2, Loader2, Search } from 'lucide-react';
import { Lesson, TypingResult } from '../types';
import { DEFAULT_LESSONS } from '../constants';
import { getResults, getCustomLessons, saveCustomLesson, clearResults } from '../services/storageService';
import StatsChart from './StatsChart';
import { generateBurmeseLesson } from '../services/geminiService';

interface DashboardProps {
  onSelectLesson: (lesson: Lesson) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectLesson }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'analytics' | 'create'>('lessons');
  const [results, setResults] = useState<TypingResult[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Lesson Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setResults(getResults());
    setCustomLessons(getCustomLessons());
  }, [activeTab]); // Refresh when tab changes

  const filteredLessons = useMemo(() => {
    return DEFAULT_LESSONS.filter(l => 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.content.includes(searchTerm)
    );
  }, [searchTerm]);

  const handleSaveCustom = () => {
    if (!customTitle.trim() || !customContent.trim()) return;

    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title: customTitle,
      content: customContent,
      source: 'custom',
      difficulty: customDifficulty
    };

    saveCustomLesson(newLesson);
    setCustomLessons([...customLessons, newLesson]);
    setCustomTitle('');
    setCustomContent('');
    setAiTopic('');
    setActiveTab('lessons');
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    try {
      const content = await generateBurmeseLesson(aiTopic, customDifficulty);
      setCustomContent(content);
      if (!customTitle) setCustomTitle(`AI (${customDifficulty}): ${aiTopic}`);
    } catch (error) {
      alert('Failed to generate content. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearResults();
      setResults([]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 inline-flex transition-colors">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'lessons' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <BookOpen size={18} />
            Lessons
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'create' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Plus size={18} />
            Create / AI
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'analytics' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <BarChart2 size={18} />
            Analytics
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 min-h-[400px] transition-colors">
        
        {/* LESSONS TAB */}
        {activeTab === 'lessons' && (
          <div className="space-y-8">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="text" 
                placeholder="Search lessons..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
              />
            </div>

            {/* Custom Lessons Section */}
            {customLessons.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  My Custom Lessons
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => onSelectLesson(lesson)}
                      className="text-left p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-none transition-all bg-white dark:bg-zinc-800"
                    >
                      <div className="flex justify-between items-center mb-2">
                         <span className="font-semibold text-zinc-700 dark:text-zinc-200 font-myanmar truncate">{lesson.title}</span>
                         <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider shrink-0 ${
                            lesson.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            lesson.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                         }`}>
                           {lesson.difficulty || 'CUSTOM'}
                         </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 font-myanmar">{lesson.content}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Lessons Grid */}
            <div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-red-600 rounded-full"></span>
                Standard Lessons ({filteredLessons.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Increased slice limit to 200 to ensure Hard stories (indices 100-149) are shown */}
                {filteredLessons.slice(0, 200).map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className="group text-left p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 hover:shadow-md hover:shadow-red-50 dark:hover:shadow-none transition-all bg-zinc-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 font-myanmar truncate pr-2">{lesson.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider shrink-0 ${
                        lesson.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        lesson.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {lesson.difficulty}
                      </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 font-myanmar opacity-70 group-hover:opacity-100 transition-opacity">
                      {lesson.content}
                    </p>
                  </button>
                ))}
                {filteredLessons.length > 200 && (
                  <div className="col-span-full text-center py-4 text-zinc-400 text-sm italic">
                    Use search to find more lessons...
                  </div>
                )}
                {filteredLessons.length === 0 && (
                   <div className="col-span-full text-center py-10 text-zinc-400">
                     No lessons found matching "{searchTerm}"
                   </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <h3 className="text-indigo-900 dark:text-indigo-300 font-semibold mb-4 flex items-center gap-2">
                <Wand2 size={20} className="text-indigo-600 dark:text-indigo-400"/>
                Generate with AI
              </h3>
              
              <div className="flex justify-center mb-4">
                <div className="bg-white dark:bg-zinc-800 p-1 rounded-lg flex gap-1 border border-zinc-200 dark:border-zinc-700">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => setCustomDifficulty(level)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                                customDifficulty === level
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g., Burmese history, Traditional food, Yangon city"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="flex-1 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                />
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !aiTopic}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : 'Generate'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
                 <span className="text-zinc-400 dark:text-zinc-500 text-sm uppercase font-bold tracking-widest">Or Create Manually</span>
                 <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="My Practice Lesson"
                />
              </div>

              {/* Difficulty Manual Override */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Difficulty</label>
                <div className="flex gap-2">
                     {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <button
                            key={`manual-${level}`}
                            onClick={() => setCustomDifficulty(level)}
                             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                                customDifficulty === level
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Content (Burmese)</label>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={6}
                  className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-myanmar leading-loose"
                  placeholder="Paste or type Burmese text here..."
                  style={{ fontFamily: '"Pyidaungsu", "Padauk", sans-serif' }}
                />
              </div>

              <button
                onClick={handleSaveCustom}
                disabled={!customTitle || !customContent}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200 dark:shadow-red-900/20"
              >
                Save & Add to Library
              </button>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Your Performance</h3>
              <button 
                onClick={handleClearHistory}
                className="text-red-500 text-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Total Tests</p>
                <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{results.length}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Avg Accuracy</p>
                <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-400">
                  {results.length > 0 
                    ? Math.round(results.reduce((acc, curr) => acc + curr.accuracy, 0) / results.length)
                    : 0}%
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Best WPM</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-400">
                  {results.length > 0 ? Math.max(...results.map(r => r.wpm)) : 0}
                </p>
              </div>
            </div>

            <StatsChart results={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;