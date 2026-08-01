import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "hbtm_agentic_ai_curator_secret_key_2026_super_secure";

const generateToken = (userId: string, email: string) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
};

const memoryUsers = new Map<string, any>();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, onboarding } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const initialOnboarding = {
      currentSelf: onboarding?.currentSelf || [],
      imagineSelf: onboarding?.imagineSelf || [],
      learningStyles: onboarding?.learningStyles || [],
      aspirationFocus: onboarding?.aspirationFocus || [],
      mediaPreferences: onboarding?.mediaPreferences || ["Podcasts", "Expert Guides", "Books"],
      dailyCommitmentMinutes: Number(onboarding?.dailyCommitmentMinutes) || 30,
      isOnboarded: true,
      completedAt: new Date(),
    };

    try {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        existingUser.name = name;
        existingUser.password = hashedPassword;
        if (onboarding) existingUser.onboarding = initialOnboarding;
        await existingUser.save();

        const token = generateToken(existingUser._id.toString(), existingUser.email);
        res.status(200).json({
          message: "Account updated and registered successfully",
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            avatarUrl: existingUser.avatarUrl,
            authProvider: existingUser.authProvider,
            onboarding: existingUser.onboarding,
          },
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "Personal Growth Aspirant",
        authProvider: "jwt",
        onboarding: initialOnboarding,
      });

      const token = generateToken(newUser._id.toString(), newUser.email);

      res.status(201).json({
        message: "Registration successful",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
          authProvider: newUser.authProvider,
          onboarding: newUser.onboarding,
        },
      });
    } catch (dbErr) {
      const fakeId = `usr_${Date.now()}`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userObj = {
        _id: fakeId,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "Personal Growth Aspirant",
        authProvider: "jwt",
        onboarding: initialOnboarding,
      };

      memoryUsers.set(normalizedEmail, userObj);
      const token = generateToken(fakeId, normalizedEmail);

      res.status(201).json({
        message: "Registration successful (Memory Mode)",
        token,
        user: {
          id: fakeId,
          name,
          email: normalizedEmail,
          role: userObj.role,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          authProvider: "jwt",
          onboarding: userObj.onboarding,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      if (!user.password) {
        res.status(401).json({ message: "Please sign in using Google Auth" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const token = generateToken(user._id.toString(), user.email);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          authProvider: user.authProvider,
          onboarding: user.onboarding,
        },
      });
    } catch (dbErr) {
      const memUser = memoryUsers.get(normalizedEmail);
      if (!memUser) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const isMatch = await bcrypt.compare(password, memUser.password);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const token = generateToken(memUser._id, memUser.email);
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: memUser._id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          authProvider: "jwt",
          onboarding: memUser.onboarding,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: (error as Error).message });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleToken, email, name, avatarUrl, onboarding } = req.body;

    const userEmail = (email || `google_user_${Date.now()}@gmail.com`).toLowerCase().trim();
    const userName = name || "Google Aspirant";
    const googleId = googleToken || `g_id_${Date.now()}`;

    const initialOnboarding = {
      currentSelf: onboarding?.currentSelf || [],
      imagineSelf: onboarding?.imagineSelf || [],
      learningStyles: onboarding?.learningStyles || [],
      aspirationFocus: onboarding?.aspirationFocus || [],
      mediaPreferences: onboarding?.mediaPreferences || ["Podcasts", "Expert Guides", "Books"],
      dailyCommitmentMinutes: Number(onboarding?.dailyCommitmentMinutes) || 30,
      isOnboarded: true,
      completedAt: new Date(),
    };

    try {
      let user = await User.findOne({ $or: [{ email: userEmail }, { googleId }] });

      if (!user) {
        user = await User.create({
          name: userName,
          email: userEmail,
          googleId,
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          role: "Google Authenticated Aspirant",
          authProvider: "google",
          onboarding: initialOnboarding,
        });
      } else if (onboarding) {
        user.onboarding = initialOnboarding;
        await user.save();
      }

      const token = generateToken(user._id.toString(), user.email);

      res.status(200).json({
        message: "Google authentication successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          authProvider: user.authProvider,
          onboarding: user.onboarding,
        },
      });
    } catch (dbErr) {
      const fakeId = `usr_g_${Date.now()}`;
      let memUser = memoryUsers.get(userEmail);
      if (!memUser) {
        memUser = {
          _id: fakeId,
          name: userName,
          email: userEmail,
          googleId,
          role: "Google Authenticated Aspirant",
          authProvider: "google",
          onboarding: initialOnboarding,
        };
        memoryUsers.set(userEmail, memUser);
      } else if (onboarding) {
        memUser.onboarding = initialOnboarding;
      }

      const token = generateToken(memUser._id, memUser.email);
      res.status(200).json({
        message: "Google authentication successful (Memory Mode)",
        token,
        user: {
          id: memUser._id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          authProvider: "google",
          onboarding: memUser.onboarding,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed", error: (error as Error).message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ user });
    } catch (dbErr) {
      for (const u of memoryUsers.values()) {
        if (u._id === userId) {
          res.status(200).json({
            user: {
              id: u._id,
              name: u.name,
              email: u.email,
              role: u.role,
              avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
              authProvider: u.authProvider,
              onboarding: u.onboarding,
            },
          });
          return;
        }
      }
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: (error as Error).message });
  }
};
