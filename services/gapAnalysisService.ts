
import gapManifest from '../data/architectural_gaps.json';
import { GapAnalysisManifest, MissingComponent, ImpactedModule } from '../types/GapAnalysis';

class GapAnalysisService {
  private manifest: GapAnalysisManifest;

  constructor() {
    this.manifest = gapManifest as unknown as GapAnalysisManifest;
  }

  public getManifest(): GapAnalysisManifest {
    return this.manifest;
  }

  public getGapsForModule(moduleName: ImpactedModule): MissingComponent[] {
    return (this.manifest.missing_components as any[]).filter((gap) =>
      gap.impacted_modules.includes(moduleName) && gap.status !== 'Resolved'
    );
  }

  public getModulesBlockedBy(componentName: string): ImpactedModule[] {
    const gap = (this.manifest.missing_components as any[]).find(
      (c) => c.component_name === componentName
    );
    return gap ? gap.impacted_modules : [];
  }

  /**
   * Calculates the "Readiness Score" of a module (0-100).
   * 100 = No gaps. 0 = Critical gaps present.
   */
  public getModuleReadiness(moduleName: ImpactedModule): number {
    const gaps = this.getGapsForModule(moduleName);
    if (gaps.length === 0) return 100;

    let score = 100;
    gaps.forEach((gap) => {
      if (gap.priority === 'Critical') score -= 30;
      if (gap.priority === 'High') score -= 15;
      if (gap.priority === 'Medium') score -= 5;
    });

    return Math.max(0, score);
  }
}

export const gapAnalysisService = new GapAnalysisService();
