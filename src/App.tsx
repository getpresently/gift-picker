import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import Suggestions from "./components/Suggestions";
import Footer from "./components/Footer";

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
  if (scene === Scene.Questions) {
  return (
    <div>
    <div className="instructions">
      <p>To get your personalized gift suggestions,</p>
      <p>simply answer these four quick questions:</p>
    </div>

    <div className="line">
      <hr></hr>
    </div>

    <div>
      <div id="container">
        <Questions handleSelectChoice={handleSelectChoice} />
      </div>
      <div id="submitButton">
        <button onClick={() => handleSceneChange(Scene.Suggestions)}>
          SUBMIT
        </button>
      </div>
    </div>
    <Footer />
    </div>
    );
  } 
  
  if (scene === Scene.Suggestions) {
    return (
      <div>
        <div className="results">
          <Suggestions choices={choices} />
        </div>
        <div id="backButton">
          <button onClick={() => handleSceneChange(Scene.Home)}>
            HOME
          </button>
        </div>
        <Footer />
      </div>
    );
  } else {
    return (
      <div>
        <div className="App">
          <header className="App-header">
            <div className="titleContainer">
              <div className="App-title">
                <h1>GIFT PICKER</h1>
              </div>
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
              </div>
              <div className="brand-description">
                <p>Helping you pick gifts for any recipient & occasion</p>
              </div>
            </div>
            <img className="logo" src="./gift-logo.png" alt=""></img>
            <div id="startButton">
              <button onClick={() => handleSceneChange(Scene.Questions)}>
                START QUIZ
              </button>
            </div>
          </header>
          <Footer />
        </div>  
      </div>
    );
  };
}

export default App;
