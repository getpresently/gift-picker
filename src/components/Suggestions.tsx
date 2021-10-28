import { useIdeas } from "../utils/hooks";
import { Gift } from "../utils/types";
import Suggestion from "./Suggestion";

interface PropTypes {
  choices: { [key: string]: Set<string> };
}

function Suggestions({ choices }: PropTypes): JSX.Element {
  const { data: suggestions } = useIdeas();
  const mandatoryQuestionKeys = ["Age"];
  const weightedQuestionKeys = ["Type", "Interests", "Price"];
  const weightedQuestionValues = [1, 1, 1];

  // caculates the relevance score for a gift
  function calcGiftScore(curGift: Gift) {
    let score = 0;

    // returns -1 if mandatory attributes are not met
    for (const questionKey of mandatoryQuestionKeys) {
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
    for (const questionKey of weightedQuestionKeys) {
      const giftAttributes = curGift[questionKey as keyof Gift];

      if (Array.isArray(giftAttributes) && !!choices[questionKey]) {
        choices[questionKey].forEach(function (selection) {
          if (giftAttributes.includes(selection)) {
            score =
              score +
              1 *
                weightedQuestionValues[
                  weightedQuestionKeys.indexOf(questionKey)
                ];
          }
        });
      }
    }
    return score;
  }

  // calculates the score for a given gift
  // returns tuple of the gift and its score
  function filterSuggestions(row: Gift): [Gift, number] {
    let score = calcGiftScore(row);
    return [row, score];
  }

  // filters out options that dont fit mandatory attributes
  // returns a list of gifts in decending order based on weighted scores (highest-> lowest)
  function sortedSuggestions(suggestions: Gift[]): Gift[] {
    let giftAndScore = suggestions.map((gift) => filterSuggestions(gift));
    giftAndScore = giftAndScore.filter((gift) => gift[1] > 0);
    giftAndScore = giftAndScore.sort((a, b) => b[1] - a[1]);
    let onlyGifts = giftAndScore.map((row) => row[0]);
    let onlyScores = giftAndScore.map((row) => row[1]);
    console.log(onlyScores);
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
        {sortedSuggestions(suggestions).map((x, i) => (
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
