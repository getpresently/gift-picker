import React from "react";
import { useState } from 'react';

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

  const [color, setColor] = useState("#a060fb60");
  const [textColor, setTextColor] = useState("black");

  return (
    <div className="choicesContainer">
      {choices.map((x, i) => (
        <div
          key={`ch-${i}`}
          onClick={() => {
            handleClick(x);
            setColor("#a160fb");
            setTextColor("white");
          }}
        >
          <div>
            <button style={{background:color,color:textColor}}>{x}</button>
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
    <div id="questionContainer">
      <p>{title}</p>

      <div>
        <Choices
          questionKey={questionKey}
          choices={choices}
          handleSelectChoice={handleSelectChoice}
        />
      </div>
    </div>
  );
}

export default Question;
