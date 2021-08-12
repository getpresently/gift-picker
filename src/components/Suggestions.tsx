import { useIdeas } from "../utils/hooks";
import { Gift } from "../utils/types";
import Suggestion from "./Suggestion";

interface PropTypes {
  choices: { [key: string]: string };
}

function Suggestions({ choices }: PropTypes): JSX.Element {
  const { data: suggestions } = useIdeas();
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
    <div className="columns">
      {suggestions.filter(filterSuggestions).map((x, i) => (
        <Suggestion
          key={`que-${i}`}
          title={x.gift}
          brand={x.brand}
          photo={x.photo}
          link={x.link}
        />
      ))}
    </div>
  );
}

export default Suggestions;
