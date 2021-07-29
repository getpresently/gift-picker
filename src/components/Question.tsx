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
    <div>
      {choices.map((x) => (
        <div onClick={onSelect}>{x}</div>
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
