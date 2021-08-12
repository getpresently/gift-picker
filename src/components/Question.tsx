import React from "react";

interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];
  handleSelectChoice: (k: string, v: string) => void;
}

interface ChoicesProps {
  questionKey: string;
  choices: string[];
  handleSelectChoice: (k: string, v: string) => void;
}

function Choices({
  questionKey,
  choices,
  handleSelectChoice,
}: ChoicesProps): JSX.Element {
  function handleClick(answer: string) {
    handleSelectChoice(questionKey, answer);
  }

  return (
    <div className="choicesContainer">
      {choices.map((x, i) => (
        <div
          key={`ch-${i}`}
          onClick={() => {
            handleClick(x);
          }}
        >
          <div>
            <button>{x}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Question({
  title,
  questionKey,
  choices,
  handleSelectChoice,
}: QuestionProps): JSX.Element {
  return (
    <div className="questionContainer">
      <p>{title}</p>

      <div>
        <Choices
          questionKey={questionKey}
          choices={choices}
          handleSelectChoice={handleSelectChoice}
        />
      </div>
      <br></br>
    </div>
  );
}

export default Question;
