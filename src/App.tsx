import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Lazy load route components for better code splitting
const Home = lazy(() => import("@/pages/Home"));
const Contact = lazy(() => import("@/pages/Contact"));
const Playground = lazy(() => import("@/pages/PlaygroundSimple"));

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Navbar />
        <main>
          <Suspense
            fallback={
              <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse h-32 bg-muted rounded"></div>
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
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
