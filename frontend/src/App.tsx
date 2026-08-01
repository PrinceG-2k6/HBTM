import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/header/header";
import { LandingPage } from "./pages/LandingPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { InsightsPage } from "./pages/InsightsPage";
import { LearningProfilePage } from "./pages/LearningProfilePage";
import { LearningLabPage } from "./pages/LearningLabPage";
import { FutureSelfPage } from "./pages/FutureSelfPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { WindowWidthProvider } from "./contexts/windowWidth.context";
import { AuthProvider } from "./contexts/auth.context";

const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  return null;
};

const AppContent = () => (
  <div className="w-full min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-amber-400 selection:text-amber-950">
    <Header />
    <main className="px-3 sm:px-6 pt-24 pb-12">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/analysis" element={<InsightsPage />} />
        <Route path="/learning-profile" element={<LearningProfilePage />} />
        <Route path="/memory" element={<LearningProfilePage />} />
        <Route path="/learning-lab" element={<LearningLabPage />} />
        <Route path="/visualizer" element={<LearningLabPage />} />
        <Route path="/future-self" element={<FutureSelfPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
      </Routes>
    </main>
  </div>
);

const App = () => (
  <AuthProvider>
    <WindowWidthProvider>
      <Router>
        <AppContent />
      </Router>
    </WindowWidthProvider>
  </AuthProvider>
);

export default App;