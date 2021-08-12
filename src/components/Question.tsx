import React from "react";

interface QuestionProps {
  title: string;
  choices: string[];
  handleSelectChoice: () => void;
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

  // need to fill in this empty function
  // store data at App.tsx level
 
  return (
    <div className="questionContainer">
      <p>{title}</p>

      <div>
        <Choices choices={choices} onSelect={onChoice} />
      </div>
      <br></br>
    </div>
  );
}

export default Question;

