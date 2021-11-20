import "./Suggestions.css";
import { useIdeas } from "../utils/hooks";
import { Gift } from "../utils/types";
import Loading from "./Loading";
import Suggestion from "./Suggestion";
import React from "react";
import { useTimer } from "react-timer-hook";
import Confetti from "react-confetti";

interface PropTypes {
  choices: { [key: string]: Set<string> };
}

const LIMIT_INCREMENT = 3;
const LIMIT_STOP = 12;
const MANDATORY_QUESTION_KEYS = ["Age", "Price"];
const WEIGHTED_QUESTION_KEYS = ["Relation", "Type", "Interests"];
const WEIGHTED_QUESTION_VALUES = [1, 1, 1];

function Suggestions({ choices }: PropTypes): JSX.Element {
  const [limit, setLimit] = React.useState(LIMIT_INCREMENT);
  const [moreShowing, setMoreShowing] = React.useState(false);
  const { data: suggestions, loading: isLoading } = useIdeas();

  const time = new Date();
  time.setSeconds(time.getSeconds() + 2.85); // 2.85 seconds for gif to fully display load
  const { isRunning } = useTimer({
    expiryTimestamp: time,
    onExpire: () => console.warn("onExpire called"),
  });

  // caculates the relevance score for a gift
  function calculateGiftScore(curGift: Gift) {
    let score = 0;

    // returns -1 if mandatory attributes are not met
    for (const questionKey of MANDATORY_QUESTION_KEYS) {
      const giftAttributes = curGift[questionKey as keyof Gift];
      let valid = false;
      if (giftAttributes && !!choices[questionKey]) {
        choices[questionKey].forEach(function (selection) {
          if (giftAttributes.includes(selection)) {
            valid = true;
          }
        });
        if (!valid) {
          return -1;
        }
      }
    }

    // calucates weighted score for if gift meets all mandatory attributes
    for (const questionKey of WEIGHTED_QUESTION_KEYS) {
      const giftAttributes = curGift[questionKey as keyof Gift];

      if (Array.isArray(giftAttributes) && !!choices[questionKey]) {
        choices[questionKey].forEach(function (selection) {
          if (giftAttributes.includes(selection)) {
            score +=
              WEIGHTED_QUESTION_VALUES[
                WEIGHTED_QUESTION_KEYS.indexOf(questionKey)
              ];
          }
        });
      }
    }
    return score;
  }

  // calculates the score for a given gift
  // returns tuple of the gift and its score
  function getGiftScore(row: Gift): [Gift, number] {
    let score = calculateGiftScore(row);
    return [row, score];
  }

  // filters out options that dont fit mandatory attributes
  // returns a list of gifts in decending order based on weighted scores (highest-> lowest)
  function sortGiftsByScore(suggestions: Gift[]): Gift[] {
    let giftAndScore = suggestions.map((gift) => getGiftScore(gift));
    giftAndScore = giftAndScore.filter((gift) => gift[1] > 0);
    giftAndScore = giftAndScore.sort((a, b) => b[1] - a[1]);
    let onlyGifts = giftAndScore.map((row) => row[0]);
    return onlyGifts;
  }

  const filteredSuggestions = sortGiftsByScore(suggestions).filter(
    (g) => g.status === "Live"
  );

  //increases the number of suggestions displayed by the value of LIMIT_INCREMENT
  //until LIMIT_STOP (12) suggestions are shown
  const increaseLimitAndDisableMore = () => {
    setLimit(limit + LIMIT_INCREMENT);
    if (limit + LIMIT_INCREMENT >= LIMIT_STOP) {
      setMoreShowing(true);
    }
  };

  return (
    <div>
      <div id="top">
        <p className="text-white pb-12">Our gift picks 🎁</p>
      </div>
      {isLoading || isRunning ? (
        <Loading></Loading>
      ) : filteredSuggestions.length === 0 ? (
        <p> No suggestions could be found.</p>
      ) : (
        <React.Fragment>
          <Confetti
            recycle={false}
            numberOfPieces={1250}
            tweenDuration={20000}
            colors={["#4DDDEA", "#FF5D81", "#FFBD89", "#8B30E1"]}
          />
          <div className="columns">
            {filteredSuggestions.slice(0, limit).map((x, i) => {
              return (
                <Suggestion
                  photo={x.photo}
                  key={`que-${i}`}
                  title={x.gift}
                  brand={x.brand}
                  price={x.PriceActual[0]}
                  link={x.link}
                  groupLink={x.groupLink}
                />
              );
            })}
          </div>
        </React.Fragment>
      )}
      <div>
        {!isLoading && !isRunning && (
          <button
            className="bg-deepBlack w-52 h-11 hover:bg-black text-white button_nav"
            hidden={moreShowing}
            onClick={increaseLimitAndDisableMore}
          >
            Load more gifts
          </button>
        )}
      </div>
    </div>
  );
}

export default Suggestions;
