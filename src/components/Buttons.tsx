import React from "react";

interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
  choices: {[key: string]: Set<string>};
}

// buttons for horizontal question navigation
function Buttons({
  handlePageChange,
  handleSubmit,
  currentPage,
  numPages,
  choices
}: PropTypes): JSX.Element {
  const [nextDisable, setNextDisable] = React.useState(true);
  
  React.useEffect(() => {
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
  }, [choices])

  const prev = (
    <div id="previousButton">
      <button id="button_changeScene" onClick={() => handlePageChange(false)}>
        Previous
      </button>
    </div>
  );
  const next = (
    <div id="nextButton">
      <button id="button_changeScene" disabled={nextDisable} onClick={() => {
        handlePageChange(true)
        setNextDisable(true);
      }}>
        Next
      </button>
    </div>
  );
  const submit = (
    <div id="submitButton">
      <button id="button_changeScene" disabled={nextDisable} onClick={() => handleSubmit()}>
        SUBMIT
      </button>
    </div>
  );

  if (currentPage === 1) {
    return <div>{next}</div>;
  } else if (currentPage === numPages) {
    return (
      <div>
        {prev}
        {submit}
      </div>
    );
  } else {
    return (
      <div>
        {prev}
        {next}
      </div>
    );
  }
}

export default Buttons;
