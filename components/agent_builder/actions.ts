
import { AgentProfile, EvolutionMilestone } from './types';

/**
 * Simulated Server Actions / Async Logic.
 * In a real Next.js/React 19 app, these might be server actions.
 * Here they act as the logic layer separating UI from mutation details.
 */

const MOCK_DELAY = 800;

export async function saveMilestoneAction(
  currentProfile: AgentProfile,
  formData: FormData
): Promise<{ success: boolean; data?: EvolutionMilestone; error?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as any;

  if (!title || title.length < 3) {
    return { success: false, error: 'Milestone title must be at least 3 characters.' };
  }

  const newMilestone: EvolutionMilestone = {
    id: crypto.randomUUID(),
    title,
    description: description || '',
    priority: priority || 'medium',
    status: 'pending',
  };

  return { success: true, data: newMilestone };
}

export async function toggleCapabilityAction(
  profileId: string,
  capabilityId: string,
  currentState: boolean
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In a real app, this would patch the database
  return !currentState;
}
