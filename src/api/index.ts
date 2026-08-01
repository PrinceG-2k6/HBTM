import { axiosInstance } from "./axiosClient";
import type {
  LearnerProfile,
  AgenticIntervention,
  CuratedResource,
  RoadmapStage,
  CognitiveMetrics,
  MemoryVector,
  VisualizerConcept,
  WeeklyInsights,
  LearnerPreferences,
  AIKnowsFact,
  TodayMission,
  AICoachMessage,
  LearningConsistency,
  GoalPlannerData,
  FutureMilestone,
  Opportunity,
  Achievement,
} from "./types";

export type {
  TopicProgress,
  NodeState,
  HumanPotentialBreakdown,
  WeeklyInsights,
  LearnerPreferences,
  AIKnowsFact,
  TodayMission,
  AICoachMessage,
  LearningConsistency,
  GoalPlannerData,
  FutureMilestone,
  Opportunity,
  Achievement,
  ReflectionEntry,
} from "./types";

export interface DashboardDataResponse {
  profile: LearnerProfile;
  intervention: AgenticIntervention;
  resources: CuratedResource[];
  metrics: CognitiveMetrics;
  roadmapStages: RoadmapStage[];
  todayMission: TodayMission;
  aiCoach: AICoachMessage;
  learningConsistency: LearningConsistency;
  goalPlanner: GoalPlannerData;
}

export interface RoadmapDataResponse {
  stages: RoadmapStage[];
  totalMilestones: number;
  adaptedCount: number;
}

export interface InsightsDataResponse {
  metrics: CognitiveMetrics;
  weeklyInsights: WeeklyInsights;
}

export interface LearningProfileResponse {
  memoryVectors: MemoryVector[];
  preferences: LearnerPreferences;
  aiKnows: AIKnowsFact[];
}

export interface AchievementsResponse {
  achievements: Achievement[];
  totalXP: number;
  unlockedCount: number;
}

export interface FutureSelfResponse {
  milestones: FutureMilestone[];
  profile: LearnerProfile;
}

export const apiService = {
  getDashboardData: async (): Promise<DashboardDataResponse> => {
    const res = await axiosInstance.get<DashboardDataResponse>("/dashboard");
    return res.data;
  },
  getProfile: async (): Promise<LearnerProfile> => {
    const res = await axiosInstance.get<LearnerProfile>("/profile");
    return res.data;
  },
  updateProfile: async (updated: Partial<LearnerProfile>): Promise<LearnerProfile> => {
    const res = await axiosInstance.put<LearnerProfile>("/profile", updated);
    return res.data;
  },
  getRoadmapData: async (): Promise<RoadmapDataResponse> => {
    const res = await axiosInstance.get<RoadmapDataResponse>("/roadmap");
    return res.data;
  },
  getCognitiveAnalysis: async (): Promise<CognitiveMetrics> => {
    const res = await axiosInstance.get<CognitiveMetrics>("/analysis");
    return res.data;
  },
  getInsights: async (): Promise<InsightsDataResponse> => {
    const res = await axiosInstance.get<InsightsDataResponse>("/insights");
    return res.data;
  },
  getLearnerMemory: async (): Promise<MemoryVector[]> => {
    const res = await axiosInstance.get<MemoryVector[]>("/memory");
    return res.data;
  },
  addMemoryVector: async (vector: { category: MemoryVector["category"]; statement: string }): Promise<MemoryVector[]> => {
    const res = await axiosInstance.post<MemoryVector[]>("/memory", vector);
    return res.data;
  },
  getLearningProfile: async (): Promise<LearningProfileResponse> => {
    const res = await axiosInstance.get<LearningProfileResponse>("/learning-profile");
    return res.data;
  },
  updatePreferences: async (prefs: Partial<LearnerPreferences>): Promise<LearnerPreferences> => {
    const res = await axiosInstance.put<LearnerPreferences>("/learning-profile/preferences", prefs);
    return res.data;
  },
  getVisualizerNotes: async (): Promise<VisualizerConcept[]> => {
    const res = await axiosInstance.get<VisualizerConcept[]>("/visualizer");
    return res.data;
  },
  getFutureSelf: async (): Promise<FutureSelfResponse> => {
    const res = await axiosInstance.get<FutureSelfResponse>("/future-self");
    return res.data;
  },
  getOpportunities: async (): Promise<Opportunity[]> => {
    const res = await axiosInstance.get<Opportunity[]>("/opportunities");
    return res.data;
  },
  getAchievements: async (): Promise<AchievementsResponse> => {
    const res = await axiosInstance.get<AchievementsResponse>("/achievements");
    return res.data;
  },
  addReflection: async (entry: { lessonTitle: string; learnedToday: string; confusion: string; confidenceRating: number }): Promise<unknown[]> => {
    const res = await axiosInstance.post("/reflections", entry);
    return res.data;
  },
};
