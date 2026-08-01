import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  initialProfile,
  initialIntervention,
  initialResources,
  initialRoadmapStages,
  initialMetrics,
  initialMemoryVectors,
  initialVisualizerConcepts,
  initialWeeklyInsights,
  initialPreferences as initialLearnerPreferences,
  initialAIKnows,
  initialTodayMission,
  initialAICoach,
  initialLearningConsistency,
  initialGoalPlanner,
  initialFutureMilestones as initialFutureSelf,
  initialOpportunities,
  initialAchievements,
} from "./dummyData";
import type { MemoryVector, LearnerProfile, LearnerPreferences } from "./types";

export const axiosInstance = axios.create({
  baseURL: "/api",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

const mock = new MockAdapter(axiosInstance, { delayResponse: 300 });

// Mutable state holders
let profileState = { ...initialProfile };
let memoryState = [...initialMemoryVectors];
let roadmapState = [...initialRoadmapStages];
let resourcesState = [...initialResources];
let preferencesState = { ...initialLearnerPreferences };
let opportunitiesState = [...initialOpportunities];

// ── Core Dashboard ────────────────────────────────────────────
mock.onGet("/profile").reply(200, profileState);

mock.onPut("/profile").reply((config) => {
  const updated: Partial<LearnerProfile> = JSON.parse(config.data || "{}");
  profileState = { ...profileState, ...updated };
  return [200, profileState];
});

mock.onGet("/dashboard").reply(200, {
  profile: profileState,
  intervention: initialIntervention,
  resources: resourcesState,
  metrics: initialMetrics,
  roadmapStages: roadmapState,
  todayMission: initialTodayMission,
  aiCoach: initialAICoach,
  learningConsistency: initialLearningConsistency,
  goalPlanner: initialGoalPlanner,
});

// ── Roadmap ───────────────────────────────────────────────────
mock.onGet("/roadmap").reply(200, {
  stages: roadmapState,
  totalMilestones: 14,
  adaptedCount: 6,
});

// ── Insights (was Analysis) ───────────────────────────────────
mock.onGet("/analysis").reply(200, initialMetrics);
mock.onGet("/insights").reply(200, {
  metrics: initialMetrics,
  weeklyInsights: initialWeeklyInsights,
});

// ── Memory / Learning Profile ─────────────────────────────────
mock.onGet("/memory").reply(200, memoryState);

mock.onPost("/memory").reply((config) => {
  const newVector: Partial<MemoryVector> = JSON.parse(config.data || "{}");
  const created: MemoryVector = {
    id: `mem-${Date.now()}`,
    category: newVector.category || "Identity & Aspirations",
    statement: newVector.statement || "",
    confidence: 96,
    lastUpdated: "Just now",
    impactOnCurator: "Directly shapes future media filter & dynamic roadmap curation.",
    active: true,
  };
  memoryState = [created, ...memoryState];
  return [201, memoryState];
});

mock.onGet("/learning-profile").reply(200, {
  memoryVectors: memoryState,
  preferences: preferencesState,
  aiKnows: initialAIKnows,
});

mock.onPut("/learning-profile/preferences").reply((config) => {
  const updated: Partial<LearnerPreferences> = JSON.parse(config.data || "{}");
  preferencesState = { ...preferencesState, ...updated, lastUpdated: "Just now" };
  return [200, preferencesState];
});

// ── Learning Lab (was Visualizer) ────────────────────────────
mock.onGet("/visualizer").reply(200, initialVisualizerConcepts);

// ── Future Self ───────────────────────────────────────────────
mock.onGet("/future-self").reply(200, {
  milestones: initialFutureSelf,
  profile: profileState,
});

// ── Opportunities ─────────────────────────────────────────────
mock.onGet("/opportunities").reply(200, opportunitiesState);

mock.onPatch("/opportunities/:id/bookmark").reply((config) => {
  const id = config.url?.split("/")?.[2];
  opportunitiesState = opportunitiesState.map((o) =>
    o.id === id ? { ...o, bookmarked: !o.bookmarked } : o
  );
  return [200, opportunitiesState];
});

// ── Achievements ──────────────────────────────────────────────
mock.onGet("/achievements").reply(200, {
  achievements: initialAchievements,
  totalXP: initialAchievements.filter(a => a.unlocked).reduce((s, a) => s + a.xpReward, 0),
  unlockedCount: initialAchievements.filter(a => a.unlocked).length,
});

// ── Reflections ───────────────────────────────────────────────
let reflectionsState: { id: string; lessonTitle: string; learnedToday: string; confusion: string; confidenceRating: number; createdAt: string }[] = [];

mock.onGet("/reflections").reply(200, reflectionsState);

mock.onPost("/reflections").reply((config) => {
  const entry = JSON.parse(config.data || "{}");
  const created = { id: `ref-${Date.now()}`, createdAt: new Date().toLocaleDateString(), ...entry };
  reflectionsState = [created, ...reflectionsState];
  return [201, reflectionsState];
});

// ── Bookmarks ─────────────────────────────────────────────────
mock.onPatch("/resources/:id/bookmark").reply((config) => {
  const id = config.url?.split("/")?.[2];
  resourcesState = resourcesState.map((r) =>
    r.id === id ? { ...r, bookmarked: !r.bookmarked } : r
  );
  return [200, resourcesState];
});
