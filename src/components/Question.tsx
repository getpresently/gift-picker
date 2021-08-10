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
          <button>{x}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Question({ title, choices, handleSelectChoice }: QuestionProps): JSX.Element {
  function onChoice() {
    handleSelectChoice("age", "baby");
  }
  // empty function - fill this in
  // useName is for hooks - can only be called from a component
  // store data at App.tsx level
  // at App.tsx, state i want to store there, store the choice that has been picked


  return (
    <div className="questionContainer">
      <p>{title}</p>

      <div>
        <Choices choices={choices} onSelect={handleSelectChoice} />
      </div>
      <br></br>
    </div>
  );
}

export default Question;
