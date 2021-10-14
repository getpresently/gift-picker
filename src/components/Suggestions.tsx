import React from "react";
import { useIdeas } from "../utils/hooks";
import { Gift } from "../utils/types";
import Suggestion from "./Suggestion";

interface PropTypes {
  choices: { [key: string]: string };
}

function Suggestions({ choices }: PropTypes): JSX.Element {
  const { data: suggestions } = useIdeas();
  const [limit, setLimit] = React.useState(3)
  const questionKeys = ["Age", "Type", "Interests", "Price"];

  function filterSuggestions(row: Gift) {
    let filter = true;
    for (const questionKey of questionKeys) {
      if (
        Array.isArray(row[questionKey as keyof Gift]) &&
        !!choices[questionKey]
      ) {
        filter =
          filter &&
          row[questionKey as keyof Gift].includes(choices[questionKey]);
      } else if (
        typeof row[questionKey as keyof Gift] === "string" &&
        !!choices[questionKey]
      ) {
        filter =
          filter && row[questionKey as keyof Gift] === choices[questionKey];
      }
    }

    return filter;
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
        {suggestions.filter(filterSuggestions).slice(0,limit).map((x, i) => (
          <Suggestion
            photo={x.photo}
            key={`que-${i}`}
            title={x.gift}
            brand={x.brand}
            link={x.link}
          />
        ))}
      </div>
      <div id="more-button">
        <button id="button_moreSuggestions" onClick={() => {setLimit(limit+1);}}>
          More
        </button>      
      </div>
      
    </div>
  );

  function increaseLimit() {
    setLimit(limit + 3);
  }

}

export default Suggestions;
