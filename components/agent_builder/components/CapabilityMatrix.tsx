
import React, { useTransition } from 'react';
import { AgentProfile, CapabilityId } from '../types';
import { toggleCapabilityAction } from '../actions';
import { Cpu, Globe, Database, Eye } from 'lucide-react';

interface CapabilityMatrixProps {
  profile: AgentProfile;
  onUpdate: (updatedProfile: AgentProfile) => void;
}

const ICONS: Record<CapabilityId, React.ReactNode> = {
  code_generation: <Cpu className="w-5 h-5" />,
  web_browsing: <Globe className="w-5 h-5" />,
  memory_persistence: <Database className="w-5 h-5" />,
  image_analysis: <Eye className="w-5 h-5" />,
};

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ profile, onUpdate }) => {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (capId: CapabilityId, currentState: boolean) => {
    // Optimistic / Transition update
    startTransition(async () => {
      // 1. Call async action
      const newState = await toggleCapabilityAction(profile.id, capId, currentState);
      
      // 2. Update local state via callback (in real app, revalidation would handle this)
      const updatedCapabilities = profile.capabilities.map(c => 
        c.id === capId ? { ...c, isEnabled: newState } : c
      );
      
      onUpdate({ ...profile, capabilities: updatedCapabilities });
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {profile.capabilities.map((cap) => (
        <div 
          key={cap.id}
          className={`
            relative group flex flex-col p-4 rounded-lg border transition-all cursor-pointer
            ${cap.isEnabled 
              ? 'bg-slate-800 border-blue-500/50 shadow-lg shadow-blue-900/20' 
              : 'bg-slate-900 border-slate-700 opacity-60 hover:opacity-100'}
          `}
          onClick={() => !isPending && handleToggle(cap.id, cap.isEnabled)}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-md ${cap.isEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {ICONS[cap.id] || <Cpu />}
            </div>
            <h4 className="font-semibold text-slate-200">{cap.label}</h4>
          </div>
          <p className="text-sm text-slate-400">{cap.description}</p>
          
          <div className="absolute top-4 right-4">
            <div className={`w-3 h-3 rounded-full ${cap.isEnabled ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-slate-600'}`} />
          </div>
        </div>
      ))}
    </div>
  );
};
