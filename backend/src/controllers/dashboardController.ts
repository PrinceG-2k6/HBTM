import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { User } from "../models/User";

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    let user = userId ? await User.findById(userId) : null;

    const currentTraits = user?.onboarding?.currentSelf || ["Tired", "Burnt Out"];
    const targetTraits = user?.onboarding?.imagineSelf || ["Confident", "Disciplined"];

    res.status(200).json({
      id: user?._id || "usr-101",
      name: user?.name || "Learner",
      email: user?.email || "user@pacer.ai",
      role: user?.role || "Personal Growth Aspirant",
      avatarUrl: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
      primaryGoal: `Transforming from ${currentTraits.join(", ")} into ${targetTraits.join(", ")}`,
      secondaryGoal: "Consistently applying daily micro-learning habits",
      intentionalityScore: 92,
      lastActive: "Just now",
      totalLearningTimeMinutes: 140,
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading profile", error: (error as Error).message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const updates = req.body;
    if (userId) {
      const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
      res.status(200).json(user);
      return;
    }
    res.status(200).json(updates);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

export const getDashboardData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    let user = userId ? await User.findById(userId) : null;

    const currentTraits = user?.onboarding?.currentSelf || ["Tired", "Burnt Out"];
    const targetTraits = user?.onboarding?.imagineSelf || ["Confident", "Disciplined"];
    const learningStyles = user?.onboarding?.learningStyles || ["Aural", "Verbal"];

    res.status(200).json({
      profile: {
        id: user?._id || "usr-101",
        name: user?.name || "Learner",
        email: user?.email || "user@pacer.ai",
        role: user?.role || "Personal Growth Aspirant",
        currentRole: user?.role || "Personal Growth Aspirant",
        avatarUrl: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        aspirationalIdentity: `Target Identity: ${targetTraits.join(", ") || "Confident & Focused"}`,
        curatorStatus: "Active Curator",
        currentMilestone: "Stage 1: Identity Baseline & Focus Protocol",
        overallRoadmapProgress: 65,
        activeStreakDays: 7,
        humanPotentialScore: 92,
        mindfulConsumptionRate: 88,
        weeklyFocusHours: 14.5,
        primaryGoal: `Bridge gap: ${currentTraits.join(", ")} → ${targetTraits.join(", ")}`,
        secondaryGoal: `Daily commitment: ${user?.onboarding?.dailyCommitmentMinutes || 30} mins`,
        intentionalityScore: 94,
        lastActive: "Just now",
        totalLearningTimeMinutes: 180,
        humanPotentialBreakdown: {
          intentionality: 92,
          consistency: 88,
          depth: 95,
          application: 90,
        },
      },
      intervention: {
        id: "int-1",
        title: "Curator Intervention Alert",
        type: "Micro-Course",
        problemSummary: `Detected cognitive fatigue pattern matching current baseline (${currentTraits[0] || "Tired"}).`,
        curatorActionTaken: `Replaced passive scrolling recommendations with a 15-minute neural reset audio guide.`,
        suggestedActionText: "Start 15-Min Audio Protocol",
        actionRoute: "/learning-lab",
        estTime: `${user?.onboarding?.dailyCommitmentMinutes || 30} mins`,
        reasoning: `Tailored specifically for ${learningStyles.join(" & ")} absorption.`,
        urgency: "High",
        source: "AI Curator Engine",
      },
      resources: [
        {
          id: "res-1",
          title: "Neural Focus Reset for Cognitive Fatigue",
          type: "Podcast",
          estTime: "24m",
          difficulty: "Intermediate",
          skillGain: "Focus Mastery +15 XP",
          reasoning: `Matches current challenge: ${currentTraits[0] || "Tired"}`,
          intentionalityScore: 98,
          bookmarked: false,
          url: "https://hubermanlab.com",
          buildsUpon: "Baseline Attention Protocol",
          unlocksGoal: "High-Leverage Deep Work State",
          actionRoute: "/learning-lab",
        },
        {
          id: "res-2",
          title: "Atomic Habit Re-engineering",
          type: "Expert Guide",
          estTime: "12m",
          difficulty: "Beginner",
          skillGain: "Discipline +20 XP",
          reasoning: `Target identity trait: ${targetTraits[0] || "Disciplined"}`,
          intentionalityScore: 95,
          bookmarked: true,
          url: "https://jamesclear.com",
          buildsUpon: "Environmental Cue Auditing",
          unlocksGoal: "Automatic Habit Systems",
          actionRoute: "/roadmap",
        },
      ],
      metrics: {
        activeMinutesWeekly: 210,
        conceptsMastered: 14,
        curatedRatio: 88,
        potentialGrowthIndex: 91,
        attentionToIntentRatio: 94,
        dailyFocusLogs: [
          { day: "M", mindfulHours: 3.2, skimmingHours: 0.8 },
          { day: "T", mindfulHours: 5.2, skimmingHours: 0.5 },
          { day: "W", mindfulHours: 4.0, skimmingHours: 1.2 },
          { day: "T", mindfulHours: 2.5, skimmingHours: 1.0 },
          { day: "F", mindfulHours: 4.8, skimmingHours: 0.6 },
          { day: "S", mindfulHours: 3.5, skimmingHours: 0.4 },
          { day: "S", mindfulHours: 2.8, skimmingHours: 0.5 },
        ],
        topicProgress: [
          { name: "Mindset & Peace", radius: 45, color: "#f59e0b", x: 30, y: 40, confidence: 94, status: "Mastered" },
          { name: "Career & Wealth", radius: 55, color: "#10b981", x: 60, y: 30, confidence: 88, status: "Active" },
          { name: "Health & Vitality", radius: 35, color: "#ec4899", x: 45, y: 70, confidence: 92, status: "Active" },
          { name: "Discipline Mastery", radius: 50, color: "#06b6d4", x: 75, y: 65, confidence: 90, status: "Mastered" },
        ],
      },
      roadmapStages: [
        {
          id: "stg-1",
          title: "Stage 1: Identity & Habits Baseline",
          description: "Deconstructing passive scrolling habits into intentional learning vectors",
          milestonesCount: 4,
          completedCount: 3,
        },
        {
          id: "stg-2",
          title: "Stage 2: Deep Skill & Mastery Curation",
          description: "Synthesizing audiobooks, podcasts, and action guides into daily routines",
          milestonesCount: 5,
          completedCount: 2,
        },
      ],
      todayMission: {
        taskTitle: "Complete 15-minute Focus Breathwork & Audio Guide",
        taskType: "Audio Protocol",
        progressPercent: 45,
        estimatedMinutes: 15,
        reward: "+50 XP Focus Skill",
        route: "/learning-lab",
        title: "Complete 15-minute Focus Breathwork & Audio Guide",
        completed: false,
        xpReward: 50,
      },
      aiCoach: {
        energyLevel: "High",
        message: `Welcome back, ${user?.name || "Learner"}! Your AI Curator has filtered 2 high-signal resources for your gap (${currentTraits[0] || "Tired"} → ${targetTraits[0] || "Confident"}).`,
        focusTopic: `Identity Transformation: ${currentTraits[0] || "Tired"} → ${targetTraits[0] || "Confident"}`,
        tip: "15 minutes of morning audio guide resets dopamine baselines for deep focus.",
        timestamp: "Just now",
      },
      learningConsistency: {
        currentStreak: 7,
        currentStreakDays: 7,
        bestStreak: 14,
        longestStreakDays: 14,
        weeklyConsistencyPercent: 85,
        weeklyHours: 12.5,
        dailyGoalMet: [true, true, true, true, true, false, false],
        totalCompletedSessions: 22,
      },
      goalPlanner: {
        careerGoal: "Master Daily Curation & Focus Protocol",
        targetQuarterGoal: "Master Daily Curation & Focus Protocol",
        targetDate: "Q3 2026",
        weeklyStudyHours: 14,
        progressPercent: 68,
        progressPercentage: 68,
        milestones: [
          { label: "Baseline identity & challenges mapped", done: true },
          { label: "Establish daily morning audio curation habit", done: true },
          { label: "Complete deep work focus protocol", done: false },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading dashboard data" });
  }
};

export const getLearningProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    let user = userId ? await User.findById(userId) : null;

    const currentTraits = user?.onboarding?.currentSelf || [];
    const targetTraits = user?.onboarding?.imagineSelf || [];
    const learningStyles = user?.onboarding?.learningStyles || [];
    const domains = user?.onboarding?.aspirationFocus || [];

    res.status(200).json({
      memoryVectors: [
        {
          id: "mem-1",
          category: "Current Self Baseline",
          statement: `Current traits identified: ${currentTraits.join(", ") || "None selected yet"}`,
          confidence: 96,
          lastUpdated: "Just now",
          impactOnCurator: "Used to detect cognitive burnout and fatigue triggers",
          active: true,
        },
        {
          id: "mem-2",
          category: "Target Imagine Self",
          statement: `Aspirational attributes: ${targetTraits.join(", ") || "None selected yet"}`,
          confidence: 98,
          lastUpdated: "Just now",
          impactOnCurator: "Directs media recommendation algorithm toward high-leverage outcomes",
          active: true,
        },
        {
          id: "mem-3",
          category: "Learning Style Vector",
          statement: `Preferred learning modes: ${learningStyles.join(", ") || "Visual & Audio"}`,
          confidence: 95,
          lastUpdated: "Just now",
          impactOnCurator: "Ranks podcasts vs written summaries based on absorption speed",
          active: true,
        },
      ],
      preferences: {
        primaryLearningStyle: learningStyles[0] || "Aural",
        dailyTimeBudgetMinutes: user?.onboarding?.dailyCommitmentMinutes || 30,
        focusedDomains: domains,
        preferredFormats: user?.onboarding?.mediaPreferences || ["Podcasts", "Expert Guides"],
        lastUpdated: "Just now",
      },
      aiKnows: [
        { fact: `Prefers learning via ${learningStyles.join(" and ") || "Podcasts"}`, confidence: 96 },
        { fact: `Target growth domain: ${domains.join(", ") || "Career & Wealth"}`, confidence: 94 },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading learning profile" });
  }
};

export const getRoadmapData = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    stages: [
      {
        id: "stg-1",
        title: "Stage 1: Baseline Identity & Curation Protocol",
        description: "Mapping current self vulnerabilities and establishing daily intentionality anchors.",
        milestonesCount: 4,
        completedCount: 4,
      },
      {
        id: "stg-2",
        title: "Stage 2: High-Leverage Skill Mastery",
        description: "Absorbing top 1% podcasts, expert guides, and audiobooks tailored to target identity.",
        milestonesCount: 6,
        completedCount: 3,
      },
    ],
    totalMilestones: 10,
    adaptedCount: 4,
  });
};

export const getAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    activeMinutesWeekly: 240,
    conceptsMastered: 18,
    curatedRatio: 92,
    potentialGrowthIndex: 94,
    attentionToIntentRatio: 94,
    dailyFocusLogs: [
      { day: "M", mindfulHours: 3.2, skimmingHours: 0.8 },
      { day: "T", mindfulHours: 5.2, skimmingHours: 0.5 },
      { day: "W", mindfulHours: 4.0, skimmingHours: 1.2 },
      { day: "T", mindfulHours: 2.5, skimmingHours: 1.0 },
      { day: "F", mindfulHours: 4.8, skimmingHours: 0.6 },
      { day: "S", mindfulHours: 3.5, skimmingHours: 0.4 },
      { day: "S", mindfulHours: 2.8, skimmingHours: 0.5 },
    ],
    topicProgress: [
      { name: "Mindset & Peace", radius: 45, color: "#f59e0b", x: 30, y: 40, confidence: 94, status: "Mastered" },
      { name: "Career & Wealth", radius: 55, color: "#10b981", x: 60, y: 30, confidence: 88, status: "Active" },
    ],
  });
};

export const getInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    metrics: {
      activeMinutesWeekly: 240,
      conceptsMastered: 18,
      curatedRatio: 92,
      potentialGrowthIndex: 94,
      attentionToIntentRatio: 94,
      dailyFocusLogs: [
        { day: "M", mindfulHours: 3.2, skimmingHours: 0.8 },
        { day: "T", mindfulHours: 5.2, skimmingHours: 0.5 },
        { day: "W", mindfulHours: 4.0, skimmingHours: 1.2 },
      ],
      topicProgress: [],
    },
    weeklyInsights: {
      summary: "High learning consistency across podcasts and action exercises.",
      topGrowthArea: "Focus & Discipline Mastery",
    },
  });
};

export const getMemory = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json([]);
};

export const getVisualizer = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json([]);
};

export const getFutureSelf = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ milestones: [], profile: {} });
};

export const getOpportunities = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json([]);
};

export const getAchievements = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ achievements: [], totalXP: 350, unlockedCount: 4 });
};

export const getReflections = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json([]);
};
