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

export { authApi, onboardingApi, curationApi } from "./axiosClient";

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

export interface AchievementsResponse {
  achievements: Achievement[];
  totalXP: number;
  unlockedCount: number;
}

export interface FutureSelfResponse {
  milestones: FutureMilestone[];
  profile: Partial<LearnerProfile>;
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

export interface RoadmapDataResponse {
  stages: RoadmapStage[];
  totalMilestones: number;
  adaptedCount: number;
}

export const apiService = {
  getDashboardData: async (): Promise<DashboardDataResponse> => {
    const res = await axiosInstance.get("/dashboard");
    return res.data;
  },
  getProfile: async (): Promise<LearnerProfile> => {
    const res = await axiosInstance.get("/profile");
    return res.data;
  },
  updateProfile: async (updates: Partial<LearnerProfile>): Promise<LearnerProfile> => {
    const res = await axiosInstance.put("/profile", updates);
    return res.data;
  },
  getRoadmap: async () => {
    const res = await axiosInstance.get("/roadmap");
    return res.data;
  },
  getRoadmapData: async (): Promise<RoadmapDataResponse> => {
    const res = await axiosInstance.get("/roadmap");
    return res.data;
  },
  getAnalysis: async () => {
    const res = await axiosInstance.get("/analysis");
    return res.data;
  },
  getCognitiveAnalysis: async () => {
    const res = await axiosInstance.get("/analysis");
    return res.data;
  },
  getInsights: async (): Promise<InsightsDataResponse> => {
    const res = await axiosInstance.get("/insights");
    return res.data;
  },
  getMemory: async (): Promise<MemoryVector[]> => {
    const res = await axiosInstance.get("/memory");
    return res.data;
  },
  getLearnerMemory: async (): Promise<MemoryVector[]> => {
    const res = await axiosInstance.get("/memory");
    return res.data;
  },
  addMemoryVector: async (vector: any) => {
    const res = await axiosInstance.post("/memory", vector);
    return res.data;
  },
  getVisualizer: async (): Promise<VisualizerConcept[]> => {
    const res = await axiosInstance.get("/visualizer");
    return res.data;
  },
  getVisualizerNotes: async (): Promise<VisualizerConcept[]> => {
    const res = await axiosInstance.get("/visualizer");
    return res.data;
  },
  getFutureSelf: async (): Promise<FutureSelfResponse> => {
    const res = await axiosInstance.get("/future-self");
    return res.data;
  },
  getOpportunities: async (): Promise<Opportunity[]> => {
    const res = await axiosInstance.get("/opportunities");
    return res.data;
  },
  getAchievements: async (): Promise<AchievementsResponse> => {
    const res = await axiosInstance.get("/achievements");
    return res.data;
  },
  getReflections: async () => {
    const res = await axiosInstance.get("/reflections");
    return res.data;
  },
  addReflection: async (data: any) => {
    const res = await axiosInstance.post("/reflections", data);
    return res.data;
  },
  getLearningProfile: async (): Promise<LearningProfileResponse> => {
    const res = await axiosInstance.get("/learning-profile");
    return res.data;
  },
  updatePreferences: async (preferences: Partial<LearnerPreferences>) => {
    const res = await axiosInstance.put("/learning-profile/preferences", preferences);
    return res.data;
  },
  sendAIChat: async (payload: { prompt: string; hasImage?: boolean; imageBase64?: string }) => {
    const res = await axiosInstance.post("/chat", payload);
    return res.data;
  },
};
