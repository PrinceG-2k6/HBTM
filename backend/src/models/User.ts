import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserOnboarding {
  currentSelf: string[];
  imagineSelf: string[];
  learningStyles: string[];
  aspirationFocus: string[];
  mediaPreferences: string[];
  dailyCommitmentMinutes: number;
  isOnboarded: boolean;
  completedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: string;
  avatarUrl?: string;
  authProvider: "jwt" | "google";
  onboarding: IUserOnboarding;
  createdAt: Date;
  updatedAt: Date;
}

const UserOnboardingSchema = new Schema<IUserOnboarding>(
  {
    currentSelf: { type: [String], default: [] },
    imagineSelf: { type: [String], default: [] },
    learningStyles: { type: [String], default: [] },
    aspirationFocus: { type: [String], default: [] },
    mediaPreferences: { type: [String], default: ["Podcasts", "Expert Guides", "Books"] },
    dailyCommitmentMinutes: { type: Number, default: 30 },
    isOnboarded: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String },
    role: { type: String, default: "Personal Growth Aspirant" },
    avatarUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    },
    authProvider: { type: String, enum: ["jwt", "google"], default: "jwt" },
    onboarding: { type: UserOnboardingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
