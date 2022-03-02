import './Suggestions.css';
import {useIdeas} from '../utils/hooks';
import {Gift} from '../utils/types';
import Loading from './Loading';
import Suggestion from './Suggestion';
import React from 'react';
import {useTimer} from 'react-timer-hook';
import {Link} from 'react-router-dom';

interface PropTypes {
  choices: { [key: string]: Set<string> };
  setCurrentPage: (page: number) => void;
  resetSelections: () => void;
}

const LIMIT_INCREMENT = 3;
const LIMIT_STOP = 12;
const MANDATORY_QUESTION_KEYS = ['Age', 'Price'];
const WEIGHTED_QUESTION_KEYS = ['Relation', 'Type', 'Interests'];
const WEIGHTED_QUESTION_VALUES = [1, 2, 5];

function Suggestions({choices, setCurrentPage, resetSelections}: PropTypes): JSX.Element {
  const [limit, setLimit] = React.useState(LIMIT_INCREMENT);
  const [moreShowing, setMoreShowing] = React.useState(false);
  const {data: suggestions, loading: isLoading} = useIdeas();

  const time = new Date();
  time.setSeconds(time.getSeconds() + 2.85); // 2.85 seconds for gif to fully display load
  const {isRunning} = useTimer({expiryTimestamp: time, onExpire: () => console.warn('onExpire called')});

  // caculates the relevance score for a gift
  function calculateGiftScore(curGift: Gift) {
    let score = 0;

    // returns -1 if mandatory attributes are not met
    for (const questionKey of MANDATORY_QUESTION_KEYS) {
      const giftAttributes = curGift[questionKey as keyof Gift];
      let valid = false;
      if (giftAttributes && !!choices[questionKey]) {
        choices[questionKey].forEach(function (selection) {
          if (selection === 'Any budget') {
            valid = true;
          } else if (giftAttributes.includes(selection)) {
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
  // returns a list of gifts and scores in decending order based on weighted scores (highest-> lowest)
  function sortGiftsByScore(suggestions: Gift[]): [Gift, number][] {
    let giftAndScore = suggestions.map((gift) => getGiftScore(gift));
    giftAndScore = giftAndScore.filter((gift) => gift[1] > 0);
    giftAndScore = giftAndScore.sort((a, b) => b[1] - a[1]);
    return giftAndScore;
  }
  
  // returns the list of gifts and scores whose gift status is Live
  const filterSuggestionsByLive = sortGiftsByScore(suggestions).filter(
    (gift) => gift[0].status === 'Live',
  );

  // generates a random integer between min (inclusive) and max (inclusive)
  // used to simulate a coin toss for breaking ties at the LIMIT_STOP 
  function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // if two gifts have the same weighted score and are separated by LIMIT_STOP, we
  // randomly select one to display before LIMIT_STOP so that being displayed isn't
  // determined by the index for gifts with the same score at the LIMIT_STOP point in
  // filterSuggestionsByLive
  function randomSwap(suggestions: [Gift, number][]): [Gift, number][] {
    if (suggestions[LIMIT_STOP + 1] == null) {
        return suggestions;
    }
    else if (suggestions[LIMIT_STOP][1] == suggestions[LIMIT_STOP + 1][1]) {
        var random = getRandomInt(0, 1);
        if (random == 1) {
          suggestions.splice(LIMIT_STOP, 2, suggestions[LIMIT_STOP])
            return suggestions;
        } 
        else {
          suggestions.splice(LIMIT_STOP, 2, suggestions[LIMIT_STOP + 1])
            return suggestions;
        }
    }
    else {
        return suggestions;
    }
  } 

  const filteredSuggestions = randomSwap(filterSuggestionsByLive).map(
    (row) => row[0]
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
    <div id="suggestions-container">
      <div id="top">
        <p className="text-white pb-12">Our gift picks 🎁</p>
      </div>
      {isLoading || isRunning ? <Loading/>
        : (filteredSuggestions.length === 0 ?
          <p> No suggestions could be found.</p>
          : <div className="columns">
            {filteredSuggestions.slice(0, limit).map((x, i) => {
              return <Suggestion
                index={x.rowId}
                photo={x.photo}
                key={`que-${i}`}
                title={x.gift}
                brand={x.brand}
                price={x.Price}
                actualPrice={x.actualPrice}
                link={x.link}
                groupLink={x.groupLink}
              />;
            })}
          </div>)}
      <div>
        {/* && filteredSuggestions.length !== 0*/}
        {(!isLoading && !isRunning) &&
          <div className="flex flex-col items-center">
            <button
              className="bg-deepBlack w-52 h-11 hover:bg-black text-white button_nav"
              hidden={moreShowing}
              onClick={increaseLimitAndDisableMore}>
              Load more gifts
            </button>
            <Link to="/">
              <button
                className="button_startOver"
                onClick={() => {
                  setCurrentPage(1);
                  resetSelections();
                }}
              >
                Start over
              </button>
            </Link>
          </div>}
      </div>
    </div>
  );
}

export default Suggestions;
