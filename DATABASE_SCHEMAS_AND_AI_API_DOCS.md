# PACER AI: Database Schemas & AI/ML API Technical Specifications

This document outlines all **MongoDB Database Schemas** and **AI/ML API Contracts** for the PACER Agentic AI Curation Platform. Share this with your AI/ML team for model training, feature extraction, vector store integration, and multimodal endpoint consumption.

---

## Part 1: MongoDB Database Schemas (Mongoose)

### 1. `User` Schema
Stores user authentication details and identity curation onboarding profiles.

```typescript
export interface IUserOnboarding {
  currentSelf: string[];               // e.g., ["Unfocused", "Tired", "Burnt Out"]
  imagineSelf: string[];               // e.g., ["Disciplined", "Confident", "Architect"]
  learningStyles: string[];            // e.g., ["Visual", "Aural", "Hands-on"]
  aspirationFocus: string[];           // e.g., ["Career & Wealth", "Mindset & Peace"]
  mediaPreferences: string[];          // e.g., ["Podcasts", "Expert Guides", "Books"]
  dailyCommitmentMinutes: number;      // e.g., 30, 45, 60
  isOnboarded: boolean;                // true / false
  completedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: string;                        // default: "Personal Growth Aspirant"
  avatarUrl?: string;
  authProvider: "jwt" | "google";
  onboarding: IUserOnboarding;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2. `RoadmapStage` Schema
Tracks dynamic, AI-adapted learning roadmap stages and skill items.

```typescript
export interface IRoadmapItem {
  id: string;
  title: string;
  type: string;                        // "Podcast" | "Video" | "Guide" | "Action" | "Book"
  duration: string;                    // e.g., "25m", "45m"
  completed: boolean;
}

export interface IRoadmapStage extends Document {
  userId: string;
  stageNumber: number;                 // e.g., 1, 2, 3
  title: string;                       // e.g., "Stage 1: Neural Focus Foundation"
  description: string;
  status: "in-progress" | "ai-adapted" | "upcoming" | "completed";
  scheduleStatus: "on-track" | "ahead" | "behind";
  estimatedDays: number;
  remainingDays: number;
  progressPercent: number;             // 0 - 100
  careerImpact: string;
  skillsGained: string[];
  prerequisites: string[];
  items: IRoadmapItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3. `CognitiveMetrics` Schema
Stores daily focus logs, attention intentionality ratios, and skill mastery matrix.

```typescript
export interface IDailyFocusLog {
  day: string;                         // e.g., "Mon", "Tue", "Wed"
  mindfulHours: number;               // Deep work focus hours
  skimmingHours: number;              // Passive consumption hours
  intentionality: number;             // 0 - 100 percentage
}

export interface ISkillMatrixItem {
  skill: string;                       // e.g., "System Architecture"
  score: number;                       // Current level (0 - 100)
  target: number;                      // Target level (0 - 100)
  category: string;                    // e.g., "Career & Wealth"
}

export interface ICognitiveMetrics extends Document {
  userId: string;
  growthVelocity: number;             // 0 - 100
  attentionToIntentRatio: number;     // 0 - 100
  retentionRate: number;              // 0 - 100
  fatigueIndex: number;               // 0 - 100
  dailyFocusLogs: IDailyFocusLog[];
  skillMatrix: ISkillMatrixItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4. `MemoryVector` Schema
Persistent facts extracted by AI Curator to align daily feed recommendations with target identity.

```typescript
export interface IMemoryVector extends Document {
  userId: string;
  category: "Identity & Aspirations" | "Cognitive Style" | "Learning Habits" | "Curator Filters";
  statement: string;                   // E.g., "Prefers 90m focus blocks with zero notifications"
  confidence: number;                  // 0 - 100
  lastUpdated: string;                 // ISO Date String
  impactOnCurator: string;             // Filter instruction for recommendation model
  active: boolean;                     // true / false
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 5. `VisualizerConcept` Schema
Visual execution guides and active retrieval quiz questions.

```typescript
export interface IQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IExecutionTrace {
  step: number;
  title: string;
  memoryState: string;
  detail: string;
}

export interface IVisualizerConcept extends Document {
  userId?: string;
  title: string;
  concept: string;
  description: string;
  keyTakeaways: string[];
  interactiveCodeSnippet: string;
  executionTrace: IExecutionTrace[];
  quizQuestions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 6. `FutureMilestone` Schema
Maps aspirational trajectory milestones and career readiness metrics.

```typescript
export interface IFutureMilestone extends Document {
  userId?: string;
  period: "Now" | "3 Months" | "6 Months" | "1 Year";
  skills: string[];
  projects: string[];
  careerReadiness: number;             // 0 - 100
  goalCompletion: number;              // 0 - 100
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 7. `Opportunity` Schema
Hand-selected mentorships, workshops, open-source projects, and masterclasses.

```typescript
export interface IOpportunity extends Document {
  userId?: string;
  type: "Hackathon" | "Internship" | "Open Source" | "Research Paper" | "Meetup" | "Competition" | "Conference" | "Workshop" | "Mentorship";
  title: string;
  organizer: string;
  deadline?: string;
  description: string;
  relevanceScore: number;             // 0 - 100 AI match score
  link?: string;
  bookmarked: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 8. `Achievement` Schema
Gamified badges and XP rewards for consistency and identity breakthroughs.

```typescript
export interface IAchievement extends Document {
  userId?: string;
  title: string;
  description: string;
  icon: string;                        // e.g., "Flame", "Trophy", "Sparkles"
  unlocked: boolean;
  unlockedAt?: string;
  progressCurrent?: number;
  progressTarget?: number;
  category: "Streak" | "Milestone" | "Project" | "Learning" | "Community";
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 9. `Reflection` Schema
Decompression and active reflection logs submitted after learning sessions.

```typescript
export interface IReflection extends Document {
  userId: string;
  lessonTitle: string;
  learnedToday: string;
  confusion: string;
  confidenceRating: number;            // 1 - 5 rating
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 10. `ChatMessage` Schema
Multimodal AI Curator conversation history and image analysis payloads.

```typescript
export interface IChatMessage extends Document {
  userId: string;
  sender: "user" | "ai";
  text: string;
  image?: string;                      // Base64 data URL or image path
  suggestedActions?: string[];         // Navigation shortcuts
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Part 2: AI & ML API Contracts (Endpoints & Payloads)

### 1. `POST /api/chat` (Multimodal AI Curator Chat)
Sends text prompt and optional base64 image payload to AI vision model.

- **Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "prompt": "Analyze my study schedule image and recommend optimal focus blocks.",
    "hasImage": true,
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
  ```
- **Response Payload (`200 OK`)**:
  ```json
  {
    "id": "66ac028f8a12e3...",
    "sender": "ai",
    "text": "I've analyzed your schedule! To reach your target identity as a Principal Architect...",
    "timestamp": "2026-08-01T18:30:00.000Z",
    "suggestedActions": [
      "View Growth Roadmap",
      "Log a 5m Reflection",
      "Explore Learning Lab"
    ]
  }
  ```

---

### 2. `POST /api/onboarding/submit` (Identity Baseline Feature Extraction)
Initializes user identity gap vectors for AI recommendation engine.

- **Request Body**:
  ```json
  {
    "currentSelf": ["Unfocused", "Burnt Out", "Tired"],
    "imagineSelf": ["Disciplined", "Confident", "System Architect"],
    "learningStyles": ["Visual", "Aural"],
    "aspirationFocus": ["Career & Wealth", "Mindset & Peace"],
    "mediaPreferences": ["Podcasts", "Expert Guides", "Books"],
    "dailyCommitmentMinutes": 45
  }
  ```
- **Response Payload (`200 OK`)**:
  ```json
  {
    "message": "Onboarding submitted successfully",
    "user": {
      "id": "usr-101",
      "onboarding": {
        "isOnboarded": true,
        "completedAt": "2026-08-01T18:30:00.000Z"
      }
    }
  }
  ```

---

### 3. `POST /api/reflections` (Cognitive Memory Extraction)
Submits a reflection note to update memory vector confidence scores.

- **Request Body**:
  ```json
  {
    "lessonTitle": "Event-Driven Microservices Teardown",
    "learnedToday": "Understood CQRS read model separation.",
    "confusion": "Handling eventual consistency on write bursts.",
    "confidenceRating": 4
  }
  ```
- **Response Payload (`200 OK`)**:
  ```json
  [
    {
      "id": "ref-1",
      "lessonTitle": "Event-Driven Microservices Teardown",
      "learnedToday": "Understood CQRS read model separation.",
      "confusion": "Handling eventual consistency on write bursts.",
      "confidenceRating": 4,
      "createdAt": "2026-08-01T18:30:00.000Z"
    }
  ]
  ```
