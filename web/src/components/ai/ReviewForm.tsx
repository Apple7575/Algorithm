'use client';

import { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (problemId: number, code: string, language: string) => void;
  loading: boolean;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

export function ReviewForm({ onSubmit, loading }: ReviewFormProps) {
  const [problemId, setProblemId] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(problemId, 10);
    if (isNaN(id) || !code.trim()) return;
    onSubmit(id, code, language);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="problemId" className="block text-sm font-medium mb-2">
            Problem Number
          </label>
          <input
            id="problemId"
            type="number"
            value={problemId}
            onChange={e => setProblemId(e.target.value)}
            placeholder="e.g., 1000"
            required
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-2">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-2">
          Your Code
        </label>
        <textarea
          id="code"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste your code here..."
          rows={12}
          required
          className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !problemId || !code.trim()}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Reviewing...' : 'Get Review'}
      </button>
    </form>
  );
}
