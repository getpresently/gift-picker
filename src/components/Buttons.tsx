interface PropTypes {
  handlePageChange: (next: boolean) => void;
  handleSubmit: () => void;
  currentPage: number;
  numPages: number;
  disabled: boolean;
}

// buttons for horizontal question navigation
function Buttons({
  handlePageChange,
  handleSubmit,
  currentPage,
  numPages,
  disabled
}: PropTypes): JSX.Element {
  const prev = (
    <div id="previousButton">
      <button id="button_changeScene" disabled={disabled} onClick={() => handlePageChange(false)}>
        Previous
      </button>
    </div>
  );
  const next = (
    <div id="nextButton">
      <button id="button_changeScene" disabled={disabled} onClick={() => handlePageChange(true)}>
        Next
      </button>
    </div>
  );
  const submit = (
    <div id="submitButton">
      <button id="button_changeScene" disabled={disabled} onClick={() => handleSubmit()}>
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
