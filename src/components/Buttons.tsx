import {useEffect, useState} from "react";
import { Link } from 'react-router-dom';

interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
  choices: {[key: string]: Set<string>};
}

const QUESTION_KEYS = ["Age", "Type", "Interests", "Price"]

// buttons for horizontal question navigation
function Buttons({ handlePageChange, handleSubmit, currentPage, numPages, choices }: PropTypes): JSX.Element {
  const [nextDisable, setNextDisable] = useState(true);
  
  useEffect(() => {
    let i = QUESTION_KEYS[currentPage-1]
    setNextDisable(!(choices[i] !== undefined && choices[i].size > 0));
  }, [choices, currentPage])

  return (
    <>
      {currentPage > 1 && (
        <button className="button_nav" onClick={() => handlePageChange(false)}>
          Previous
        </button>
      )}
      {currentPage < numPages ? (
        <button className="button_nav" disabled={nextDisable} 
          onClick={() => {
            handlePageChange(true)
          }}>
          Next
        </button>
      ) : (
        <Link to = "/results">
        <button className="button_nav" disabled={nextDisable} onClick={handleSubmit}>
          SUBMIT
        </button>
        </Link>
      )}
    </>
  );
}

export default Buttons;
