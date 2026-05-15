/**
 * Creator Profiles Module
 * 
 * Manages creator information, skills, and availability.
 */

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  skills: Skill[];
  portfolio: PortfolioItem[];
  availability: Availability;
  rating: number;
  completedTasks: number;
  languages: string[];
  signLanguages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
  createdAt: Date;
}

export interface Availability {
  status: 'available' | 'busy' | 'unavailable';
  hoursPerWeek: number;
  timezone: string;
  preferredSchedule: ScheduleBlock[];
}

export interface ScheduleBlock {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
}

/**
 * Check if a creator is available for a task
 */
export function isCreatorAvailable(
  creator: CreatorProfile,
  taskDeadline: Date,
  estimatedHours: number
): boolean {
  if (creator.availability.status !== 'available') {
    return false;
  }

  const hoursAvailable = creator.availability.hoursPerWeek;
  return hoursAvailable >= estimatedHours;
}

/**
 * Calculate creator rating score
 */
export function calculateRatingScore(
  rating: number,
  completedTasks: number
): number {
  // Weight rating more heavily for creators with more completed tasks
  const taskWeight = Math.min(completedTasks / 100, 1);
  return rating * (0.5 + 0.5 * taskWeight);
}
