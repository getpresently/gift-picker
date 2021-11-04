import { useState } from "react";
import "./App.css";
import "./App2.scss";
import "./typingEffect.js"

import Questions from "./components/Questions";
import Suggestions from "./components/Suggestions";
import Footer from "./components/Footer";
import Header from "./components/Header";

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

  // changes state depending on if the question is single/multi select
  // removes from state if previously selected, adds to state if new
  function handleSelectChoice(
    isSingleSelect: boolean,
    choiceType: string,
    choiceValue: string
  ) {
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
        <div className="instructions">
          <p>To get your personalized gift suggestions,</p>
          <p>simply answer these four quick questions:</p>
        </div>

        <div className="line">
          <hr></hr>
        </div>

        <div>
          <div id="container">
            <Questions
              handleSelectChoice={handleSelectChoice}
              choices={choices}
            />
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
          <button
            id="button_changeScene"
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
      <div id="HomePage">
        <Header />
        <header id="HomePageContents">
          <div id="StartQuizSection">
            <div className="title">
              <h1>Need to find the perfect gift for your</h1>
              <div id = "typingEffectContainer">
	              <h1 id="text"></h1>  
                <h1 id="cursor"></h1>
                </div>
                </div>
                <script type="text/javascript"  src = "./typingEffect.js">
        </script>

              <div className="subtitle">
              <p>
                Don't worry, in just a few minutes, we can help you find the
                perfect present.
              </p>
            </div>
            <img id="HomepageLogo" src="./App-logo.png" alt=""></img>
            <button
              className="startQuizButton"
              onClick={() => handleSceneChange(Scene.Questions)}
            >
              <span className="startButtonSpan">Get Started</span>
            </button>
          </div>
          <div id="Partners">
            <p className="heading1">
              {" "}
              Featuring 1000+ gifts from your favorite brands
            </p>
            <div id="PartnersLogosContainer">
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
              <img
                className="partnerImage"
                src="./charcoalBlackRectangle.jpeg"
                alt="partner logo"
              ></img>
            </div>
          </div>
          <div id="FAQ">
            <p className= "heading1" >Frequently Asked Questions</p>
            <div className="accordianContainer">
              <div className="accordion">
                <div className="accordionItem">
                  <button
                    className="accordionButton"
                    id="accordionButton1"
                    aria-expanded="false"
                  >
                    <span className="accordionTitle">
                      Why is the moon sometimes out during the day?
                    </span>
                    <span className="icon" aria-hidden="true"></span>
                  </button>
                  <div className="accordionContent">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Elementum sagittis vitae et leo duis ut. Ut tortor
                      pretium viverra suspendisse potenti.
                    </p>
                  </div>
                </div>
                <div className="accordionItem">
                  <button
                    className="accordionButton"
                    id="accordionButton2"
                    aria-expanded="false"
                  >
                    <span className="accordionTitle">Why is the sky blue?</span>
                    <span className="icon" aria-hidden="true"></span>
                  </button>
                  <div className="accordionContent">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Elementum sagittis vitae et leo duis ut. Ut tortor
                      pretium viverra suspendisse potenti.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <Footer />
      </div>
      
    );
  }
}

export default App;
