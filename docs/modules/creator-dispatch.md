# Creator Dispatch System

The Creator Dispatch System manages the assignment and coordination of video creators for user requests.

## Overview

This module handles:
- Task assignment for video creators
- Creator profile management
- Communication between creators and requesters
- Scheduling and deadline tracking

## Directory Structure

```
src/
├── dispatch_service/
│   ├── index.ts              # Main dispatch service
│   ├── task-manager.ts       # Task assignment logic
│   ├── scheduler.ts          # Deadline and scheduling
│   ├── notification.ts       # Creator notifications
│   └── types.ts              # TypeScript interfaces
│
├── creator_profiles/
│   ├── index.ts              # Profile management
│   ├── skills.ts             # Skill categorization
│   ├── availability.ts       # Availability tracking
│   └── rating.ts             # Rating system
```

## Core Components

### Task Manager

Handles the assignment of video creation tasks to appropriate creators.

```typescript
interface Task {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  requirements: TaskRequirements;
  budget: Budget;
  deadline: Date;
  status: TaskStatus;
  assignedCreatorId?: string;
}

interface TaskRequirements {
  skills: string[];
  duration: number; // seconds
  format: VideoFormat;
  accessibility: AccessibilityRequirements;
}

type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled';
```

### Creator Profile

Stores creator information and capabilities.

```typescript
interface CreatorProfile {
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
  signLanguages: string[]; // ASL, BSL, etc.
}

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  verified: boolean;
}
```

### Matching Algorithm

The dispatch system uses a scoring algorithm to match creators with requests:

```typescript
function calculateMatchScore(creator: CreatorProfile, task: Task): number {
  let score = 0;
  
  // Skill match (40%)
  const skillMatch = calculateSkillMatch(creator.skills, task.requirements.skills);
  score += skillMatch * 40;
  
  // Availability (25%)
  if (isAvailable(creator, task.deadline)) {
    score += 25;
  }
  
  // Rating (20%)
  score += (creator.rating / 5) * 20;
  
  // Experience (15%)
  score += Math.min(creator.completedTasks / 100, 1) * 15;
  
  return score;
}
```

## API Endpoints

### List Available Creators

```http
GET /api/dispatch/creators
```

Query parameters:
- `skills`: Required skills (comma-separated)
- `availability`: `available` | `busy` | `all`
- `rating`: Minimum rating (1-5)
- `limit`: Results per page
- `offset`: Pagination offset

### Create Task

```http
POST /api/dispatch/tasks
```

Request body:
```json
{
  "title": "ASL Tutorial Video",
  "description": "Create a 5-minute ASL tutorial for common greetings",
  "requirements": {
    "skills": ["asl", "video_editing"],
    "duration": 300,
    "format": "mp4",
    "accessibility": {
      "captions": true,
      "signLanguage": "asl"
    }
  },
  "budget": {
    "amount": 200,
    "currency": "USD"
  },
  "deadline": "2024-12-31T00:00:00Z"
}
```

### Assign Creator

```http
POST /api/dispatch/tasks/:taskId/assign
```

Request body:
```json
{
  "creatorId": "creator-uuid"
}
```

### Get Task Status

```http
GET /api/dispatch/tasks/:taskId
```

## Communication

### Real-time Messaging

The dispatch system integrates with Pusher for real-time communication:

```typescript
// Send message to creator
await pusher.trigger(`task-${taskId}`, 'message', {
  from: requesterId,
  content: 'Can you add more ASL examples?',
  timestamp: new Date().toISOString()
});

// Listen for updates
pusher.subscribe(`task-${taskId}`).bind('status-update', (data) => {
  console.log('Task status updated:', data.status);
});
```

## Notifications

Creators receive notifications for:
- New task matches
- Task assignments
- Messages from requesters
- Deadline reminders
- Payment confirmations

All notifications are visual-first for accessibility.

## Database Schema

```sql
-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    requester_id UUID NOT NULL REFERENCES users(id),
    creator_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    requirements JSONB NOT NULL,
    budget JSONB NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator profiles table
CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    bio TEXT,
    skills JSONB DEFAULT '[]',
    portfolio JSONB DEFAULT '[]',
    availability JSONB DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Integration

The Creator Dispatch System integrates with:
- **Video Matching** - Find existing content before creating new
- **Vision Models** - Auto-analyze completed videos
- **Multi-channel Processing** - Process and deliver final videos
