
import { useReducer, useCallback } from 'react';
import { AgentConfig, AgentTool, INITIAL_AGENT_CONFIG } from '../types';

type Action =
  | { type: 'SET_FIELD'; field: keyof AgentConfig; value: any }
  | { type: 'TOGGLE_TOOL'; toolId: string }
  | { type: 'RESET_CONFIG' }
  | { type: 'LOAD_CONFIG'; config: AgentConfig };

function agentReducer(state: AgentConfig, action: Action): AgentConfig {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_TOOL':
      return {
        ...state,
        tools: state.tools.map((tool) =>
          tool.id === action.toolId ? { ...tool, enabled: !tool.enabled } : tool
        ),
      };
    case 'RESET_CONFIG':
      return { ...INITIAL_AGENT_CONFIG, id: crypto.randomUUID() };
    case 'LOAD_CONFIG':
      return action.config;
    default:
      return state;
  }
}

export function useAgentBuilder() {
  const [config, dispatch] = useReducer(agentReducer, INITIAL_AGENT_CONFIG);

  const updateField = useCallback(<K extends keyof AgentConfig>(field: K, value: AgentConfig[K]) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const toggleTool = useCallback((toolId: string) => {
    dispatch({ type: 'TOGGLE_TOOL', toolId });
  }, []);

  const resetConfig = useCallback(() => {
    dispatch({ type: 'RESET_CONFIG' });
  }, []);

  const exportConfig = useCallback(() => {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  return {
    config,
    updateField,
    toggleTool,
    resetConfig,
    exportConfig,
  };
}
