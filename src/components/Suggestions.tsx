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
  const { data: suggestions } = useIdeas();

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

  return (
    <div>
      <div id="top">
        <p>The top gift suggestions based on your answers:</p>
      </div>
      <div className="line">
        <hr></hr>
      </div>
      <div className="columns">
        {sortGiftsByScore(suggestions).map((x, i) => (
          <Suggestion
            photo={x.photo}
            key={`que-${i}`}
            title={x.gift}
            brand={x.brand}
            link={x.link}
          />
        ))}
      </div>
    </div>
  );
}
export default Suggestions;
