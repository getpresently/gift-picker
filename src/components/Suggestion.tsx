import { TargetElement } from "@testing-library/user-event";
import {Link} from "react-router-dom";
import "./Suggestion.css"
import placeHolder from "../placeholder.png"
interface SuggestionProps {
  index: String;
  title: string;
  brand: string;
  photo: string;
  price: string[];
  actualPrice: string;
  link: string;
  groupLink: string;
}
function addDefaultSrc(ev: any) {
  ev.target.src = placeHolder
}
function Suggestion({
  index,
  title,
  brand,
  photo,
  price,
  actualPrice,
  link,
  groupLink,
}: SuggestionProps): JSX.Element {
  return (
    <Link style={{textDecoration: "none"}} to={`/gift/${index}`} >
    <div className="column">
      <img onError={addDefaultSrc} src={photo} alt="{photo}" />
      <div className="suggestion_MetaData">
        <p id="suggestion_Brand">By {brand}</p>
        <p id="suggestion_Title">{title}</p>
        <p id="suggestion_Price"> {actualPrice}</p>
        <div>
          <button id="card_button">
            <a href={link} target="_blank" rel="noreferrer">
              View Gift
            </a>
          </button>
          <button id="card_button">
            <a href={groupLink} target="_blank" rel="noreferrer">
              Split Cost
            </a>
          </button>
        </div>

      </div>
    </div>
    </Link>
  );
}

export default Suggestion;
