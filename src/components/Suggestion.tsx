import "./Suggestion.css"
interface SuggestionProps {
  title: string;
  brand: string;
  photo: string;
  price: string;
  link: string;
}

function Suggestion({
  title,
  brand,
  photo,
  price,
  link,
}: SuggestionProps): JSX.Element {
  return (
    <div className="column">
      <img src={photo} alt="{photo}" />
      <div className="suggestion_MetaData">
        <p id="suggestion_Brand">By {brand}</p>
        <p id="suggestion_Title">{title}</p>
        <p id="suggestion_Price"> {price}</p>
        <div className="row">
          <button>
            <a href={link} target="_blank" rel="noreferrer">
              View Gift
            </a>
          </button>
          <button>
            <a href={link} target="_blank" rel="noreferrer">
              Split Cost
            </a>
          </button> 
        </div>
        
      </div>
    </div>
  );
}

export default Suggestion;
