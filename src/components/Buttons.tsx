import { useEffect, useState } from "react";

interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
  choices: { [key: string]: Set<string> };
}

const QUESTION_KEYS = ["Age", "Relation", "Type", "Interests", "Price"]

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
        <button className="bg-transparent w-32 md:w-40 h-10 text-midGrey border border-midGrey button_nav" onClick={() => handlePageChange(false)}>
          Back
        </button>
      )}
      {currentPage < numPages ? (
        <button className="bg-deepBlack w-32 md:w-40 h-10 hover:bg-black text-white button_nav" disabled={nextDisable}
          onClick={() => {
            handlePageChange(true)
          }}>
          Next
        </button>
      ) : (
        <button className="bg-deepBlack w-32 md:w-40 h-10 hover:bg-black text-white button_nav" disabled={nextDisable} onClick={handleSubmit}>
          Finish 🎁
        </button>
      )}
    </>
  );
}

export default Buttons;
