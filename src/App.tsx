import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import Suggestions from "./components/Suggestions";

enum Scene {
  Home = 1,
  Questions,
  Suggestions,
}

function App(): JSX.Element {
  const [scene, setScene] = useState<Scene>(Scene.Home);

  function handleSceneChange(sceneTo: Scene) {
    setScene(sceneTo);
  }

  const [choices, setChoice] = useState<{ [key: string]: string }>({});

  function handleSelectChoice(choiceType: string, choiceValue: string) {
    setChoice((state) => ({
      ...state,
      [choiceType]: choiceValue,
    }));
  }

  //Leaving this here incase we want button back later:
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
        <div className="results">
          <Suggestions choices={choices} />
        </div>
        <div id="tryagainButton">
          <button onClick={() => handleSceneChange(Scene.Home)}>
            Try Again
          </button>
        </div>
        <hr></hr>
        <div className="footer">
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
            <a href="https://getpresently.com" target="_blank" rel="noreferrer">
              getpresently.com
            </a>
          </p>
        </div>
      </div>
    );
  } else {
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
            <p>To get your personalized gift suggestions,</p>
            <p>simply answer these four quick questions:</p>
          </div>

          <div>
            <div id="container">
              <Questions handleSelectChoice={handleSelectChoice} />
            </div>
            <div id="submitButton">
              <button onClick={() => handleSceneChange(Scene.Suggestions)}>
                Submit
              </button>
            </div>
            <hr></hr>
          </div>

          <div className="footer">
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
