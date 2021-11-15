import { useEffect, useState } from "react";

interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
  choices: { [key: string]: Set<string> };
}

const QUESTION_KEYS = ["Age", "Type", "Interests", "Price"]

// buttons for horizontal question navigation
function Buttons({ handlePageChange, handleSubmit, currentPage, numPages, choices }: PropTypes): JSX.Element {
  const [nextDisable, setNextDisable] = useState(true);

  useEffect(() => {
    let i = QUESTION_KEYS[currentPage - 1]
    setNextDisable(!(choices[i] !== undefined && choices[i].size > 0));
  }, [choices, currentPage])

  return (
    <>
      {currentPage > 1 && (
        <button className="bg-transparent text-midGrey border border-midGrey py-2 px-4 rounded button_nav" onClick={() => handlePageChange(false)}>
          Previous
        </button>
      )}
      {currentPage < numPages ? (
        <button className="bg-deepGrey hover:bg-black text-white font-bold py-2 px-4 h-1/4 rounded button_nav " disabled={nextDisable}
          onClick={() => {
            handlePageChange(true)
          }}>
          Next
        </button>
      ) : (
        <button className="bg-deepGrey hover:bg-black text-white font-bold py-2 px-4 rounded button_nav" disabled={nextDisable} onClick={handleSubmit}>
          Done
        </button>
      )}
    </>
  );
}

export default Buttons;
