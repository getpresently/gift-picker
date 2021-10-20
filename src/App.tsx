import { useState } from "react";
import "./App.css";
import Questions from "./components/Questions";
import Suggestions from "./components/Suggestions";
/*import Header from "./components/Header";*/
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
  const [currentPage, setcurrentPage] = useState<{ [key: int]: int }>({});

  //current page and set page variables, call set state to change page to whatever you want with an 
  //on click handler and set page to some number 
  //change to int for page number

  //make next and back button 
  //set choice to some string

  function handleNextPage(pageType : int, pageValue: int) {
       setcurrentPage((state)  => ({
      ...state,
      [pageType]: pageValue + 1,
    }));
  }
  
  function handleLastPage(pageType : int, pageValue: int) {
       setcurrentPage((state)  => ({
      ...state,
      [pageType]: pageValue - 1,
    }));
  }
  


  function handleSelectChoice(choiceType: string, choiceValue: string) {
    setChoice((state) => ({
      ...state,
      [choiceType]: choiceValue,
    }));
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
        <Questions handleSelectChoice={handleSelectChoice} />
      </div>
      <div id="submitButton">
        <button id="button_changeScene" onClick={() => handleSceneChange(Scene.Suggestions)}>
          SUBMIT
        </button>
      </div>
      <div id="previousButton">
        <button id="button_changeScene" onClick={() => handleLastPage(currentPage)}>
          Previous
        </button>
      </div>
      <div id="nextButton">
        <button id="button_changeScene" onClick={() => handleNextPage(currentPage)}>
          Next
        </button>
      </div>
    <Footer />
    </div>
    );
  } 
  
  if (scene === Scene.Suggestions) {
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
