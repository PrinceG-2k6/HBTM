import axios from "axios";

// Dynamic base URL for Express Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
        "Unrelaxed", "Don't Believe In Myself", "Tired", "Lazy", "Absent-minded",
        "Small Faith", "Depressed", "In Debt", "Isolated", "Disconnected", "Dreamer",
        "Time Management", "Busy", "Exhausted", "Perfectionist", "Fitness Inconsistency",
        "Self-conscious", "Out Of Shape", "Burnt Out", "Creatively Stuck"
      ].map((n) => ({ name: n, type: "current", popular: true }));

      const imagineList = [
        "Confident", "Energetic", "Focused", "Disciplined", "Mindful", "Faithful",
        "Happy", "Wealthy", "Connected", "Present", "Healthy", "Active", "Peaceful",
        "Courageous", "Self-accepting", "Action-oriented", "Self-assured", "Imaginative",
        "Accountable", "Recharged"
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
};
