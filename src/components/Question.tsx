import { useState } from "react";

interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];
  handleSelectChoice: (k: string, v: string) => void;
  selected: { [key: string]: string };
}

interface ChoiceProps {
  questionKey: string;
  answer: string;
  handleSelectChoice: (k: string, v: string) => void;
  selected: boolean;
}

function Choice({ questionKey, answer, handleSelectChoice, selected }: ChoiceProps) {
  const [color, setColor] = useState("#a060fb60");
  const [textColor, setTextColor] = useState("black");

  function handleClick() {
    handleSelectChoice(questionKey, answer);
    setColor("#a160fb");
    setTextColor("white");
  }

  let backgroundClr = color;
  let textClr = textColor;
  if (selected) {
    backgroundClr = "#a160fb";
    textClr = "white";
  }

  return (
    <div onClick={handleClick}>
      <div>
        <button style={{ backgroundColor: backgroundClr, color: textClr }}>
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
  selected: { [key: string]: string };
}

function Choices({
  questionKey,
  choices,
  handleSelectChoice,
  selected
}: ChoicesProps): JSX.Element {
  let isSelected = false;
  return (
    <div className="choicesContainer">
      {console.log(choices)}
      {console.log(selected)}
      
      {choices.map((x, i) => {
        if (Object.values(selected).includes(x)) {
          isSelected = true;
        } else {
          isSelected = false;
        }
        console.log(isSelected);
        return (<Choice
          key={`ch-${i}`}
          questionKey={questionKey}
          answer={x}
          handleSelectChoice={handleSelectChoice}
          selected={isSelected}
        />)
      })}
    </div>
  );
}

function Question({
  title,
  questionKey,
  choices,
  handleSelectChoice,
  selected
}: QuestionProps): JSX.Element {
  return (
    <div id="questionContainer">
      <p>{title}</p>
      <div>
        <Choices
          questionKey={questionKey}
          choices={choices}
          handleSelectChoice={handleSelectChoice}
          selected={selected}
        />
      </div>
    </div>
  );
}

export default Question;
