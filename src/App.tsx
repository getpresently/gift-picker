import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import ScrollablePage from "./components/ScrollablePage";
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

  // choices[question]: set of choices if key is multi select question identifier
  // choices[question]: set of size 1 if key is single select question identifier
  const [choices, setChoices] = useState<{ [key: string]: Set<string> }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const numPages = 4;

  function handleNextPage(newVal: number) {
    if (newVal < numPages) {
      setCurrentPage(newVal + 1);
    }
  }

  function handleLastPage(newVal: number) {
    if (newVal > 1) {
      setCurrentPage(newVal - 1);
    }
  }
  

  // changes state depending on if the question is single/multi select
  // removes from state if previously selected, adds to state if new
  function handleSelectChoice(
    isSingleSelect: boolean,
    choiceType: string,
    choiceValue: string
  ) {
    let newChoices = choices[choiceType] || new Set<string>();

    if (isSingleSelect) {
      if (newChoices.has(choiceValue)) {
        newChoices.clear();
      } else {
        newChoices.clear();
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
  }

  var question = (
    <Questions handleSelectChoice={handleSelectChoice} page={currentPage} choices={choices}/>
  );
  var page = <ScrollablePage childComp={question}></ScrollablePage>;

  var buttons;
  if (currentPage === 1) {
    buttons = (
      <div id="nextButton">
        <button
          id="button_changeScene"
          onClick={() => handleNextPage(currentPage)}
        >
          Next
        </button>
      </div>
    );
  } else if (currentPage === numPages) {
    buttons = (
      <div>
        <div id="previousButton">
          <button
            id="button_changeScene"
            onClick={() => handleLastPage(currentPage)}
          >
            Previous
          </button>
        </div>
        <div id="submitButton">
          <button
            id="button_changeScene"
            onClick={() => handleSceneChange(Scene.Suggestions)}
          >
            SUBMIT
          </button>
        </div>
      </div>
    );
  } else {
    buttons = (
      <div>
        <div id="previousButton">
          <button
            id="button_changeScene"
            onClick={() => handleLastPage(currentPage)}
          >
            Previous
          </button>
        </div>
        <div id="nextButton">
          <button
            id="button_changeScene"
            onClick={() => handleNextPage(currentPage)}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

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
            {page}
            {buttons}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  function resetSelections () {
    setChoices({})
  }

  if (scene === Scene.Suggestions) {
    //setCurrentPage(1);
    return (
      <div>
        <div className="results">
          <Suggestions choices={choices} />
        </div>
        <div id="backButton">
          <button
            id="button_changeScene"
            onClick={ () => {
              handleSceneChange(Scene.Home)
              setCurrentPage(1)
              resetSelections()}}
              >
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
              <div className="brand-description">
                <p>Helping you pick gifts for any recipient & occasion</p>
              </div>
            </div>
            <img className="logo" src="./App-logo.png" alt=""></img>
            <div id="startButton">
              <button
                id="button_changeScene"
                onClick={() => handleSceneChange(Scene.Questions)}
              >
                START QUIZ
              </button>
            </div>
          </header>
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
