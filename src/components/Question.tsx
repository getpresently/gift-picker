import { useState } from "react";

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
  const [color, setColor] = useState("#a060fb60");
  const [textColor, setTextColor] = useState("black");

  function handleClick() {
    handleSelectChoice(questionKey, answer);
    setColor("#a160fb");
    setTextColor("white");
  }

  return (
    <div onClick={handleClick}>
      <div>
        <button style={{ backgroundColor: color, color: textColor }}>
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
