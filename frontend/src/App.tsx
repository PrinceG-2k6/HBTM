import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/header/header";
import { Sidebar } from "./components/layout/Sidebar";
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
import { AIChatPage } from "./pages/AIChatPage";
import { WindowWidthProvider } from "./contexts/windowWidth.context";
import { AuthProvider } from "./contexts/auth.context";

const APP_PAGES = ["/dashboard", "/ai-chat", "/roadmap", "/insights", "/analysis", "/learning-profile", "/memory", "/learning-lab", "/visualizer", "/future-self", "/opportunities", "/achievements"];

const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isAppPage = APP_PAGES.some(p => location.pathname.startsWith(p));
  const isAuthPage = ["/signin", "/signup"].includes(location.pathname);

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-zinc-100 font-sans antialiased">
      {/* Show top header only on landing / auth pages */}
      {!isAppPage && <Header />}

      {/* Sidebar for app pages */}
      {isAppPage && <Sidebar />}

      <main
        className={
          isAppPage
            ? "transition-all duration-300 min-h-screen"
            : isAuthPage
            ? ""
            : "px-3 sm:px-6 pt-24 pb-12"
        }
        style={isAppPage ? { marginLeft: "220px", padding: "28px 32px", paddingBottom: "48px" } : {}}
        id="main-content"
      >
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
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
};

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