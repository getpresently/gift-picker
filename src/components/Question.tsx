import React from "react";

interface QuestionProps {
  title: string;
  choices: string[];
}

interface ChoicesProps {
  choices: string[];
  onSelect: () => void;
}

function Choices({ choices, onSelect }: ChoicesProps): JSX.Element {
  return (
    // eslint-disable-next-line react/style-prop-object
    <div className="choicesContainer">
      {choices.map((x, i) => (
        <div key={`ch-${i}`} onClick={onSelect}>
          <div>
          <button>{x}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Question({ title, choices }: QuestionProps): JSX.Element {
  function handleSelectChoice() {}

  return (
    <div className="questionContainer">
      <h2>{title}</h2>

      <div>
        <Choices choices={choices} onSelect={handleSelectChoice} />
      </div>
      <br></br>
    </div>
  );
}

export default Question;
