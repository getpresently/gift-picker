import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import Suggestions from "./components/Suggestions";

enum Scene {
  Home = 1,
  Questions,
  Suggestions,
}

// Added any type to fix typescript errors
function App(): JSX.Element {
  const [scene, setScene] = useState<Scene>(Scene.Home);

  function handleSceneChange(sceneTo: Scene) {
    setScene(sceneTo);
  }

  if (scene === Scene.Questions) {
    return (
      <div>
        <Questions />
        <br></br>
        <button onClick={() => handleSceneChange(Scene.Suggestions)}>Submit</button>
      </div>
    );
  } else if (scene === Scene.Suggestions) {
    return (
      <div>
        <Suggestions />
      </div>
    );

  } else {
    // App title page and data should render below
    // I want to move the rendered data to the very bottom of the page instead (below quiz structure)
    // Quiz structure is in index.html but not sure if it should be moved to App.tsx
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">GIFT PICKER 🎁</h1>
            <div className="Presently-logo">
            <p>
              By{" "}
              <a
                href="https://getpresently.com"
                target="_blank"
                rel="noreferrer"
              >
                Presently
              </a>{" "}
              💜
            </p>
            <p>Helping you pick the perfect gift for any occasion</p>
            </div>
            <br></br>
            <button onClick={() => handleSceneChange(Scene.Questions)}>Get Started</button>
          </header>
        </div>
        <div></div>
      </div>
    );
  }
}

export default App;
