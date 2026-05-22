import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Landing } from "./components/Landing";
import { Quiz } from "./components/Quiz";
import { Results } from "./components/Results";

/**
 * Reset scroll position to the top whenever the route changes. Without
 * this, navigating from a scrolled-down Landing → /quiz lands the user
 * mid-page on the new screen, which is jarring on mobile.
 */
function ScrollToTop(): null {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function App(): JSX.Element {
  return (
    <div className="App">
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          {/* Catch-all: any unknown route falls back to Landing. SPA fallback at the
              Cloudflare worker means /quiz, /results, deep links all hit React Router first. */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
