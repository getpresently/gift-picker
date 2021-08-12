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

  const [choices, setChoice] = useState();

  function handleSelectChoice(choiceType: string, choiceValue: string) {
    setChoice((state) => ({
      ...state,
      [choiceType]: choiceValue,
    }));

    const topthree = Suggestions.find( ({ ? }) => ? === choiceValue)
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
        <div>
          <Suggestions />
          <br></br>
          <button onClick={() => handleSceneChange(Scene.Home)}>Try Again</button>
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
            <br></br>
            <p>To get your personalized gift suggestions,</p>
            <p>simply answer these four quick questions:</p>
            <br></br>
          </div>

            <div>
              <div>
              <Questions handleSelectChoice={handleSelectChoice} />
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
