import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import ScrollablePage from "./components/ScrollablePage";
import Suggestions from "./components/Suggestions";
import Footer from "./components/Footer";
import Buttons from "./components/Buttons";

enum Scene {
  Home = 1,
  Questions,
  Suggestions,
}

const NUM_PAGES = 4;

function App(): JSX.Element {
  const [scene, setScene] = useState<Scene>(Scene.Home);

  function handleSceneChange(sceneTo: Scene) {
    setScene(sceneTo);
  }

  // choices[question]: set of choices if key is multi select question identifier
  // choices[question]: set of size 1 if key is single select question identifier
  const [choices, setChoices] = useState<{ [key: string]: Set<string> }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);

  // changes the question to either the next or previous page
  function handlePageChange(next: boolean) {
    if (next && currentPage < NUM_PAGES) {
      setCurrentPage(currentPage + 1);
    } else if (!next && currentPage > 1) {
      setCurrentPage(currentPage - 1);
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

  const question = (
    <Questions
      handleSelectChoice={handleSelectChoice}
      page={currentPage}
      choices={choices}
    />
  );
  const page = <ScrollablePage childComp={question}></ScrollablePage>;

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
            <Buttons
              handlePageChange={handlePageChange}
              handleSubmit={() => handleSceneChange(Scene.Suggestions)}
              currentPage={currentPage}
              numPages={NUM_PAGES}
            ></Buttons>
          </div>
          <Footer />
        </div>
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
          <button
            className="button_nav"
            onClick={() => handleSceneChange(Scene.Home)}
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
                className="button_nav"
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
