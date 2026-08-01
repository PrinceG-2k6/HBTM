import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { User } from "../models/User";

export const getCuratedFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    let user = userId ? await User.findById(userId) : null;

    const currentTraits = user?.onboarding?.currentSelf || ["Tired"];
    const targetTraits = user?.onboarding?.imagineSelf || ["Confident"];

    res.status(200).json({
      curatedFor: user?.name || "Learner",
      currentIdentityGap: `${currentTraits[0] || "Burnout"} → ${targetTraits[0] || "Growth"}`,
      items: [
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
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching curated feed" });
  }
};
