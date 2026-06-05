
import React, { useOptimistic, useActionState, useRef } from 'react';
import { AgentProfile, EvolutionMilestone } from '../types';
import { saveMilestoneAction } from '../actions';
import { Plus, Loader2 } from 'lucide-react';

interface EvolutionPanelProps {
  profile: AgentProfile;
  onMilestoneAdded: (milestone: EvolutionMilestone) => void;
}

/**
 * EvolutionPanel
 * Allows the user/AI to plan future milestones.
 * Uses React 19's useActionState for form handling and useOptimistic for immediate feedback.
 */
export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({ profile, onMilestoneAdded }) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Optimistic UI: Show the new milestone immediately while the server processes it
  const [optimisticRoadmap, addOptimisticMilestone] = useOptimistic(
    profile.roadmap,
    (state, newMilestone: EvolutionMilestone) => [...state, newMilestone]
  );

  // Form Action Handler
  const [formState, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const title = formData.get('title') as string;
      
      // 1. Update Optimistic UI immediately
      addOptimisticMilestone({
        id: 'temp-id',
        title: title,
        description: 'Pending creation...',
        priority: 'medium',
        status: 'pending'
      });

      // 2. Perform actual data mutation
      const result = await saveMilestoneAction(profile, formData);

      if (result.success && result.data) {
        onMilestoneAdded(result.data);
        formRef.current?.reset();
        return { message: 'Milestone added successfully' };
      } else {
        return { error: result.error };
      }
    },
    null // Initial form state
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 p-4">
      <h3 className="text-xl font-bold text-white mb-4">Evolution Roadmap</h3>
      
      {/* Visual Roadmap Timeline */}
      <ul className="flex-1 overflow-y-auto space-y-3 mb-6">
        {optimisticRoadmap.map((milestone) => (
          <li 
            key={milestone.id} 
            className={`p-3 rounded-md border ${
              milestone.id === 'temp-id' ? 'border-blue-500/50 bg-blue-900/10 opacity-70' : 'border-slate-700 bg-slate-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-slate-200">{milestone.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                milestone.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'
              }`}>
                {milestone.status}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{milestone.description}</p>
          </li>
        ))}
        {optimisticRoadmap.length === 0 && (
          <p className="text-slate-500 italic">No evolution milestones planned.</p>
        )}
      </ul>

      {/* Input Form */}
      <form ref={formRef} action={formAction} className="space-y-3 bg-slate-800 p-4 rounded-lg">
        <div>
          <label htmlFor="title" className="block text-xs font-medium text-slate-400 mb-1">New Milestone Goal</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Implement Long-term Memory"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-xs font-medium text-slate-400 mb-1">Strategy (Optional)</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Technical details..."
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {formState?.error && (
          <p className="text-red-400 text-sm">{formState.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
          Add Milestone
        </button>
      </form>
    </div>
  );
};
