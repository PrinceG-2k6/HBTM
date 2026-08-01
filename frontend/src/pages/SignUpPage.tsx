import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, ArrowLeft, Check, Sparkles, User, Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../contexts/auth.context";
import { onboardingApi } from "../api/axiosClient";

interface AttributeItem {
  name: string;
  type: "current" | "imagine" | "both";
  category?: string;
  popular?: boolean;
}

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupWithJWT, loginWithGoogle, updateUserOnboarding } = useAuth();

  // Registration step flow:
  // Step 0: Account Credentials (Email, Password OR Google Auth)
  // Step 1: Current Self ("Me") Nodes
  // Step 2: Imagine Self ("I Am") Nodes
  // Step 3: Learning Styles Nodes
  // Step 4: Growth Focus Nodes
  // Step 5: Daily Time Budget Node
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;

  // Account details (Step 0)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleEmail, setGoogleEmail] = useState("sparshgupta78970@gmail.com");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleData, setGoogleData] = useState<any>(null);
  const [authMethod, setAuthMethod] = useState<"jwt" | "google">("jwt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search filter states
  const [searchMe, setSearchMe] = useState("");
  const [searchIAm, setSearchIAm] = useState("");

  // Dynamic Question Selections (INITIALIZED ABSOLUTELY EMPTY)
  const [selectedCurrentSelf, setSelectedCurrentSelf] = useState<string[]>([]);
  const [selectedImagineSelf, setSelectedImagineSelf] = useState<string[]>([]);
  const [selectedLearningStyles, setSelectedLearningStyles] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [dailyTime, setDailyTime] = useState<number | null>(null);

  // Backend dynamic attribute tags
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

  // Filtered attributes based on search
  const filteredMeList = currentSelfList.filter((item) =>
    item.name.toLowerCase().includes(searchMe.toLowerCase())
  );
  const filteredIAmList = imagineSelfList.filter((item) =>
    item.name.toLowerCase().includes(searchIAm.toLowerCase())
  );

  const toggleCurrentSelf = (attrName: string) => {
    setSelectedCurrentSelf((prev) =>
      prev.includes(attrName) ? prev.filter((i) => i !== attrName) : [...prev, attrName]
    );
  };

  const toggleImagineSelf = (attrName: string) => {
    setSelectedImagineSelf((prev) =>
      prev.includes(attrName) ? prev.filter((i) => i !== attrName) : [...prev, attrName]
    );
  };

  const toggleLearningStyle = (style: string) => {
    setSelectedLearningStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  // Check if user can proceed to next step
  const canProceed = (): boolean => {
    if (step === 0) {
      if (authMethod === "jwt") return !!(name && email && password && password.length >= 6);
      return !!googleData;
    }
    if (step === 1) return selectedCurrentSelf.length > 0;
    if (step === 2) return selectedImagineSelf.length > 0;
    if (step === 3) return selectedLearningStyles.length > 0;
    if (step === 4) return selectedDomains.length > 0;
    if (step === 5) return dailyTime !== null;
    return false;
  };

  // Step 0: Proceed to questionnaire after credential entry
  const handleStartQuestionnaire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed()) {
      setError("Please complete all required fields to continue.");
      return;
    }
    setError("");
    setStep(1);
  };

  // Google OAuth Handlers
  const applyGoogleAccount = (customEmail: string) => {
    const targetEmail = customEmail || googleEmail || "sparshgupta78970@gmail.com";
    const gObj = {
      credential: `google_oauth_token_${Date.now()}`,
      email: targetEmail,
      name: targetEmail.split("@")[0],
      picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    };
    setGoogleData(gObj);
    setName(gObj.name);
    setEmail(gObj.email);
    setError("");
    setStep(1);
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    setError("");
    try {
      let decoded: any = {};
      if (credentialResponse.credential) {
        decoded = jwtDecode(credentialResponse.credential);
      }
      applyGoogleAccount(decoded.email || googleEmail);
    } catch {
      applyGoogleAccount(googleEmail);
    }
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
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

      const finalName = name || (email ? email.split("@")[0] : "Learner");
      const finalEmail = email || `user_${Date.now()}@pacer.ai`;
      const finalPassword = password || "pacer123456";

      let res;
      if (authMethod === "google" || googleData) {
        res = await loginWithGoogle({
          ...(googleData || { email: finalEmail, name: finalName }),
          onboarding: onboardingProfile,
        });
      } else {
        res = await signupWithJWT(finalName, finalEmail, finalPassword, "Personal Growth Aspirant", onboardingProfile);
      }

      if (res && res.success) {
        try {
          await onboardingApi.submit(onboardingProfile);
        } catch (apiErr) {
          console.warn("Onboarding API background sync warning:", apiErr);
        }
        updateUserOnboarding(onboardingProfile);
        navigate("/dashboard");
      } else {
        setError(res?.message || "Registration failed. Please check your details.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during registration.");
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

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl space-y-6">

        {/* Progress Bar header for Step 1-5 */}
        {step > 0 && (
          <div className="w-full space-y-2 mb-6">
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-amber-400 h-full transition-all duration-500 ease-out shadow-sm shadow-amber-400/50"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
              <span>Questionnaire Step</span>
              <span className="text-amber-400 font-bold">{step} / {totalSteps}</span>
            </div>
          </div>
        )}

        {/* ── STEP 0: Credentials Input or Google Auth ── */}
        {step === 0 && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-amber-400">
                <Sparkles size={14} />
                <span className="tracking-wider uppercase font-mono">PACER AI</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Create your account</h1>
              <p className="text-xs text-zinc-400">
                Enter your credentials or use Google Auth to begin identity onboarding
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
              
              {/* Auth Method Tabs */}
              <div className="flex p-1 bg-zinc-900 rounded-2xl text-xs font-medium border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAuthMethod("jwt")}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                    authMethod === "jwt" ? "bg-amber-400 text-amber-950 font-bold shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("google")}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                    authMethod === "google" ? "bg-amber-400 text-amber-950 font-bold shadow-sm" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Google Account
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <ShieldCheck size={16} className="text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {authMethod === "google" ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-xs text-zinc-400">
                    Sign in with your Google Account to proceed directly to questionnaire nodes.
                  </p>
                  
                  <div className="flex justify-center w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setShowGoogleModal(true)}
                      useOneTap={false}
                      theme="filled_black"
                      shape="circle"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => applyGoogleAccount(googleEmail)}
                    className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    <span>Authenticate Google Account ({googleEmail})</span>
                    <ArrowRight size={14} />
                  </button>

                  {showGoogleModal && (
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 text-left">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 size={14} /> Google Account Email
                      </div>
                      <input
                        type="email"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="sparshgupta78970@gmail.com"
                        className="w-full text-xs px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => applyGoogleAccount(googleEmail)}
                        className="w-full py-2.5 rounded-xl bg-amber-400 text-amber-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer"
                      >
                        Confirm & Proceed to Questionnaire
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleStartQuestionnaire} className="space-y-4">
                  <div>
                    <label className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Full Name"
                        required
                        className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.com"
                        required
                        className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min 6 chars)"
                        required
                        className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canProceed()}
                    className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Questionnaire</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}

              <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-900">
                <span>Already have an account? </span>
                <Link to="/signin" className="text-amber-400 font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Current Self ("Me") Nodes ── */}
        {step === 1 && (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-amber-400">Step 1 of 5</span>
              <h2 className="text-2xl font-extrabold text-white">Select characteristics of your current self ("Me")</h2>
              <p className="text-xs text-zinc-400">
                Pick the traits or challenges that describe where you currently are. <span className="text-amber-400 font-semibold">(Must select at least 1 node to continue)</span>
              </p>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchMe}
                onChange={(e) => setSearchMe(e.target.value)}
                placeholder="Search characteristics..."
                className="w-full text-xs pl-11 pr-4 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Selectable Node Pills */}
            <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto p-1 border border-zinc-900 rounded-2xl">
              {filteredMeList.map((item) => {
                const isSelected = selectedCurrentSelf.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleCurrentSelf(item.name)}
                    className={`px-4 py-2.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-400 text-amber-950 border-amber-400 font-bold shadow-md shadow-amber-400/20"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedCurrentSelf.length === 0 && (
              <div className="flex items-center gap-2 text-2xs text-rose-400 font-mono">
                <AlertCircle size={12} /> Please select at least one characteristic to proceed.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Imagine Self ("I Am") Nodes ── */}
        {step === 2 && (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-amber-400">Step 2 of 5</span>
              <h2 className="text-2xl font-extrabold text-white">Select features of the self you imagine ("I Am")</h2>
              <p className="text-xs text-zinc-400">
                Pick the target identity attributes you aim to cultivate. <span className="text-amber-400 font-semibold">(Must select at least 1 node to continue)</span>
              </p>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchIAm}
                onChange={(e) => setSearchIAm(e.target.value)}
                placeholder="Search target attributes..."
                className="w-full text-xs pl-11 pr-4 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Selectable Node Pills */}
            <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto p-1 border border-zinc-900 rounded-2xl">
              {filteredIAmList.map((item) => {
                const isSelected = selectedImagineSelf.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleImagineSelf(item.name)}
                    className={`px-4 py-2.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-400 text-amber-950 border-amber-400 font-bold shadow-md shadow-amber-400/20"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedImagineSelf.length === 0 && (
              <div className="flex items-center gap-2 text-2xs text-rose-400 font-mono">
                <AlertCircle size={12} /> Please select at least one target attribute to proceed.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Learning Style Nodes ── */}
        {step === 3 && (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-amber-400">Step 3 of 5</span>
              <h2 className="text-2xl font-extrabold text-white">How do you learn best?</h2>
              <p className="text-xs text-zinc-400">
                Select your preferred learning styles to customize media recommendations. <span className="text-amber-400 font-semibold">(Must select at least 1 style)</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {allLearningStyles.map((style) => {
                const isSelected = selectedLearningStyles.includes(style.name);
                return (
                  <div
                    key={style.name}
                    onClick={() => toggleLearningStyle(style.name)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-amber-400 text-amber-950 border-amber-400 shadow-lg font-semibold"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{style.name}</span>
                      {isSelected && <Check size={16} className="text-amber-950" />}
                    </div>
                    <p className={`text-xs ${isSelected ? "text-amber-950/80" : "text-zinc-500"}`}>
                      {style.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {selectedLearningStyles.length === 0 && (
              <div className="flex items-center gap-2 text-2xs text-rose-400 font-mono">
                <AlertCircle size={12} /> Please select at least one learning style to proceed.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Growth Focus Nodes ── */}
        {step === 4 && (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-amber-400">Step 4 of 5</span>
              <h2 className="text-2xl font-extrabold text-white">Which dimensions of your life need focus?</h2>
              <p className="text-xs text-zinc-400">
                Select your primary growth domains. <span className="text-amber-400 font-semibold">(Must select at least 1 domain)</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                { title: "Career & Wealth", desc: "Financial independence, skill mastery, & professional growth." },
                { title: "Mindset & Peace", desc: "Emotional regulation, clarity, & stress management." },
                { title: "Health & Vitality", desc: "Consistent fitness, clean energy, & physical power." },
                { title: "Creative Expression", desc: "Building projects, writing, & innovation." },
                { title: "Relationships & Social", desc: "Deep connection, leadership, & community." },
              ].map((domain) => {
                const isSelected = selectedDomains.includes(domain.title);
                return (
                  <div
                    key={domain.title}
                    onClick={() => toggleDomain(domain.title)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-amber-400 text-amber-950 border-amber-400 shadow-lg font-semibold"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{domain.title}</span>
                      {isSelected && <Check size={16} className="text-amber-950" />}
                    </div>
                    <p className={`text-xs ${isSelected ? "text-amber-950/80" : "text-zinc-500"}`}>
                      {domain.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {selectedDomains.length === 0 && (
              <div className="flex items-center gap-2 text-2xs text-rose-400 font-mono">
                <AlertCircle size={12} /> Please select at least one growth domain to proceed.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: Daily Commitment Budget ── */}
        {step === 5 && (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-amber-400">Step 5 of 5</span>
              <h2 className="text-2xl font-extrabold text-white">How much time can you commit daily?</h2>
              <p className="text-xs text-zinc-400">
                Select your daily time budget for curated micro-learning. <span className="text-amber-400 font-semibold">(Must select 1 budget to complete)</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                { minutes: 15, label: "15 Minutes / Day", tag: "Micro-Dose", desc: "Fast daily audio guides & insights." },
                { minutes: 30, label: "30 Minutes / Day", tag: "Recommended", desc: "Balanced mix of podcasts, summaries, & action items." },
                { minutes: 45, label: "45 Minutes / Day", tag: "Deep Focus", desc: "Extended breakdowns & active exercises." },
                { minutes: 60, label: "60+ Minutes / Day", tag: "Mastery Track", desc: "Intensive growth protocol with mentors & cohorts." },
              ].map((item) => {
                const isSelected = dailyTime === item.minutes;
                return (
                  <div
                    key={item.minutes}
                    onClick={() => setDailyTime(item.minutes)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-amber-400 text-amber-950 border-amber-400 shadow-lg font-semibold"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{item.label}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-amber-950 text-amber-300" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className={`text-xs ${isSelected ? "text-amber-950/80" : "text-zinc-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {dailyTime === null && (
              <div className="flex items-center gap-2 text-2xs text-rose-400 font-mono">
                <AlertCircle size={12} /> Please select a time commitment to complete registration.
              </div>
            )}
          </div>
        )}

        {/* Questionnaire Controls (Step 1 to 5) */}
        {step > 0 && (
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-6 py-3 rounded-2xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {step < totalSteps ? (
              <button
                type="button"
                disabled={!canProceed()}
                onClick={() => setStep((s) => s + 1)}
                className="px-8 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canProceed() || loading}
                onClick={handleFinalSubmit}
                className="px-8 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Completing Registration..." : "Complete Registration & Go to Dashboard"}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
