import {useIdeas} from '../utils/hooks';
import {Gift} from '../utils/types';
import Suggestion from './Suggestion';

interface PropTypes {
  choices: { [key: string]: Set<string> };
}

function Suggestions({choices}: PropTypes): JSX.Element {
  const {data: suggestions} = useIdeas();
  const questionKeys = ['Age', 'Type', 'Interests', 'Price'];

  function filterSuggestions(row: Gift) {
    let filter = true;
    for (const questionKey of questionKeys) {
      const choice = choices[questionKey].values().next().value;
      if (Array.isArray(row[questionKey as keyof Gift]) && !!choice) {
        filter = filter && row[questionKey as keyof Gift].includes(choice);
      } else if (
        typeof row[questionKey as keyof Gift] === 'string' &&
        !!choices[questionKey]
      ) {
        filter = filter && row[questionKey as keyof Gift] === choice;
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
        {suggestions.filter(filterSuggestions).map((x, i) => (
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
