import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { GiftPage } from "./components/GiftPage";
import { PrivacyPage, TermsPage } from "./components/Legal";
import { Review } from "./components/Review";
import { Landing } from "./components/Landing";
import { Quiz } from "./components/Quiz";
import { Results } from "./components/Results";
import { pageview } from "./data/analytics";

/**
 * Per-route side effects: (1) reset scroll position to the top so the
 * next screen doesn't open mid-page, and (2) fire a GA page_view event
 * so SPA navigations are tracked. Manual tracking because gtag's
 * implicit page_view is disabled in index.html, see analytics.ts.
 */
function RouteEffects(): null {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    pageview(pathname + search);
  }, [pathname, search]);
  return null;
}

function App(): JSX.Element {
  return (
    <div className="App">
      <Router>
        <RouteEffects />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          {/* Shareable, crawler-indexable page per gift. The worker
              prerenders meta + static content for these URLs. */}
          <Route path="/gift/:giftId" element={<GiftPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* Internal, password-gated catalog review tool (noindex via worker + robots). */}
          <Route path="/review" element={<Review />} />
          {/* Catch-all: any unknown route falls back to Landing. SPA fallback at the
              Cloudflare worker means /quiz, /results, deep links all hit React Router first. */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
