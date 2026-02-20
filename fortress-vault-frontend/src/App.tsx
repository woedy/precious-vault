import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import BuyPage from "./pages/BuyPage";
import SellPage from "./pages/SellPage";
import VaultsPage from "./pages/VaultsPage";
import ConvertPage from "./pages/ConvertPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import NotFound from "./pages/NotFound";
import { MockAppProvider } from "./context/MockAppContext";
import { AuthProvider } from "./context/AuthContext";
import OnboardingPage from "./pages/OnboardingPage";
import DeliveryPage from "./pages/DeliveryPage";
import DepositPage from './pages/DepositPage';
import TrackingPage from "./pages/TrackingPage";
import AboutPage from "./pages/company/AboutPage";
import CareersPage from "./pages/company/CareersPage";
import PressPage from "./pages/company/PressPage";
import ContactPage from "./pages/company/ContactPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import TermsPage from "./pages/legal/TermsPage";
import CookiePolicyPage from "./pages/legal/CookiePolicyPage";
import SupportChatPage from "./pages/SupportChatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MockAppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} /> {/* New Route */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/buy" element={<BuyPage />} />
              <Route path="/sell" element={<SellPage />} />
              <Route path="/vaults" element={<VaultsPage />} />
              <Route path="/convert" element={<ConvertPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/deposit" element={<DepositPage />} />
              <Route path="/track" element={<TrackingPage />} />
              <Route path="/support/chat" element={<SupportChatPage />} />

              {/* Company Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Legal Pages */}
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MockAppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
