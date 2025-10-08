import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConsentBanner } from "@/components/ConsentBanner";
import { PrivacyCenter } from "@/components/PrivacyCenter";
import { initializeAnalytics, trackPageview } from "@/utils/analytics";

// Lazy load all pages for consistent loading experience
const Home = lazy(() => import("@/pages/Home"));
const Contact = lazy(() => import("@/pages/Contact"));
const Playground = lazy(() => import("@/pages/PlaygroundSimple"));

function App() {
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState(false);

  // Initialize analytics on app start
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Navbar />
        <main>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Toaster />
        <ConsentBanner
          domain={import.meta.env.VITE_PLAUSIBLE_DOMAIN || "cloudlint.local"}
          onAccept={() => {
            // Track initial pageview when analytics is accepted
            trackPageview();
          }}
          onPrivacyClick={() => setIsPrivacyCenterOpen(true)}
        />
        <PrivacyCenter
          isOpen={isPrivacyCenterOpen}
          onClose={() => setIsPrivacyCenterOpen(false)}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
