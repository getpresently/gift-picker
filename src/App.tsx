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

  // Leaving this here incase we want button back later

  //if (scene === Scene.Questions) {
    //return (
      //<div>
        //<Questions />
        //<br></br>
        //<button onClick={() => handleSceneChange(Scene.Suggestions)}>Submit</button>
      //</div>
    //);
  if (scene === Scene.Suggestions) {
    return (
      <div>
        <div>
          <Suggestions />
          <button onClick={() => handleSceneChange(Scene.Home)}>Try Again</button>
        </div>
        <div className="footer">
        <hr></hr>
          <p>
          <a 
            href="mailto: qali@presently.fun"
            target="_blank"
            rel="noreferrer"
          >
              qali@presently.fun
          </a>
          </p>
          <p>
          <a 
            href="https://getpresently.com"
            target="_blank"
            rel="noreferrer"
          >
            getpresently.com
          </a>
          </p>
        </div>
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
            <h1 className="App-title">GIFT PICKER</h1>
            <div className="Presently-logo">
            <p>
              By{" "}
              <a
                href="https://getpresently.com"
                target="_blank"
                rel="noreferrer"
              >
                Presently
              </a>
            </p>
            <p>Helping you pick the perfect gift for any occasion</p>
            </div>
            <img className="logo" src="./gift-logo.png" alt=""></img>
            <br></br>
            <img className="arrow" src="./arrow-down.png" alt=""></img>
          </header>

          <div className="instructions">
            <br></br>
            <p>To get your personalized gift suggestions, simply answer these four quick questions:</p>
            <br></br>
          </div>

            <div>
              <div>
              <Questions />
              </div>
              <br></br>
              <button onClick={() => handleSceneChange(Scene.Suggestions)}>Submit</button>
              <br></br>
              <br></br>

            </div>

          <div className="footer">
            <hr></hr>
            <p>
              <a 
              href="mailto: qali@presently.fun"
              target="_blank"
              rel="noreferrer"
              >
                qali@presently.fun
              </a>
            </p>
            <p>
              <a 
              href="https://getpresently.com"
              target="_blank"
              rel="noreferrer"
              >
                getpresently.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
