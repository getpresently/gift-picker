import React from "react";
import { useIdeas } from "../utils/hooks";
import { Gift } from "../utils/types";
import Suggestion from "./Suggestion";

interface PropTypes {
  choices: { [key: string]: string };
}

const LIMIT_INCREMENT = 3;


function Suggestions({ choices }: PropTypes): JSX.Element {
  const { data: suggestions } = useIdeas();
  const [limit, setLimit] = React.useState(LIMIT_INCREMENT);
  const [moreDisabled, setMoreDisabled] = React.useState(false);
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

  const increaseLimitAndDisableMore = () => {
    setLimit(limit + LIMIT_INCREMENT);
    if(limit+LIMIT_INCREMENT >= suggestions.filter(filterSuggestions).length) {
      setMoreDisabled(true);
    }
  };

  return (
    <div>
      <div id="top">
        <p>The top gift suggestions based on your answers:</p>
      </div>
      <div className="line">
        <hr></hr>
      </div>
      <div className="columns">
        {suggestions
          .filter(filterSuggestions)
          .slice(0, limit)
          .map((x, i) => (
            <Suggestion
              photo={x.photo}
              key={`que-${i}`}
              title={x.gift}
              brand={x.brand}
              link={x.link}
            />
          ))}
      </div>
      <br />
      <button
        id="button_moreSuggestions"
        disabled = {moreDisabled}
        onClick={() => increaseLimitAndDisableMore()}
      >
        More
      </button>
    </div>
  );
}

export default Suggestions;
