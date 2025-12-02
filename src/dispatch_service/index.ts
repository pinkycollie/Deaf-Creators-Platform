/**
 * Creator Dispatch Service
 * 
 * Manages the dispatching of creators to generate videos based on user requirements.
 * 
 * Features:
 * - Task assignment system for video creators
 * - Communication tools for creators and requesters
 * - Scheduling and deadline tracking
 * - Creator profile management
 */

export interface Task {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  requirements: TaskRequirements;
  budget: Budget;
  deadline: Date;
  status: TaskStatus;
  assignedCreatorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRequirements {
  skills: string[];
  duration: number;
  format: VideoFormat;
  accessibility: AccessibilityRequirements;
}

export interface AccessibilityRequirements {
  captions: boolean;
  signLanguage?: 'asl' | 'bsl' | 'other';
  audioDescription?: boolean;
}

export interface Budget {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
}

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled';

export type VideoFormat = 'mp4' | 'webm' | 'mov';

/**
 * Calculate match score between a creator and a task
 */
export function calculateMatchScore(
  creatorSkills: string[],
  taskRequirements: TaskRequirements
): number {
  const matchedSkills = creatorSkills.filter(skill =>
    taskRequirements.skills.includes(skill)
  );
  return matchedSkills.length / taskRequirements.skills.length;
}

/**
 * Priority queue for task assignment
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // Sort by deadline (earliest first)
    const deadlineCompare = a.deadline.getTime() - b.deadline.getTime();
    if (deadlineCompare !== 0) return deadlineCompare;

    // Then by budget (highest first)
    return b.budget.amount - a.budget.amount;
  });
}
