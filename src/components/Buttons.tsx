import React from "react";

interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
  choices: {[key: string]: Set<string>};
}

// buttons for horizontal question navigation
function Buttons({ handlePageChange, handleSubmit, currentPage, numPages, choices }: PropTypes): JSX.Element {
  const [nextDisable, setNextDisable] = React.useState(true);
  
  React.useEffect(() => {
    console.log(nextDisable);
    if(currentPage === 1) {
      setNextDisable(!(choices["Age"] !== undefined && choices["Age"].size > 0));
    } else if(currentPage === 2) {
      setNextDisable(!(choices["Type"] !== undefined && choices["Type"].size > 0));
    }
    else if(currentPage === 3) {
      setNextDisable(!(choices["Interests"] !== undefined && choices["Interests"].size > 0));
    }else if(currentPage === 4) {
      setNextDisable(!(choices["Price"] !== undefined && choices["Price"].size > 0));
    }
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
        <button className="button_nav" disabled={nextDisable} onClick={handleSubmit}>
          SUBMIT
        </button>
      )}
    </>
  );
}

export default Buttons;
