import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import Suggestions from "./components/Suggestions";
/*import Header from "./components/Header";*/
import Footer from "./components/Footer";
//import { getSystemErrorMap } from "util";
//import { on } from "events";

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

  // question: list of choices if Multi select
  // question: list of 1 choice is single select
  const [choices, setChoices] = useState<{ [key: string]: Set<string> }>({});

  // changes state depending if the choice is to be added/deleted, and if the question is single/multi select
  function handleSelectChoice(isSingleSelect: boolean, choiceType: string, choiceValue: string) {
    let newChoices = choices[choiceType];
    if (!newChoices) {
      newChoices = new Set<string>();
    }

    if (isSingleSelect) {
      if (newChoices.has(choiceValue)) {
        newChoices = new Set<string>();
      } else {
        newChoices = new Set<string>();
        newChoices.add(choiceValue);
      }
    } else {
      if (newChoices?.has(choiceValue)) {
        newChoices.delete(choiceValue);
      } else {
        newChoices.add(choiceValue);
      }
    }

    const newChoicesDict = {
      ...choices,
      [choiceType]: newChoices,
    };

    setChoices(newChoicesDict);
    console.log(newChoicesDict);
  }

  if (scene === Scene.Questions) {
    return (
      <div>
        {/*<Header />*/}
        <div className="instructions">
          <p>To get your personalized gift suggestions,</p>
          <p>simply answer these four quick questions:</p>
        </div>

        <div className="line">
          <hr></hr>
        </div>

        <div>
          <div id="container">
            <Questions handleSelectChoice={handleSelectChoice} choices={choices} />
          </div>
          <div id="submitButton">
            <button id="button_changeScene" onClick={() => handleSceneChange(Scene.Suggestions)}>
              SUBMIT
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (scene === Scene.Suggestions) {
    console.log(':::::::::::::' + JSON.stringify(choices));
    return (
      <div>
        {/*<Header />*/}
        <div className="results">
          <Suggestions choices={choices} />
        </div>
        <div id="backButton">
          <button id="button_changeScene" onClick={() => handleSceneChange(Scene.Home)}>
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
            {/*<Header />*/}
            <div className="titleContainer">
              <div className="App-title">
                <h1>GIFT PICKER</h1>
              </div>
              <div className="brand-description">
                <p>Helping you pick gifts for any recipient & occasion</p>
              </div>
            </div>
            <img className="logo" src="./App-logo.png" alt=""></img>
            <div id="startButton">
              <button id="button_changeScene" onClick={() => handleSceneChange(Scene.Questions)}>
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
