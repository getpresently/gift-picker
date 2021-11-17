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
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

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
              choices={choices}
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
            className="button_nav"
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
  

        <Banner />
        <Header />
        <header id="HomePageContents">
          <div id="StartQuizSection">
            <div id="startSectionText">
              <h1 id="homepageTitle">
                Don't buy that gift for your
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
              <h2 className="subtitle">
                leave it to the experts (that’s us). introducing GiftPicker, the
                only way you should be picking holidays gifts.
              </h2>
              <button
                type="button"
                id="startQuizButton"
                onClick={() => handleSceneChange(Scene.Questions)}
              >
                Take our gift quiz
              </button>
            </div>
            <div id="aboutImg">
              <img src="./iphoneDiagram.svg" alt="gift picker on phone" />
            </div>
          </div>
          <div id="AboutGiftPickerSection">
            <div id="MoreInfoSection"></div>
            <div id="Partners">
              <h2> Over 1,000 gifts from your favorite brands</h2>
              <div id="PartnersLogosContainer">
                <img
                  className="partnerImage"
                  src="./appleLogo.svg"
                  alt="apple logo"
                ></img>
                <img
                  className="partnerImage"
                  src="./williamsSonomaVector.svg"
                  alt="williams sonoma logo"
                ></img>
                <img
                  className="partnerImage"
                  src="./anthropologieLogo.jpeg"
                  alt="anthropolgie logo"
                ></img>
                <img
                  className="partnerImage"
                  src="./potteryBarnLogo.svg"
                  alt="pottern barn logo"
                ></img>
                <img
                  className="partnerImage"
                  src="./pelotonLogo.svg"
                  alt="peloton logo"
                ></img>
                <img
                  className="partnerImage"
                  src="./LLBeanLogo.svg"
                  alt="LLBean logo"
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
              <button
                type="button"
                id="startQuizButton"
                onClick={() => handleSceneChange(Scene.Questions)}
              >
                Take our gift quiz
              </button>
            </div>
          </div>
          <div id="FAQSection">
            <div id="FAQBubble">
              <h2>FAQs About Gifting</h2>

              <div className="row">
                <div className="col">
                  <div className="tabs">
                    <div className="tab">
                      <input type="checkbox" id="rd1" name="rd" />
                      <label className="tab-label" htmlFor="rd1">
                        What is GiftPicker?
                      </label>
                      <div className="tab-content">
                        GiftPicker is a free online gifting quiz that helps you
                        find personalized gift recommendations in just 30
                        seconds. Answer five quick questions about the person
                        you’re shopping for, and we’ll give you our best picks
                        from a curated gift database.
                      </div>
                    </div>
                    <div className="tab">
                      <input type="checkbox" id="rd2" name="rd" />
                      <label className="tab-label" htmlFor="rd2">
                        Who’s GiftPicker for?
                      </label>
                      <div className="tab-content">
                        GiftPicker is for everyone, from the person who
                        struggles to find gifts to the gifting genius who’s
                        excited for some extra inspiration. And, we can cover
                        everyone on your list: we have recommendations ranging
                        from your work bff all the way to your grandparents.
                      </div>
                    </div>
                    <div className="tab">
                      <input type="checkbox" id="rd3" name="rd" />
                      <label className="tab-label" htmlFor="rd3">
                        Can I share my GiftPicker recommendations with others?
                      </label>
                      <div className="tab-content">
                      Yes, you can share your favorite recommendations in two ways.<br/><br/>

First, you can choose to split the cost of the gift with friends via our ‘Split Gift’ option, which will take you our partners at Presently to set up a group gift. A group gift is a joint gift that friends, family, or coworkers can pitch in on. <br/><br/>

Second, starting Dec 1, you’ll also be able to send links to your personalized gift recommendations via email, text, and more. Perfect way to send a nudge!

                      </div>
                    </div>
                    <div className="tab">
                      <input type="checkbox" id="rd4" name="rd" />
                      <label className="tab-label" htmlFor="rd4">
                        Can I share my GiftPicker recommendations with others?
                      </label>
                      <div className="tab-content">
                      We’d love to hear from you! Direct message us on instagram @giftpicker.io

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    );
  }
}

export default App;
