
export interface KnowledgeSource {
  id: string;
  category: 'AI' | 'Programming' | 'Database' | 'Security';
  url: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  lastScraped?: number;
}

export interface ExtractionAgent {
  id: string;
  role: 'Navigator' | 'Extractor' | 'Synthesizer' | 'Archivist';
  name: string;
  status: 'idle' | 'fetching' | 'parsing' | 'cooldown';
  currentTask: string;
  itemsProcessed: number;
}

export interface ScrapedPayload {
  sourceId: string;
  timestamp: number;
  title: string;
  summary: string;
  rawJson: Record<string, any>;
  confidence: number;
  entities?: string[];
}
