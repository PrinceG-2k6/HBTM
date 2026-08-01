import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, Lock, Mail, Sparkles, AlertCircle, Eye, EyeOff, User, Search, Check, ShieldCheck, X } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../contexts/auth.context";
import { onboardingApi } from "../api/axiosClient";
import { AuthVisual3D } from "../components/auth/AuthVisual3D";

interface AttributeItem {
  name: string;
  type: "current" | "imagine" | "both";
  category?: string;
  popular?: boolean;
}

export const AuthPage: React.FC<{ initialTab?: "signin" | "signup" }> = ({ initialTab = "signin" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithJWT, signupWithJWT, loginWithGoogle, updateUserOnboarding } = useAuth();

  // Active Tab: "signin" | "signup"
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(
    location.pathname === "/signup" ? "signup" : initialTab
  );

  useEffect(() => {
    if (location.pathname === "/signup") setActiveTab("signup");
    else if (location.pathname === "/signin") setActiveTab("signin");
  }, [location.pathname]);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up Form / Onboarding States
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // Common UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Custom Dynamic Google Auth Modal States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState("");
  const [googleAccountName, setGoogleAccountName] = useState("");

  // Registration Selections
  const [searchMe, setSearchMe] = useState("");
  const [searchIAm, setSearchIAm] = useState("");
  const [selectedCurrentSelf, setSelectedCurrentSelf] = useState<string[]>([]);
  const [selectedImagineSelf, setSelectedImagineSelf] = useState<string[]>([]);
  const [selectedLearningStyles, setSelectedLearningStyles] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [dailyTime, setDailyTime] = useState<number | null>(null);

  // Backend attributes for questionnaire
  const [currentSelfList, setCurrentSelfList] = useState<AttributeItem[]>([]);
  const [imagineSelfList, setImagineSelfList] = useState<AttributeItem[]>([]);

  useEffect(() => {
    const loadAttributes = async () => {
      const data = await onboardingApi.getAttributes();
      if (data) {
        setCurrentSelfList(data.currentSelf || []);
        setImagineSelfList(data.imagineSelf || []);
      }
    };
    loadAttributes();
  }, []);

  const filteredMeList = currentSelfList.filter((item) =>
    item.name.toLowerCase().includes(searchMe.toLowerCase())
  );
  const filteredIAmList = imagineSelfList.filter((item) =>
    item.name.toLowerCase().includes(searchIAm.toLowerCase())
  );

  const toggleCurrentSelf = (n: string) =>
    setSelectedCurrentSelf((p) => (p.includes(n) ? p.filter((i) => i !== n) : [...p, n]));
  const toggleImagineSelf = (n: string) =>
    setSelectedImagineSelf((p) => (p.includes(n) ? p.filter((i) => i !== n) : [...p, n]));
  const toggleLearningStyle = (n: string) =>
    setSelectedLearningStyles((p) => (p.includes(n) ? p.filter((s) => s !== n) : [...p, n]));
  const toggleDomain = (n: string) =>
    setSelectedDomains((p) => (p.includes(n) ? p.filter((d) => d !== n) : [...p, n]));

  // Sign In Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError("Please complete all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await loginWithJWT(signInEmail, signInPassword);
      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message || "Invalid credentials. Check email and password.");
      }
    } catch {
      setError("Authentication failed. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // Official Google OAuth Success Handler (Extracts dynamic user info from Google JWT payload)
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError("");
    try {
      let decoded: any = {};
      if (credentialResponse?.credential) {
        try {
          decoded = jwtDecode(credentialResponse.credential);
        } catch (e) {
          console.warn("JWT decode fallback", e);
        }
      }

      const targetEmail = decoded.email || googleAccountEmail;
      const targetName = decoded.name || googleAccountName || (targetEmail ? targetEmail.split("@")[0] : "Google User");
      const targetAvatar = decoded.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80";

      if (!targetEmail) {
        setShowGoogleModal(true);
        setLoading(false);
        return;
      }

      const res = await loginWithGoogle({
        credential: credentialResponse?.credential || `google_token_${Date.now()}`,
        email: targetEmail,
        name: targetName,
        avatarUrl: targetAvatar,
        onboarding: activeTab === "signup" ? {
          currentSelf: selectedCurrentSelf,
          imagineSelf: selectedImagineSelf,
          learningStyles: selectedLearningStyles,
          aspirationFocus: selectedDomains,
          dailyCommitmentMinutes: dailyTime || 30,
          isOnboarded: true
        } : undefined
      });

      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.message || "Google Authentication failed.");
      }
    } catch {
      setError("Google Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Google Sign In Submit (When user enters custom account)
  const handleCustomGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleAccountEmail) {
      setError("Please enter your Google Account email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const finalName = googleAccountName || googleAccountEmail.split("@")[0];
      const res = await loginWithGoogle({
        credential: `google_account_${Date.now()}`,
        email: googleAccountEmail,
        name: finalName,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        onboarding: activeTab === "signup" ? {
          currentSelf: selectedCurrentSelf,
          imagineSelf: selectedImagineSelf,
          learningStyles: selectedLearningStyles,
          aspirationFocus: selectedDomains,
          dailyCommitmentMinutes: dailyTime || 30,
          isOnboarded: true
        } : undefined
      });

      if (res.success) {
        setShowGoogleModal(false);
        navigate("/dashboard");
      } else {
        setError(res.message || "Google Auth failed.");
      }
    } catch {
      setError("Google Auth failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // Registration Next Step / Submit Handler
  const canProceedSignUp = (): boolean => {
    if (step === 0) return !!(signUpName && signUpEmail && signUpPassword && signUpPassword.length >= 6);
    if (step === 1) return selectedCurrentSelf.length > 0;
    if (step === 2) return selectedImagineSelf.length > 0;
    if (step === 3) return selectedLearningStyles.length > 0;
    if (step === 4) return selectedDomains.length > 0;
    if (step === 5) return dailyTime !== null;
    return false;
  };

  const handleStartQuestionnaire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceedSignUp()) {
      setError("Please fill in all required fields (password min 6 chars).");
      return;
    }
    setError("");
    setStep(1);
  };

  const handleFinalSignUpSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const onboardingProfile = {
        currentSelf: selectedCurrentSelf,
        imagineSelf: selectedImagineSelf,
        learningStyles: selectedLearningStyles,
        aspirationFocus: selectedDomains,
        mediaPreferences: ["Podcasts", "Expert Guides", "Books"],
        dailyCommitmentMinutes: dailyTime || 30,
        isOnboarded: true,
      };

      const res = await signupWithJWT(signUpName, signUpEmail, signUpPassword, "Personal Growth Aspirant", onboardingProfile);

      if (res?.success) {
        try { await onboardingApi.submit(onboardingProfile); } catch { /* background sync */ }
        updateUserOnboarding(onboardingProfile);
        navigate("/dashboard");
      } else {
        setError(res?.message || "Registration failed. Please check your details.");
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const allLearningStyles = [
    { name: "Verbal", desc: "Reading & written articles" },
    { name: "Aural", desc: "Podcasts & audio guides" },
    { name: "Kinesthetic", desc: "Interactive exercises & active practice" },
    { name: "Logical", desc: "Systems, structure & analytics" },
    { name: "Social", desc: "Cohort learning & discussion" },
    { name: "Solitary", desc: "Quiet study & deep solo focus" },
  ];

  const gradientBtn = { background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" };

  return (
    <div className="w-full min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-900/20 blur-[140px] pointer-events-none" />

      {/* Main Split-Screen Container */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        
        {/* ── LEFT COLUMN: AUTH FORM & TABS ── */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center space-y-6 bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-2xl">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-950" style={gradientBtn}>
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider uppercase text-white">
                  PACER <span className="text-purple-400">AI</span>
                </h1>
                <p className="text-zinc-400">Human Potential Curation Platform</p>
              </div>
            </div>
          </div>

          {/* Master Tabs: SIGN IN vs REGISTER */}
          <div className="flex p-1.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setError("");
                navigate("/signin");
              }}
              className={`flex-1 py-3 rounded-xl transition-all font-bold cursor-pointer text-center ${
                activeTab === "signin"
                  ? "text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
              style={activeTab === "signin" ? gradientBtn : {}}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError("");
                navigate("/signup");
              }}
              className={`flex-1 py-3 rounded-xl transition-all font-bold cursor-pointer text-center ${
                activeTab === "signup"
                  ? "text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
              style={activeTab === "signup" ? gradientBtn : {}}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 flex items-center gap-3 font-medium">
              <AlertCircle size={20} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ──────────────── TAB 1: SIGN IN FORM ──────────────── */}
          {activeTab === "signin" && (
            <div className="space-y-6">
              <form onSubmit={handleSignInSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-zinc-300 font-medium block">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-zinc-300 font-medium block">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/50 disabled:opacity-50"
                  style={gradientBtn}
                >
                  <span>{loading ? "Authenticating..." : "Sign In with Email"}</span>
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Separating Line */}
              <div className="relative flex items-center justify-center my-6">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-950 px-4 text-zinc-400 font-mono tracking-wider shrink-0 uppercase">
                  OR CONTINUE WITH
                </span>
                <div className="border-t border-zinc-800 w-full" />
              </div>

              {/* EXACTLY ONE Google OAuth Button */}
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setShowGoogleModal(true)}
                  useOneTap={false}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: REGISTER / QUESTIONNAIRE ──────────────── */}
          {activeTab === "signup" && (
            <div className="space-y-6">
              
              {/* Questionnaire Progress Bar (Step 1-5) */}
              {step > 0 && (
                <div className="space-y-2">
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(step / totalSteps) * 100}%`, ...gradientBtn }}
                    />
                  </div>
                  <div className="flex justify-between text-zinc-400 font-mono font-semibold">
                    <span>Profile Onboarding</span>
                    <span className="text-purple-400 font-bold">Step {step} of {totalSteps}</span>
                  </div>
                </div>
              )}

              {/* STEP 0: Credentials Input */}
              {step === 0 && (
                <div className="space-y-5">
                  <form onSubmit={handleStartQuestionnaire} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-zinc-300 font-medium block">Full Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="Your Name"
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-zinc-300 font-medium block">Email Address</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="name@domain.com"
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-zinc-300 font-medium block">Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="Create password (min 6 chars)"
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canProceedSignUp()}
                      className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-950/50 disabled:opacity-40"
                      style={gradientBtn}
                    >
                      <span>Proceed to Growth Profile</span>
                      <ArrowRight size={18} />
                    </button>
                  </form>

                  {/* Separating Line */}
                  <div className="relative flex items-center justify-center my-6">
                    <div className="border-t border-zinc-800 w-full" />
                    <span className="bg-zinc-950 px-4 text-zinc-400 font-mono tracking-wider shrink-0 uppercase">
                      OR REGISTER WITH GOOGLE
                    </span>
                    <div className="border-t border-zinc-800 w-full" />
                  </div>

                  {/* EXACTLY ONE Google Auth Component */}
                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setShowGoogleModal(true)}
                      useOneTap={false}
                      theme="filled_black"
                      shape="pill"
                      size="large"
                    />
                  </div>
                </div>
              )}

              {/* STEP 1: Current Self Nodes */}
              {step === 1 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-white">Select Current Characteristics ("Me")</h3>
                  <p className="text-zinc-400">Choose traits that describe your current state.</p>
                  
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={searchMe}
                      onChange={(e) => setSearchMe(e.target.value)}
                      placeholder="Search characteristics..."
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto p-2 border border-zinc-900 rounded-2xl">
                    {filteredMeList.map((item) => {
                      const sel = selectedCurrentSelf.includes(item.name);
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => toggleCurrentSelf(item.name)}
                          className={`px-4 py-2.5 rounded-2xl font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                            sel
                              ? "bg-purple-600 text-white border-purple-500 font-bold shadow-lg shadow-purple-950/40"
                              : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          {sel && <Check size={16} />}
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Imagine Self Nodes */}
              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-white">Select Imagine Self Attributes ("I Am")</h3>
                  <p className="text-zinc-400">Target identity attributes you aim to cultivate.</p>
                  
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={searchIAm}
                      onChange={(e) => setSearchIAm(e.target.value)}
                      placeholder="Search attributes..."
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto p-2 border border-zinc-900 rounded-2xl">
                    {filteredIAmList.map((item) => {
                      const sel = selectedImagineSelf.includes(item.name);
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => toggleImagineSelf(item.name)}
                          className={`px-4 py-2.5 rounded-2xl font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                            sel
                              ? "bg-purple-600 text-white border-purple-500 font-bold shadow-lg shadow-purple-950/40"
                              : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          {sel && <Check size={16} />}
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Learning Styles */}
              {step === 3 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-white">How do you learn best?</h3>
                  <p className="text-zinc-400">Select preferred learning channels.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allLearningStyles.map((style) => {
                      const sel = selectedLearningStyles.includes(style.name);
                      return (
                        <div
                          key={style.name}
                          onClick={() => toggleLearningStyle(style.name)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                            sel
                              ? "bg-purple-950/50 border-purple-500 text-white font-bold"
                              : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{style.name}</span>
                            {sel && <Check size={18} className="text-purple-400" />}
                          </div>
                          <p className="text-zinc-400 font-normal">{style.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: Growth Domains */}
              {step === 4 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-white">Focus Growth Domains</h3>
                  <p className="text-zinc-400">Select dimensions of life to optimize.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: "Career & Wealth", desc: "Financial independence & skill mastery." },
                      { title: "Mindset & Peace", desc: "Emotional regulation & clarity." },
                      { title: "Health & Vitality", desc: "Fitness & physical power." },
                      { title: "Creative Expression", desc: "Building & innovation." },
                      { title: "Relationships & Social", desc: "Deep connection & leadership." },
                    ].map((d) => {
                      const sel = selectedDomains.includes(d.title);
                      return (
                        <div
                          key={d.title}
                          onClick={() => toggleDomain(d.title)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                            sel
                              ? "bg-purple-950/50 border-purple-500 text-white font-bold"
                              : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{d.title}</span>
                            {sel && <Check size={18} className="text-purple-400" />}
                          </div>
                          <p className="text-zinc-400 font-normal">{d.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: Daily Commitment */}
              {step === 5 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-white">Daily Commitment Budget</h3>
                  <p className="text-zinc-400">Select micro-learning duration.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { minutes: 15, label: "15 min / day", tag: "Micro-Dose" },
                      { minutes: 30, label: "30 min / day", tag: "Recommended" },
                      { minutes: 45, label: "45 min / day", tag: "Deep Focus" },
                      { minutes: 60, label: "60+ min / day", tag: "Mastery" },
                    ].map((t) => {
                      const sel = dailyTime === t.minutes;
                      return (
                        <div
                          key={t.minutes}
                          onClick={() => setDailyTime(t.minutes)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            sel
                              ? "bg-purple-950/50 border-purple-500 text-white font-bold"
                              : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <span className="font-bold">{t.label}</span>
                          <span className="px-3 py-1 rounded-full bg-purple-900/60 text-purple-300 font-mono">
                            {t.tag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Controls for Step 1-5 */}
              {step > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="px-6 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-semibold hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  {step < totalSteps ? (
                    <button
                      type="button"
                      disabled={!canProceedSignUp()}
                      onClick={() => setStep((s) => s + 1)}
                      className="px-8 py-3 rounded-2xl font-bold text-white cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-950/50 disabled:opacity-40"
                      style={gradientBtn}
                    >
                      Continue
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canProceedSignUp() || loading}
                      onClick={handleFinalSignUpSubmit}
                      className="px-8 py-3 rounded-2xl font-bold text-white cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-950/50 disabled:opacity-40"
                      style={gradientBtn}
                    >
                      {loading ? "Registering..." : "Complete Registration"}
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dynamic Google Account Sign-In Modal */}
          {showGoogleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-md bg-zinc-900 border border-purple-500/40 p-6 rounded-3xl space-y-5 shadow-2xl relative">
                <button
                  onClick={() => setShowGoogleModal(false)}
                  className="absolute right-5 top-5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-3 text-purple-400 font-bold text-lg">
                  <ShieldCheck size={24} />
                  <span>Google Account Sign-In</span>
                </div>

                <p className="text-zinc-300">
                  Enter your Google Account details below to log in or register under your own account name:
                </p>

                <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 block font-medium">Google Account Email</label>
                    <input
                      type="email"
                      value={googleAccountEmail}
                      onChange={(e) => setGoogleAccountEmail(e.target.value)}
                      placeholder="alex.dev@gmail.com"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 outline-none focus:border-purple-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 block font-medium">Account Display Name (Optional)</label>
                    <input
                      type="text"
                      value={googleAccountName}
                      onChange={(e) => setGoogleAccountName(e.target.value)}
                      placeholder="Alex Dev"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 outline-none focus:border-purple-500 font-medium"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 rounded-xl text-white font-bold cursor-pointer shadow-lg shadow-purple-950/40"
                      style={gradientBtn}
                    >
                      {loading ? "Authenticating..." : "Sign In with Google Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(false)}
                      className="px-5 py-3.5 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: 3D PACER NEURAL CORE VISUAL ── */}
        <div className="lg:col-span-6 xl:col-span-7 hidden lg:block">
          <AuthVisual3D />
        </div>

      </div>
    </div>
  );
};

export const SignInPage: React.FC = () => <AuthPage initialTab="signin" />;
export const SignUpPage: React.FC = () => <AuthPage initialTab="signup" />;
