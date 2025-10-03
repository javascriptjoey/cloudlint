import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";

// Lazy load route components for better code splitting
const About = lazy(() => import("@/pages/About"));
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
              <Route path="/" element={<About />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
