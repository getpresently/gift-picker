import { useIdeas } from "../utils/hooks";
import Suggestion from "./Suggestion";

function Suggestions(): JSX.Element {
    const { data: suggestions } = useIdeas();
        return (
        <div className="columns">
            {suggestions.map((x, i) => (
                <Suggestion key={`que-${i}`} title={x.gift} brand={x.brand} photo={x.photo} link={x.link}/>
            ))}
        </div>
        );
}

export default Suggestions;

