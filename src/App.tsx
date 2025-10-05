import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConsentBanner } from "@/components/ConsentBanner";
import { initializeAnalytics, trackPageview } from "@/utils/analytics";

// Lazy load all pages for consistent loading experience
const Home = lazy(() => import("@/pages/Home"));
const Contact = lazy(() => import("@/pages/Contact"));
const Playground = lazy(() => import("@/pages/PlaygroundSimple"));

function App() {
  // Initialize analytics on app start
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter>
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
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
