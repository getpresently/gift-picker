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
    <div className="choicesContainer">
      {choices.map((x, i) => (
        <div key={`ch-${i}`} onClick={onSelect}>
          <div>
          <input type="checkbox"></input>
          {x}
          </div>
        </div>
      ))}
    </div>
  );
}

function Question({ title, choices }: QuestionProps): JSX.Element {
  function handleSelectChoice() {}

  return (
    <div>
      <h2>{title}</h2>

      <div>
        <Choices choices={choices} onSelect={handleSelectChoice} />
      </div>
    </div>
  );
}

export default Question;
