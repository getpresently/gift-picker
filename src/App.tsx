import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Landing } from "./components/Landing";
import { Quiz } from "./components/Quiz";
import { Results } from "./components/Results";

function App(): JSX.Element {
  return (
    <div className="App">
      <Router>
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
