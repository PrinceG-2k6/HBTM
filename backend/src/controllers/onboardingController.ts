import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { User } from "../models/User";

const currentSelfTags = [
  "Unrelaxed", "Don't Believe In Myself", "Tired", "Lazy", "Absent-minded",
  "Small Faith", "Depressed", "In Debt", "Isolated", "Disconnected", "Dreamer",
  "Time Management", "Busy", "Exhausted", "Perfectionist", "Fitness Inconsistency",
  "Self-conscious", "Out Of Shape", "Burnt Out", "Creatively Stuck"
].map((name) => ({ name, type: "current" as const, popular: true }));

const imagineSelfTags = [
  "Confident", "Energetic", "Focused", "Disciplined", "Mindful", "Faithful",
  "Happy", "Wealthy", "Connected", "Present", "Healthy", "Active", "Peaceful",
  "Courageous", "Self-accepting", "Action-oriented", "Self-assured", "Imaginative",
  "Accountable", "Recharged"
].map((name) => ({ name, type: "imagine" as const, popular: true }));

export const getAttributes = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;

  let current = currentSelfTags;
  let imagine = imagineSelfTags;

  if (search && typeof search === "string") {
    const s = search.toLowerCase();
    current = current.filter((item) => item.name.toLowerCase().includes(s));
    imagine = imagine.filter((item) => item.name.toLowerCase().includes(s));
  }

  res.status(200).json({
    total: current.length + imagine.length,
    currentSelf: current,
    imagineSelf: imagine,
  });
};

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    questions: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Select characteristics of your current self (\"Me\")",
        type: "multi-node",
        required: true,
        options: currentSelfTags,
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Select features of the self you imagine (\"I Am\")",
        type: "multi-node",
        required: true,
        options: imagineSelfTags,
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "How do you learn best?",
        type: "multi-node",
        required: true,
        options: [
          { name: "Verbal", desc: "Reading & written articles" },
          { name: "Aural", desc: "Podcasts & audio guides" },
          { name: "Kinesthetic", desc: "Interactive exercises & practice" },
          { name: "Logical", desc: "Systems & analytics" },
        ],
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Which dimensions of your life need focus?",
        type: "multi-node",
        required: true,
        options: [
          { name: "Career & Wealth" },
          { name: "Mindset & Peace" },
          { name: "Health & Vitality" },
          { name: "Creative Expression" },
          { name: "Relationships & Social" },
        ],
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "How much time can you commit daily?",
        type: "single-node",
        required: true,
        options: [
          { minutes: 15, label: "15 Minutes / Day" },
          { minutes: 30, label: "30 Minutes / Day" },
          { minutes: 45, label: "45 Minutes / Day" },
          { minutes: 60, label: "60+ Minutes / Day" },
        ],
      },
    ],
  });
};

export const submitOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentSelf, imagineSelf, learningStyles, aspirationFocus, mediaPreferences, dailyCommitmentMinutes } = req.body;

    const updatedOnboarding = {
      currentSelf: currentSelf || [],
      imagineSelf: imagineSelf || [],
      learningStyles: learningStyles || [],
      aspirationFocus: aspirationFocus || [],
      mediaPreferences: mediaPreferences || ["Podcasts", "Expert Guides", "Books"],
      dailyCommitmentMinutes: Number(dailyCommitmentMinutes) || 30,
      isOnboarded: true,
      completedAt: new Date(),
    };

    if (userId) {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          { $set: { onboarding: updatedOnboarding } },
          { new: true }
        );
        res.status(200).json({ message: "Onboarding profile saved successfully", user });
        return;
      } catch (err) {
        // Fallback for memory mode
      }
    }

    res.status(200).json({
      message: "Onboarding profile saved successfully",
      onboarding: updatedOnboarding,
    });
  } catch (error) {
    res.status(500).json({ message: "Error submitting onboarding", error: (error as Error).message });
  }
};
