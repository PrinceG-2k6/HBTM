import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { LandingPage } from "./pages/LandingPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CurationPage } from "./pages/CurationPage";
import { SandboxPage } from "./pages/SandboxPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { AIChatPage } from "./pages/AIChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ShopPage } from "./pages/ShopPage";
import { WindowWidthProvider } from "./contexts/windowWidth.context";
import { AuthProvider } from "./contexts/auth.context";

const APP_PAGES = ["/dashboard", "/curation", "/sandbox", "/reviews", "/ai-chat", "/profile", "/shop"];

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
    <div className="w-full min-h-screen bg-[#141416] text-zinc-100 font-sans antialiased">
      {/* Sidebar for app pages */}
      {isAppPage && <Sidebar />}

      <main
        className={
          isAppPage
            ? "md:ml-[220px] ml-0 pt-18 md:pt-6 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 min-h-screen transition-all duration-300"
            : isAuthPage
              ? "min-h-screen"
              : "min-h-screen w-full"
        }
        id="main-content"
      >
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/curation" element={<CurationPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/shop" element={<ShopPage />} />
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