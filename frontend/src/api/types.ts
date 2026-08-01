export type NodeState =
  | "Exploring"
  | "Learning"
  | "Practicing"
  | "Applying"
  | "Mastering"
  | "Neglected"
  | "Overconsumed"
  | "Blocked"
  | "Completed";

export interface TopicProgress {
  id: string;
  name: string;
  category: string;
  completedPercent: number;
  totalItems: number;
  completedItems: number;
  relatedStageId?: string;
  // Multi-dimensional node fields
  nodeState: NodeState;
  timeInvested: number;        // hours spent
  confidenceLevel: number;     // 0–100
  lastActive: string;          // ISO date
  recentlyActive: boolean;
  isIdentityLevel: boolean;    // purple aspiration node
  dependencies?: string[];     // ids of other nodes this depends on
}

export interface HumanPotentialBreakdown {
  taskCompletion: number;       // 0–100, weight 30%
  consistency: number;          // 0–100, weight 20%
  appliedPractice: number;      // 0–100, weight 15%
  reflectionQuality: number;    // 0–100, weight 15%
  balancedGrowth: number;       // 0–100, weight 10%
  noveltyLearning: number;      // 0–100, weight 10%
  passivePenalty: number;       // 0–100, penalty subtracted
  total: number;                // final 0–100 score
}

export interface LearnerProfile {
  name: string;
  avatarUrl: string;
  currentRole: string;
  aspirationalIdentity: string;
  humanPotentialScore: number;
  humanPotentialBreakdown: HumanPotentialBreakdown;
  mindfulConsumptionRate: number;
  weeklyFocusHours: number;
  dopamineTrapsBlocked: number;
  activeStreakDays: number;
  currentMilestone: string;
  curatorStatus: "Active Curation" | "Recalibrating" | "Deep Focus Mode";
  overallRoadmapProgress: number;
}

export interface CuratedResource {
  id: string;
  title: string;
  type:
    | "Research Paper"
    | "Interactive Simulator"
    | "Book Summary"
    | "Podcast"
    | "Code Sandbox"
    | "YouTube Video"
    | "Article"
    | "Event"
    | "Mentor Session"
    | "Reflection Exercise";
  category: string;
  estTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  skillGain: string;
  intentionalityScore: number;
  reasoning: string;
  buildsUpon?: string;
  unlocksGoal?: string;
  url?: string;
  actionRoute?: string;
  bookmarked?: boolean;
}

export interface AgenticIntervention {
  id: string;
  type: "gap_detected" | "fatigue_alert" | "breakthrough_opportunity" | "passive_trap";
  title: string;
  topic: string;
  problemSummary: string;
  curatorActionTaken: string;
  suggestedActionText: string;
  actionRoute: string;
  severity: "high" | "medium" | "low";
}

export interface RoadmapStage {
  id: string;
  stageNumber: number;
  title: string;
  description: string;
  status: "in-progress" | "ai-adapted" | "upcoming" | "completed";
  progressPercent: number;
  estimatedDays: number;
  remainingDays: number;
  scheduleStatus: "on-track" | "ahead" | "behind";
  skillsGained: string[];
  prerequisites: string[];
  careerImpact: string;
  items: CuratedResource[];
}

export interface CognitiveMetrics {
  growthVelocity: number;
  attentionToIntentRatio: number;
  retentionRate: number;
  fatigueIndex: number;
  dailyFocusLogs: { day: string; mindfulHours: number; skimmingHours: number; intentionality: number }[];
  skillMatrix: { skill: string; score: number; target: number; category: string }[];
  topicProgress: TopicProgress[];
}

export interface WeeklyInsights {
  hoursStudied: number;
  lessonsCompleted: number;
  projectsCompleted: number;
  consistencyPercent: number;
  strengths: { topic: string; score: number; note: string }[];
  weaknesses: { topic: string; score: number; suggestion: string }[];
  aiSummary: string;
  suggestedPractice: { title: string; type: string; reason: string; route: string }[];
}

export interface MemoryVector {
  id: string;
  category: "Identity & Aspirations" | "Cognitive Style" | "Learning Habits" | "Curator Filters";
  statement: string;
  confidence: number;
  lastUpdated: string;
  impactOnCurator: string;
  active: boolean;
}

export interface LearnerPreferences {
  learningStyle: "Visual" | "Reading" | "Hands-on" | "Auditory";
  dailyGoalMinutes: number;
  preferredFormat: "Video" | "Articles" | "Code Sandboxes" | "Research Papers" | "Mixed";
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  lastUpdated: string;
}

export interface AIKnowsFact {
  id: string;
  fact: string;
  category: string;
  confidenceLevel: number;
}

export interface VisualizerConcept {
  id: string;
  title: string;
  concept: string;
  description: string;
  keyTakeaways: string[];
  interactiveCodeSnippet: string;
  executionTrace: { step: number; title: string; memoryState: string; detail: string }[];
  quizQuestions?: { question: string; options: string[]; correctIndex: number; explanation: string }[];
}

export interface TodayMission {
  taskTitle: string;
  taskType: string;
  estimatedMinutes: number;
  reward: string;
  nextMilestone: string;
  progressPercent: number;
  route: string;
}

export interface AICoachMessage {
  message: string;
  focusTopic: string;
  tip: string;
  energyLevel: "High" | "Medium" | "Low";
}

export interface LearningConsistency {
  currentStreak: number;
  weeklyHours: number;
  weeklyConsistencyPercent: number;
  bestStreak: number;
  dailyGoalMet: boolean[];
}

export interface GoalPlannerData {
  careerGoal: string;
  targetDate: string;
  weeklyStudyHours: number;
  progressPercent: number;
  milestones: { label: string; done: boolean }[];
}

export interface FutureMilestone {
  period: "Now" | "3 Months" | "6 Months" | "1 Year";
  skills: string[];
  projects: string[];
  careerReadiness: number;
  goalCompletion: number;
  description: string;
}

export interface Opportunity {
  id: string;
  type: "Hackathon" | "Internship" | "Open Source" | "Research Paper" | "Meetup" | "Competition" | "Conference" | "Workshop" | "Mentorship";
  title: string;
  organizer: string;
  deadline?: string;
  description: string;
  relevanceScore: number;
  link?: string;
  bookmarked?: boolean;
  tags: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressCurrent?: number;
  progressTarget?: number;
  category: "Streak" | "Milestone" | "Project" | "Learning" | "Community";
  xpReward: number;
}

export interface ReflectionEntry {
  id: string;
  lessonTitle: string;
  learnedToday: string;
  confusion: string;
  confidenceRating: number;
  createdAt: string;
}
