
import React, { useState, useEffect } from 'react';
import { TestSuite } from '../types';
import { ErrorIcon, CheckCircleIcon, ShieldCheckIcon, PlayIcon, LockIcon } from '../../icons';

export const SpeedsterView: React.FC = () => {
  const [code, setCode] = useState('function processPayment(amount) {\n  // Implementation pending\n}');
  const [tests, setTests] = useState<TestSuite[]>([]);
  const [isDeployable, setIsDeployable] = useState(false);

  // Simulate "Speedster" reacting to keystrokes
  useEffect(() => {
    const timer = setTimeout(() => {
      runHypochondriacAnalysis();
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [code]);

  const runHypochondriacAnalysis = () => {
    // Simulated Logic: If code is too simple, fail tests (Paranoia)
    const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('if (error)');
    
    const newTests: TestSuite[] = [
      { id: '1', name: 'Unit: Happy Path', status: 'passed', message: 'Input valid.', timestamp: Date.now() },
      { 
        id: '2', 
        name: 'Edge Case: Network Timeout', 
        status: hasErrorHandling ? 'passed' : 'failed', 
        message: hasErrorHandling ? 'Handled correctly.' : 'CRITICAL: No timeout handling detected. API might hang.', 
        timestamp: Date.now() 
      },
      { 
        id: '3', 
        name: 'Security: SQL Injection', 
        status: 'passed', 
        message: 'Input sanitized.', 
        timestamp: Date.now() 
      },
    ];

    setTests(newTests);
    setIsDeployable(newTests.every(t => t.status === 'passed'));
  };

  return (
    <div className="flex h-full text-slate-100">
      {/* Left: User Logic (Simulated Editor) */}
      <div className="w-1/2 flex flex-col border-r border-slate-700">
        <div className="bg-slate-800 p-2 text-xs font-mono text-slate-400 border-b border-slate-700">src/payment.ts</div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-slate-900 p-4 font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>

      {/* Right: The Hypochondriac Monitor */}
      <div className="w-1/2 flex flex-col bg-slate-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-orange-400">
            <ShieldCheckIcon className="w-5 h-5" /> Active Guardian
          </h2>
          <span className="text-xs bg-orange-900 text-orange-200 px-2 py-1 rounded">Hypochondriac Mode</span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {tests.map(test => (
            <div 
              key={test.id} 
              className={`p-3 rounded border-l-4 ${test.status === 'passed' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm font-bold">{test.name}</span>
                {test.status === 'passed' ? <CheckCircleIcon className="w-4 h-4 text-green-500"/> : <ErrorIcon className="w-4 h-4 text-red-500"/>}
              </div>
              <p className="text-xs text-slate-400 font-mono">{test.message}</p>
            </div>
          ))}
        </div>

        {/* Safety Gate */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <button
            disabled={!isDeployable}
            className={`w-full py-3 rounded font-bold flex items-center justify-center gap-2 ${
              isDeployable 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isDeployable ? <><PlayIcon className="w-5 h-5" /> Deploy to Staging</> : <><LockIcon className="w-5 h-5" /> Safety Gate Locked</>}
          </button>
          {!isDeployable && (
            <p className="text-xs text-center text-red-400 mt-2">Cannot proceed: 1 or more critical tests failed.</p>
          )}
        </div>
      </div>
    </div>
  );
};
