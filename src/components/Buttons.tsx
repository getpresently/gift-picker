interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number
}

// buttons for horizontal question navigation
function Buttons({ handlePageChange, handleSubmit, currentPage, numPages }: PropTypes): JSX.Element {
  return (
    <>
      {currentPage > 1 && (
        <button id="button_changeScene" onClick={() => handlePageChange(false)}>
          Previous
        </button>
      )}
      {currentPage < numPages ? (
        <button id="button_changeScene" onClick={() => handlePageChange(true)}>
          Next
        </button>
      ) : (
        <button id="button_changeScene" onClick={handleSubmit}>
          SUBMIT
        </button>
      )}
    </>
  );
}

export default Buttons;
