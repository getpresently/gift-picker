interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
}

// buttons for horizontal question navigation
function Buttons({ handlePageChange, handleSubmit, currentPage, numPages }: PropTypes): JSX.Element {
  return (
    <>
      {currentPage > 1 && (
        <button className="button_nav" onClick={() => handlePageChange(false)}>
          Previous
        </button>
      )}
      {currentPage < numPages ? (
        <button className="button_nav" onClick={() => handlePageChange(true)}>
          Next
        </button>
      ) : (
        <button className="button_nav" onClick={handleSubmit}>
          SUBMIT
        </button>
      )}
    </>
  );
}

export default Buttons;
