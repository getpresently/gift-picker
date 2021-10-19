import { useState } from "react";
import React from "react";

interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];  
  handleSelectChoice: (k: string, v: string) => void;
}

interface ChoiceProps {
  questionKey: string;
  answer: string;
  handleSelectChoice: (k: string, v: string) => void;
}

function Choice({ questionKey, answer, handleSelectChoice }: ChoiceProps) {
  const inactiveColor = "#a060fb60";
  const inactiveTextColor = "black"

  const activeColor = "#a160fb";
  const activeTextColor = "white";
  
  const [color, setColor] = useState(inactiveColor);
  const [textColor, setTextColor] = useState(inactiveTextColor);

  const [active, setActive] = React.useState(true);

  function handleClick () {
    console.log(active);
    setActive(!active);
    console.log(active);
    if (active) {
      setColor(activeColor);
      setTextColor(activeTextColor);
    } else {
      setColor(inactiveColor);
      setTextColor(inactiveTextColor);
    }
    handleSelectChoice(questionKey, answer);
  }

  return (
    <div onClick={handleClick}>
      <div>
        <button 
        style = {{backgroundColor: color, color: textColor }}>
          {answer}
        </button>
      </div>
    </div>
  );
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
  return (
    <div className="choicesContainer">
      {choices.map((x, i) => (
        <Choice
          key={`ch-${i}`}
          questionKey={questionKey}
          answer={x}
          handleSelectChoice={handleSelectChoice}
        />
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

  const [selected, setSelected] = useState([]);



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
