
export type DeveloperPersona = 'ARCHITECT' | 'SPEEDSTER' | 'UPDATER';

export interface ProjectState {
  name: string;
  status: 'planning' | 'development' | 'maintenance';
  techStack: string[];
  roadmap: RoadmapPhase[];
  dependencies: Dependency[];
}

export interface RoadmapPhase {
  id: string;
  phaseName: string;
  items: string[];
  status: 'pending' | 'in-progress' | 'complete';
}

export interface TestSuite {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed';
  message: string;
  timestamp: number;
}

export interface Dependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  status: 'stable' | 'outdated' | 'critical';
  cve?: string;
}

// Mock initial state for demonstration
export const INITIAL_PROJECT_STATE: ProjectState = {
  name: "Foundry Project Alpha",
  status: 'planning',
  techStack: ['React', 'TypeScript', 'Node.js'],
  roadmap: [],
  dependencies: [
    { name: 'react', currentVersion: '18.2.0', latestVersion: '18.3.0', status: 'stable' },
    { name: 'lodash', currentVersion: '4.17.15', latestVersion: '4.17.21', status: 'critical', cve: 'CVE-2023-XXXX' }
  ]
};
