import { useIdeas } from '../utils/hooks';
import { Gift } from '../utils/types';
import Suggestion from './Suggestion';

interface PropTypes {
  choices: { [key: string]: Set<string> };
}

const MANDATORY_QUESTION_KEYS = ["Age"];
const WEIGHTED_QUESTION_KEYS = ["Type", "Interests", "Price"];
const WEIGHTED_QUESTION_VALUES = [1, 1, 1];

function Suggestions({ choices }: PropTypes): JSX.Element {
  const { data: suggestions, loading: isLoading } = useIdeas();

  // caculates the relevance score for a gift
  function calculateGiftScore(curGift: Gift) {
    let score = 0;

    // returns -1 if mandatory attributes are not met
    for (const questionKey of MANDATORY_QUESTION_KEYS) {
      const giftAttributes = curGift[questionKey as keyof Gift];
      let valid = false;

      if (Array.isArray(giftAttributes) && !!choices[questionKey]) {
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

  const filteredSuggestions = sortGiftsByScore(suggestions);
  let results;

  if (isLoading) {
    // page is not loaded yet
    results = (
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    );
  } else if (filteredSuggestions.length === 0) {
    // page is not loading and we have no results
    results =  (
      <div>
        <p> No suggestions could be found.</p>
      </div>
    );
  } else {
    // page is not loading and we have results
    results = (
      <div className="columns">
        {filteredSuggestions.map((x, i) => (
          <Suggestion
            photo={x.photo}
            key={`que-${i}`}
            title={x.gift}
            brand={x.brand}
            link={x.link}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div id="top">
        <p>The top gift suggestions based on your answers:</p>
      </div>
      <div className="line">
        <hr></hr>
      </div>
      {results}
    </div>
  )
}
export default Suggestions;
