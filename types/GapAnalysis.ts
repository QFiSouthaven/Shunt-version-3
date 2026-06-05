
/**
 * TypeScript Interface matching schema: https://aether-shunt.io/schemas/gap-analysis-manifest.json
 */

export type GapCategory = 
  | "Network_Infrastructure"
  | "Security_Evasion"
  | "Data_Processing"
  | "Concurrency_Control"
  | "Data_Persistence"
  | "Input_Automation";

export type ImpactedModule = 
  | "agent_builder"
  | "chat"
  | "chronicle"
  | "deploy"
  | "documentation"
  | "ecosystem"
  | "foundry"
  | "image_analysis"
  | "oraculum"
  | "persistent_developer"
  | "serendipity_engine"
  | "settings"
  | "shunt"
  | "subscription"
  | "system_2001"
  | "tool_for_ai"
  | "weaver";

export type GapPriority = "Critical" | "High" | "Medium";

export interface MissingComponent {
  component_name: string;
  category: GapCategory;
  primary_function: string;
  impacted_modules: ImpactedModule[];
  remediation_strategy: string;
  priority: GapPriority;
}

export interface GapAnalysisSummary {
  total_modules_analyzed: number;
  critical_infrastructure_missing: number;
  logic_dependencies_missing: number;
}

export interface GapAnalysisManifest {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  type: "object";
  gap_analysis_summary: GapAnalysisSummary;
  missing_components: MissingComponent[];
}
