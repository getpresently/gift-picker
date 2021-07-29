import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";

enum Scene {
  Home = 1,
  Questions,
}

// Added any type to fix typescript errors
function App(): JSX.Element {
  const [scene, setScene] = useState<Scene>(Scene.Home);

  function handleSceneChange(sceneTo: number) {
    setScene(Scene[sceneTo]);
  }

  // App title page and data should render below
  // I want to move the rendered data to the very bottom of the page instead (below quiz structure)
  // Quiz structure is in index.html but not sure if it should be moved to App.tsx

  if (scene === Scene.Home) {
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">GIFT PICKER 🎁</h1>
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
          </header>

          <button onClick={() => handleSceneChange(2)}>Go to Questions</button>
        </div>
        <div></div>
      </div>
    );
  } else if (scene === Scene.Questions) {
    return (
      <div>
        <Questions />
      </div>
    );
  }
}

export default App;
