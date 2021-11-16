import { useState } from "react";
import "./App.css";
import "./homepage.scss";
import "./App2.scss";
import Questions from "./components/Questions";
import ScrollablePage from "./components/ScrollablePage";
import Suggestions from "./components/Suggestions";
import Footer from "./components/Footer";
import Buttons from "./components/Buttons";
import Typing from "react-typing-animation";
import Header from "./components/Header";
import Banner from "./components/Banner";

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

  function resetSelections() {
    setChoices({});
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
            onClick={() => {
              handleSceneChange(Scene.Home);
              setCurrentPage(1);
              resetSelections();
            }}
          >
            HOME
          </button>
        </div>
        <Footer />
      </div>
    );
  } else {
    const giftPeople = [
      "friend.",
      "sister.",
      "coworker.",
      "partner.",
      "brother.",
      "girlfriend.",
      "mom.",
      "dad.",
      "husband.",
      "boyfriend.",
      "boss.",
      "wife.",
    ];

    return (
      <div id="HomePage">
        <Banner/>
        <Header/>
        <header id="HomePageContents">
          <div id="StartQuizSection">
            <div id="homepageTitle">
              <h1>
                don't buy that gift for your{" "}
                <Typing loop={true} cursorClassName="cursor">
                  {giftPeople.map((p) => {
                    return (
                      <>
                        {<span id="typingEffect">{p}</span>}
                        <Typing.Backspace count={p.length + 1} delay={1000} />
                      </>
                    );
                  })}
                </Typing>
              </h1>
            </div>

            <div>
              <h2 className="subtitle">
                leave it to the experts (that’s us). introducing GiftPicker, the
                only way you should be picking holidays gifts.
              </h2>
            </div>
            <button
              type="button"
              id="startQuizButton"
              onClick={() => handleSceneChange(Scene.Questions)}
            >
              {" "}
              Take our gift quiz
            </button>
            <a href="#" className="scroll-down"></a>
          </div>
          <div id="AboutGiftPickerSection">
            <div id="MoreInfoSection">
              <div id="aboutText">
                <h3>
                  How do we put this nicely... <br />
                  if your holiday gift usually <br />
                  ends up in the closet, leave <br />
                  the gifting to us.
                  <br />
                  we’ve made a quiz so <br />
                  simple you’re bound to ...
                </h3>{" "}
              </div>
              <div id="aboutImg">
                <img src="./AboutGPImg.png" alt="gift picker on phone" />
              </div>
            </div>
            <div id="Partners">
              <h2> over 1,000 gifts from your favorite brands</h2>
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
          </div>
          <div id="FAQSection">
            <h2>FAQs About Gifting</h2>
            <div id="FAQBubble">
              <div className="row">
                <div className="col">
                  <div className="tabs">
                    <div className="tab">
                      <input type="checkbox" id="rd1" name="rd" />
                      <label className="tab-label" htmlFor="rd1">
                        Item 1
                      </label>
                      <div className="tab-content">
                        Lorem, ipsum dolor sit amet consectetur adipisicing
                        elit. Eos, facilis.
                      </div>
                    </div>
                    <div className="tab">
                      <input type="checkbox" id="rd2" name="rd" />
                      <label className="tab-label" htmlFor="rd2">
                        Item 2
                      </label>
                      <div className="tab-content">
                        Lorem ipsum dolor, sit amet consectetur adipisicing
                        elit. Nihil, aut.
                      </div>
                    </div>
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
