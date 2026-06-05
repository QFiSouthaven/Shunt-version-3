
import React, { createContext, useReducer, useContext, ReactNode, PropsWithChildren } from 'react';
import { MissionControlTabKey, ShuntAction, TokenUsage } from '../types';

// Discriminated Unions for absolute type safety in the OS Kernel
export type SystemAction = 
  | { type: 'SET_ACTIVE_TAB'; payload: MissionControlTabKey }
  | { type: 'UPDATE_SHUNT_INPUT'; payload: string }
  | { type: 'UPDATE_SHUNT_OUTPUT'; payload: string; tokenUsage?: TokenUsage }
  | { type: 'PIPELINE_BROADCAST'; payload: { source: string; data: any; target?: string } }
  | { type: 'ADD_TELEMETRY_LOG'; payload: any }
  | { type: 'SET_LOADING'; payload: { module: string; isLoading: boolean } };

interface SystemState {
  activeTab: MissionControlTabKey;
  loadingStates: Record<string, boolean>;
  shunt: {
    input: string;
    output: string;
    lastTokenUsage?: TokenUsage;
  };
  neuralBus: {
    lastBroadcast: any;
    history: any[];
  };
}

const initialState: SystemState = {
  activeTab: 'dashboard',
  loadingStates: {},
  shunt: {
    input: '',
    output: '',
  },
  neuralBus: {
    lastBroadcast: null,
    history: [],
  },
};

function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'UPDATE_SHUNT_INPUT':
      return { ...state, shunt: { ...state.shunt, input: action.payload } };
    case 'UPDATE_SHUNT_OUTPUT':
      return { ...state, shunt: { ...state.shunt, output: action.payload, lastTokenUsage: action.tokenUsage } };
    case 'SET_LOADING':
      return { ...state, loadingStates: { ...state.loadingStates, [action.payload.module]: action.payload.isLoading } };
    case 'PIPELINE_BROADCAST':
      const newBroadcast = { ...action.payload, timestamp: Date.now() };
      // Neural Bus Logic: If broadcast targets "shunt", update shunt input automatically
      let updatedShunt = state.shunt;
      if (action.payload.target === 'shunt' || !action.payload.target) {
          updatedShunt = { ...state.shunt, input: String(action.payload.data) };
      }
      return { 
        ...state, 
        shunt: updatedShunt,
        neuralBus: { 
          lastBroadcast: newBroadcast, 
          history: [newBroadcast, ...state.neuralBus.history].slice(0, 50) 
        } 
      };
    default:
      return state;
  }
}

const SystemContext = createContext<{
  state: SystemState;
  dispatch: React.Dispatch<SystemAction>;
} | null>(null);

export const SystemProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(systemReducer, initialState);
  return (
    <SystemContext.Provider value={{ state, dispatch }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = React.useContext(SystemContext);
  if (!context) throw new Error("useSystem must be used within SystemProvider");
  return context;
};
