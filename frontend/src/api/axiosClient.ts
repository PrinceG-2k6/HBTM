import axios from "axios";

// Dynamic base URL for Express Backend (Ensures /api prefix is always present)
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api`;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token dynamically to all outgoing requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("hbtm_token") || localStorage.getItem("pacer_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("hbtm_token", token);
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("hbtm_token");
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

export const authApi = {
  register: async (data: { name: string; email: string; password?: string; role?: string; onboarding?: any }) => {
    const res = await axiosInstance.post("/auth/register", data);
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },
  login: async (data: { email: string; password?: string }) => {
    const res = await axiosInstance.post("/auth/login", data);
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },
  googleAuth: async (data: { googleToken?: string; credential?: string; email?: string; name?: string; avatarUrl?: string; picture?: string; onboarding?: any }) => {
    const res = await axiosInstance.post("/auth/google", data);
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },
  getMe: async () => {
    try {
      const res = await axiosInstance.get("/auth/me");
      return res.data.user;
    } catch {
      return null;
    }
  },
};

export const onboardingApi = {
  getAttributes: async (search?: string, type?: string) => {
    try {
      const res = await axiosInstance.get("/onboarding/attributes", { params: { search, type } });
      return res.data;
    } catch {
      const currentList = [
        "Unrelaxed", "Don't Believe In Myself", "Tired", "Lazy", "Absent-minded", "Small Faith", "Depressed", "In Debt", "Isolated", "Disconnected", "Dreamer", "Time Management", "Busy", "Exhausted", "Perfectionist", "Fitness Inconsistency", "Self-conscious", "Out Of Shape", "Burnt Out", "Creatively Stuck", "Procrastination", "Skilled", "Easily Distracted", "Stressed", "Analytical", "Afraid Of Failure", "Impatient", "Comfortable", "Introvert", "Sluggish", "Ashamed Of Past", "Misunderstood", "Burdened", "I Want It Now Without Work", "Struggle To Execute Ideas", "Undisciplined", "Creator", "Directionless", "Frustrated", "Not Social", "Fearful", "Lonely", "Self-critical", "Self-doubt", "Inconsistent", "Overstimulated", "Overwhelmed", "Unproductive", "Defensive", "Distracted", "Outcome-obsessed", "Stuck", "Anxious", "Inactive", "Unstructured", "Impulsive", "Nervous", "Restless", "Shy", "Unbalanced", "Extrovert", "Financially Impulsive", "Joker", "Dehydrated", "Doubtful", "Frazzled", "Hesitant", "Insecure", "Discouraged", "Fixed Mindset", "Fatigued", "Jealous", "Tense", "Unconfident", "Unfulfilled", "Unsettled", "Disorganized", "Irritable", "Motivation", "Over-consuming", "Running Late", "Sleep-deprived", "Striving", "Uncertain", "Unfit", "Unmotivated", "Excuse-making", "Low-mood", "Negative", "Panicked", "Worrisome", "Artist", "Foggy", "Hidden", "Indecisive", "Masked", "Numb", "Afraid", "Avoidant", "Controlling", "Guarded", "Lacks Expertise", "Rigid", "Skeptical", "Uninformed", "Uninspired", "Blocked", "Chaotic", "Dependent", "Reactive", "Risk-averse", "Self-centered", "Unfocused", "Ashamed", "Mindless", "Overworks", "Pessimistic", "Short-sighted", "Short-term", "Stagnant", "Uncreative", "Unimaginative", "Withdrawn", "Argumentative", "Arrogant", "Bitter", "Consumed", "Depleted", "Detached", "Limited", "Passive", "Scarcity-minded", "Sedentary", "Stop-start", "Disengaged", "Frozen", "Imitative", "Scattered", "Timid", "Apathetic", "Complacent", "Dd"
      ].map((n) => ({ name: n, type: "current", popular: true }));

      const imagineList = [
        "Confident", "Energetic", "Focused", "Disciplined", "Mindful", "Faithful", "Happy", "Wealthy", "Connected", "Present", "Healthy", "Active", "Peaceful", "Courageous", "Self-accepting", "Action-oriented", "Self-assured", "Imaginative", "Accountable", "Recharged", "Growth Mindset", "Visionary", "My Highest Self", "Growing", "Value-driven", "Well-organized", "Actualize My Dreams", "Health-oriented", "Unstoppable", "Open-minded", "Financially Literate", "Calm", "Balanced", "Positive", "Wise", "Confident Speaker", "Organized", "Evolving", "Humble", "A Great Business Person", "Tech Leader", "Creative", "Friendly", "Productive", "Stylish", "Empowered", "Grateful", "Self-trusting", "Supportive", "Adventurous", "Ownership Mindset", "Proactive", "Capable", "Earning From Creativity", "Optimistic", "Well Dressed", "Bold", "Empathetic", "Purposeful", "Motivated", "Creatively Free", "Forward-thinking", "Patient", "Aware", "Curious", "Daring", "Hydrated", "Understanding", "Young & Hungry", "Athletic", "Playful", "Accepting", "Adaptable", "Be A Calm Storm", "Fearless", "Brave", "Energized", "Aligned", "Efficient", "Resilient", "Self-directed", "Self-grounded", "Strategic", "Compassionate", "Experimental", "Free", "Grounded", "Momentum Building", "Process-driven", "Secure", "Steady", "Visionary Product Creator", "Authentic", "Composed", "Encouraged", "Hopeful", "Inspired", "Persistent", "Resourceful", "A Better Parent", "Alert", "Committed", "Forgiving", "Intentional", "Punctual", "Trusting", "Abundant", "Collected", "Controlled", "Emotionally Expressive", "Habitual", "Masterful", "Prepared", "Process-loyal", "Regulated", "Relentless", "Social", "Content", "Discerning", "Expressive", "Fulfilled", "Moving", "Nourished", "Rested", "Safe", "Self-regulated", "Structured", "Ux Pro", "Warm", "Communal", "Decisive", "Deliberate", "Engaged", "Immersed", "Informed", "Open", "Reflective", "Vital", "Articulate", "Assertive", "Centered", "Liberated", "Light", "Serene", "Steadfast", "Supported", "Uplifted", "Expansive", "Relational", "Fluid", "Inventive"
      ].map((n) => ({ name: n, type: "imagine", popular: true }));

      let cur = currentList;
      let img = imagineList;

      if (search) {
        const s = search.toLowerCase();
        cur = cur.filter(x => x.name.toLowerCase().includes(s));
        img = img.filter(x => x.name.toLowerCase().includes(s));
      }

      return { total: cur.length + img.length, currentSelf: cur, imagineSelf: img };
    }
  },
  getQuestions: async () => {
    const res = await axiosInstance.get("/onboarding/questions");
    return res.data.questions;
  },
  submit: async (data: any) => {
    const res = await axiosInstance.post("/onboarding/submit", data);
    return res.data;
  },
};

export const curationApi = {
  getFeed: async () => {
    const res = await axiosInstance.get("/curation/feed");
    return res.data;
  },
  markContentComplete: async (data: { url: string; title: string; content_type: string; platform: string; skill_name?: string }) => {
    const res = await axiosInstance.post("/curation/complete", data);
    return res.data;
  },
};
