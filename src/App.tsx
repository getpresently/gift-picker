import { useState } from "react";
import "./App.css";
import Question from "./components/Question";
import Questions from "./components/Questions";
import ScrollablePage from "./components/ScrollablePage";
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  

  function handleNextPage(newVal : number) {
    if (newVal < 4) {
      setCurrentPage(newVal + 1);
    }
  }
  
  function handleLastPage(newVal : number) {
    if (newVal > 1) {
      setCurrentPage(newVal - 1);
    }
  }


  function handleSelectChoice(choiceType: string, choiceValue: string) {
    setChoice((state) => ({
      ...state,
      [choiceType]: choiceValue,
    }));
  }

  // create array of questions

  var question = <Questions handleSelectChoice={handleSelectChoice} page={currentPage}/> 
  var page = (
      <ScrollablePage childComp={question}></ScrollablePage>
    )

  var buttons;
  if (currentPage === 1) {
      buttons = (<div id="nextButton">
            <button id="button_changeScene" onClick={() => handleNextPage(currentPage)}>
              Next
            </button>
          </div>)
  } else if (currentPage === 4){
       buttons = (<div>
       <div id="previousButton">
            <button id="button_changeScene" onClick={() => handleLastPage(currentPage)}>
              Previous
            </button>
          </div>
        <div id="submitButton">
            <button id="button_changeScene" onClick={() => handleSceneChange(Scene.Suggestions)}>
              SUBMIT
            </button>
          </div>
          </div>
          )
  } else {
  buttons = (<div>
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
          </div>
          )
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
            {page}
            {buttons}
            </div>
        <Footer />
        </div>
      </div>);
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
