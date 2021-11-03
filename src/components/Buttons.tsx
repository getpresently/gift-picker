interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number
}

// buttons for horizontal question navigation
function Buttons({ handlePageChange, handleSubmit, currentPage, numPages }: PropTypes): JSX.Element {

  const prev = (
    <button
      className="button_nav"
      onClick={() => handlePageChange(false)}
    >
      Previous
    </button>
  );
  const next = (
    <button
      className="button_nav"
      onClick={() => handlePageChange(true)}
    >
      Next
    </button>
  );
  const submit = (
    <button
      className="button_nav"
      onClick={() => handleSubmit()}
    >
      SUBMIT
    </button>
  )

  if (currentPage === 1) {
    return (
      <div className="buttonContainer">
        {next}
      </div>
    );
  } else if (currentPage === numPages) {
    return (
      <div className="buttonContainer">
        {prev} {submit}
      </div>
    );
  } else {
    return (
      <div className="buttonContainer">
        {prev} {next}
      </div>
    );
  }
}

export default Buttons;
