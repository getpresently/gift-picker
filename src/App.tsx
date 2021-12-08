import { useEffect, useState } from "react";
import "./App.css";
import "./homepage.scss";
import "./App2.scss";
import "./emailcapture.scss";
import Questions from "./components/Questions";
import ScrollablePage from "./components/ScrollablePage";
import Suggestions from "./components/Suggestions";
import Footer from "./components/Footer";
import Buttons from "./components/Buttons";
import Typing from "react-typing-animation";
import Header from "./components/Header";
import Banner from "./components/Banner";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import EmailCaptureComponent from "./components/EmailCaptureForm";
import { getQuestions } from "./utils/hooks";
import ProductDetail from "./components/ProductDetail";

enum Scene {
  Home = 1,
  Questions,
  Suggestions,
}

const NUM_PAGES = 5;

function App(): JSX.Element {
  const [scene, setScene] = useState<Scene>(Scene.Home);
  const [questions, setQuestions] = useState<any[]>([]);
  // load questions from google sheets
  useEffect(() => {
    getQuestions().then((questions) => {
      setQuestions(questions);
    });
  }, []);

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

  function handleSelectChoice(
    maxSelectable: number,
    choiceType: string,
    choiceValue: string
  ) {
    let newChoices = choices[choiceType] || new Set<string>();

    if (maxSelectable === 1) {
      if (newChoices.has(choiceValue)) {
        newChoices.clear();
      } else {
        newChoices.clear();
        newChoices.add(choiceValue);
      }
    } else {
      if (newChoices?.has(choiceValue)) {
        newChoices.delete(choiceValue);
      } else if (newChoices.size < maxSelectable) {
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
      pageCount={NUM_PAGES}
      choices={choices}
      questions={questions}
    />
  );

  const page = <ScrollablePage childComp={question}></ScrollablePage>;

  const QuestionsPageComponent = () => (
    <>
      <div className="container p-8 mx-auto content_container">
        {page}
        <div className="pt-8">
          <Buttons
            handlePageChange={handlePageChange}
            handleSubmit={() => handleSceneChange(Scene.Suggestions)}
            currentPage={currentPage}
            numPages={NUM_PAGES}
            choices={choices}
          />
        </div>
      </div>
      <Footer />
    </>
  );

  function resetSelections() {
    setChoices({});
  }

  const SuggestionsComponent = () => (
    <div>
      <div className="content_container">
        <div className="results">
          <Suggestions choices={choices} />
        </div>
        <div id="backButton">
          <Link to="/">
            <button
              className="button_startOver"
              onClick={() => {
                handleSceneChange(Scene.Home);
                setCurrentPage(1);
                resetSelections();
              }}
            >
              Start over
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

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

  /*const EmailCaptureComponent = () => (
<div className="container">
  <div className="row">
        <div className="col-md-6 col-md-offset-3 email-capture">
          <h3>Did you like this article?</h3>
          <h4>Sign up to get the latest content first.</h4>
          <div id="mc_embed_signup" className="mailchimp">
            <form action="YOUR___FORM____LINK___HERE" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" className="validate form-inline" target="_blank" noValidate>    
              <div className="form-group">
               <input type="email" value="" name="EMAIL" className="required email form-control" id="mce-EMAIL" placeholder="Enter email"/>
               <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" className="btn btn__bottom--border mailchimp__btn" data-style="shrink" data-horizontal/>        
            </div>
            <div id="mce-responses" className="clear">
              <div className="response" id="mce-error-response"></div>
              <div className="response" id="mce-success-response"></div>
            </div>   
            <div className="inputDiv">
              <input type="text" name="b_410ed4e009d15301d90f6492b_753384883a" value=""/>
            </div>                          
          </form>
            <span className="form_nospam">No spam - pinky promise</span>  
          </div>
        </div>
     </div> 
    </div> 
  );
  */

  const HomepageComponent = () => (
    <div id="HomePage">
      <Header />
      <header id="HomePageContents" className="content_container">
        <div id="StartQuizSection">
          <div id="startSectionText">
            <h1 id="homepageTitle">
              Don't pick that gift
              <br />
              for your&nbsp;
              <Typing loop={true} cursorClassName="cursor" className="inline">
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
              Leave it to the pros. Introducing GiftPicker, the better way to
              find the perfect gift.
            </h2>
            <Link to="/quiz">
              <button
                type="button"
                id="startQuizButton"
                className="w-60 md:w-64"
                onClick={() => handleSceneChange(Scene.Questions)}
              >
                Take our gift quiz
              </button>
            </Link>
          </div>
          <div id="aboutImg">
            <img src="./giftpickerImages.svg" alt="gift picker on phone" />
          </div>
        </div>
        <div id="AboutGiftPickerSection">
          <div id="MoreInfoSection">
            <EmailCaptureComponent />
          </div>
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
                src="./airbnb-logo.svg"
                alt="airbnb logo"
              ></img>
              <img
                className="partnerImage"
                src="./potteryBarnLogo.svg"
                alt="pottery barn logo"
              ></img>
              <img
                className="partnerImage"
                src="./anthropologieLogo.jpeg"
                alt="anthropolgie logo"
              ></img>
              <img
                className="partnerImage"
                src="./pelotonLogo.svg"
                alt="peloton logo"
              ></img>
              <img
                className="partnerImage"
                src="./fujifilm.png"
                alt="fujifilm logo"
              ></img>
              <img
                className="partnerImage"
                src="./jbl-logo.png"
                alt="jbl logo"
              ></img>
              <img
                className="partnerImage"
                src="./lululemon.png"
                alt="lululemon logo"
              ></img>
              <img
                className="partnerImage"
                src="./keurig-logo.svg"
                alt="keurig logo"
              ></img>
              <img
                className="partnerImage"
                src="./anker-logo.jpeg"
                alt="anker logo"
              ></img>
            </div>
            <Link to="/quiz">
              <button
                type="button"
                id="startQuizButton"
                className="w-60 md:w-64"
                onClick={() => handleSceneChange(Scene.Questions)}
              >
                Take our gift quiz
              </button>
            </Link>
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
                      find personalized gift recommendations in just 30 seconds.
                      Answer five quick questions about the person you’re
                      shopping for, and we’ll give you our best picks from a
                      curated gift database.
                    </div>
                  </div>
                  <div className="tab">
                    <input type="checkbox" id="rd2" name="rd" />
                    <label className="tab-label" htmlFor="rd2">
                      Who’s GiftPicker for?
                    </label>
                    <div className="tab-content">
                      GiftPicker is for everyone, from the person who struggles
                      to find gifts to the gifting genius who’s excited for some
                      extra inspiration. And, we can cover everyone on your
                      list: we have recommendations ranging from your work bff
                      all the way to your grandparents.
                    </div>
                  </div>
                  <div className="tab">
                    <input type="checkbox" id="rd3" name="rd" />
                    <label className="tab-label" htmlFor="rd3">
                      Can I share my GiftPicker recommendations with others?
                    </label>
                    <div className="tab-content">
                      Yes, you can share your favorite recommendations in two
                      ways.
                      <br />
                      <br />
                      First, you can choose to split the cost of the gift with
                      friends via our ‘Split Gift’ option, which will take you
                      our partners at Presently to set up a group gift. A group
                      gift is a joint gift that friends, family, or coworkers
                      can pitch in on. <br />
                      <br />
                      Second, starting Dec 1, you’ll also be able to send links
                      to your personalized gift recommendations via email, text,
                      and more. Perfect way to send a nudge!
                    </div>
                  </div>
                  <div className="tab">
                    <input type="checkbox" id="rd4" name="rd" />
                    <label className="tab-label" htmlFor="rd4">
                      I have some suggestions, how can I get in touch?
                    </label>
                    <div className="tab-content">
                      We’d love to hear from you! Direct message us on instagram
                      @giftpicker.io
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Footer></Footer>
    </div>
  );

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <Banner />
                <HomepageComponent />
              </div>
            }
          />
          <Route
            path="/home"
            element={
              <div>
                <Banner />
                <HomepageComponent />
              </div>
            }
          />
          <Route
            path="/quiz"
            element={
              <div>
                <Header />
                <QuestionsPageComponent />
              </div>
            }
          />
          <Route
            path="/results"
            element={
              <div>
                <Header />
                <SuggestionsComponent />
              </div>
            }
          />
          <Route
            path="/giftid/:id"
            element={
              <div>
                <Header />
                <ProductDetail />
              </div>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
