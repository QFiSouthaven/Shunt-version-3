
// components/weaver/Weaver.tsx
import React, { Suspense, use, useState, useEffect } from 'react';
import MemoryPanel from './MemoryPanel';
import PlanDisplay from './PlanDisplay';
import { SparklesIcon, XMarkIcon } from '../icons';
import Loader from '../Loader';
import { useWeaver } from '../../hooks/useWeaver';
import { weaverService } from '../../services/weaver.service';
import { Documentation } from '../../types';

// Sub-component that consumes the promise via use()
const MemoryPanelWrapper: React.FC<{ 
    resource: Promise<Documentation>, 
    onDocumentationChange: (field: keyof Documentation, value: string) => void 
}> = ({ resource, onDocumentationChange }) => {
    // This will suspend until the promise resolves
    const documentation = use(resource);
    
    return <MemoryPanel documentation={documentation} onDocumentationChange={onDocumentationChange} />;
};

const Weaver: React.FC = () => {
  const {
      goal, setGoal,
      plan,
      // We override the hook's documentation with the resource-based one for initial load, 
      // but we still need the handler to update the service.
      handleDocumentationChange,
      isLoading,
      error, setError,
      newlyGenerated,
      generatePlan,
      usage, tierDetails
  } = useWeaver();

  const plansUsed = usage.weaverPlans;
  const planLimit = tierDetails.weaverPlans;
  const isLimitReached = planLimit !== 'unlimited' && plansUsed >= planLimit;
  
  // Get the resource directly from service
  const [memoryResource] = useState(() => weaverService.getMemoryResource());

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-6">
      <div className="flex-shrink-0 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your high-level development goal here..."
            className="w-full flex-grow bg-gray-900/50 rounded-md border border-gray-700 p-3 text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            rows={2}
            disabled={isLoading || isLimitReached}
          />
          <button
            onClick={generatePlan}
            disabled={isLoading || !goal.trim() || isLimitReached}
            className="w-full md:w-auto flex-shrink-0 px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader /> : <SparklesIcon className="w-5 h-5" />}
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
        <div className="mt-2 text-right text-xs text-gray-400">
          Plans Used: {plansUsed} / {planLimit === 'unlimited' ? 'Unlimited' : planLimit}
        </div>
        {error && (
            <div className="mt-3 p-3 bg-red-900/50 border border-red-700/50 rounded-md text-sm text-red-300 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-red-200 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        <div className="h-full overflow-hidden relative">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader /></div>}>
                <MemoryPanelWrapper 
                    resource={memoryResource} 
                    onDocumentationChange={handleDocumentationChange} 
                />
            </Suspense>
        </div>
        <div className="h-full overflow-hidden">
            <PlanDisplay plan={plan} newlyGenerated={newlyGenerated} />
        </div>
      </div>
    </div>
  );
};

export default Weaver;