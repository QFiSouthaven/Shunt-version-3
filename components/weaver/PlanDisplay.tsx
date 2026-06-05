
// components/weaver/PlanDisplay.tsx
import React, { useMemo, useState } from 'react';
import { GeminiResponse, ImplementationTask } from '../../types';
import { BookIcon, CodeIcon, EditIcon, KeywordsIcon, DocumentArrowDownIcon, ViewColumnsIcon } from '../icons';
import ContentActions from '../common/ContentActions';

interface PlanDisplayProps {
  plan: GeminiResponse | null;
  newlyGenerated?: boolean;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-6 break-inside-avoid">
        <div className="flex items-center gap-3 mb-3">
            <div className="bg-gray-700/50 p-2 rounded-md print:bg-gray-100">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-200 print:text-black">{title}</h3>
        </div>
        <div className="pl-10">{children}</div>
    </div>
);

const TimelineItem: React.FC<{ task: ImplementationTask; index: number }> = ({ task, index }) => (
    <div className="flex gap-4 relative group">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-cyan-900 border border-cyan-500 flex items-center justify-center text-cyan-300 font-bold text-xs z-10">
                {index + 1}
            </div>
            <div className="w-0.5 h-full bg-gray-700 absolute top-8 group-last:hidden"></div>
        </div>
        <div className="pb-8 flex-grow">
            <h4 className="text-sm font-bold text-gray-200">{task.filePath}</h4>
            <p className="text-xs text-gray-400 mt-1">{task.description}</p>
        </div>
    </div>
);

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, newlyGenerated }) => {
  const [viewMode, setViewMode] = useState<'standard' | 'timeline'>('standard');
  
  const formattedPlan = useMemo(() => {
      if (!plan) return '';
      return `# Development Plan\n\n## Clarifying Questions\n${plan.clarifyingQuestions?.map(q => `- ${q}`).join('\n') || 'None'}\n\n## Architectural Proposal\n${plan.architecturalProposal || 'None'}\n\n## Implementation Tasks\n${plan.implementationTasks?.map(t => `### ${t.filePath}\n${t.description}\n${t.details ? `> ${t.details}` : ''}`).join('\n\n') || 'None'}\n\n## Test Cases\n${plan.testCases?.map(tc => `- ${tc}`).join('\n') || 'None'}`;
  }, [plan]);

  const handlePrint = () => {
      window.print();
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800/50 rounded-lg border border-gray-700/50 p-6">
        <div className="text-center">
            <BookIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-400">Plan Output Panel</h3>
            <p className="text-sm text-gray-500 mt-1">The generated development plan will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg border p-6 h-full overflow-y-auto transition-colors duration-1000 print:bg-white print:text-black print:p-0 print:border-none ${newlyGenerated ? 'border-cyan-500' : 'border-gray-700/50'}`}>
        <div className="flex items-center justify-between mb-6 print:hidden">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-white">Development Plan</h2>
                <div className="flex bg-black/40 rounded p-1">
                    <button 
                        onClick={() => setViewMode('standard')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${viewMode === 'standard' ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}
                    >
                        LIST
                    </button>
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${viewMode === 'timeline' ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}
                    >
                        TIMELINE
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handlePrint}
                    className="p-1.5 rounded text-gray-400 hover:text-white transition-colors"
                    title="Export to PDF (Print)"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <ContentActions content={formattedPlan} filename={`weaver-plan-${Date.now()}.md`} />
            </div>
        </div>

        <div id="printable-plan" className="print:block">
            <Section title="Clarifying Questions" icon={<KeywordsIcon className="w-5 h-5 text-cyan-400" />}>
                {plan.clarifyingQuestions && plan.clarifyingQuestions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 text-gray-300 print:text-black">
                        {plan.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                ) : <p className="text-gray-400 text-sm italic">No clarifying questions.</p>}
            </Section>

            <Section title="Architectural Proposal" icon={<BookIcon className="w-5 h-5 text-cyan-400" />}>
                {plan.architecturalProposal ? <p className="text-gray-300 print:text-black whitespace-pre-wrap">{plan.architecturalProposal}</p> : <p className="text-gray-400 text-sm italic">No proposal.</p>}
            </Section>

            <Section title="Implementation Tasks" icon={<CodeIcon className="w-5 h-5 text-cyan-400" />}>
                {viewMode === 'timeline' ? (
                    <div className="mt-4">
                        {plan.implementationTasks?.map((task, i) => <TimelineItem key={i} task={task} index={i} />)}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {plan.implementationTasks?.map((task, i) => (
                            <div key={i} className="bg-gray-900/50 p-4 rounded-md border border-gray-700 print:bg-white print:border-gray-300 print:text-black">
                                <p className="font-semibold text-cyan-300 font-mono text-sm print:text-black">{task.filePath}</p>
                                <p className="text-gray-300 text-sm mt-1 print:text-black">{task.description}</p>
                                {task.details && <pre className="text-xs text-gray-400 mt-2 p-2 bg-black/30 rounded-md whitespace-pre-wrap font-mono print:bg-gray-100 print:text-black">{task.details}</pre>}
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <Section title="Test Cases" icon={<EditIcon className="w-5 h-5 text-cyan-400" />}>
                <ul className="list-disc list-inside space-y-2 text-gray-300 print:text-black">
                    {plan.testCases?.map((tc, i) => <li key={i}>{tc}</li>)}
                </ul>
            </Section>
        </div>
    </div>
  );
};

export default PlanDisplay;
