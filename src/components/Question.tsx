import { useEffect, useState } from "react";
//import React from "react";

interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];
  isSingleSelect: boolean;
  selectedChoices: Set<string>;
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
}

interface ChoiceProps   {
  questionKey: string;
  answer: string;
  partOfSingleSelect: boolean;
  isActive: boolean;
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
}

function Choice({ questionKey, answer, partOfSingleSelect, isActive, handleSelectChoice }: ChoiceProps) {

  // inactive color settings
  const inactiveColor = "#a060fb60";
  const inactiveTextColor = "black"

  // active color 
  const activeColor = "#a160fb";
  const activeTextColor = "white";

  // default to inactive color
  const [color, setColor] = useState(inactiveColor);
  const [textColor, setTextColor] = useState(inactiveTextColor);

  // changes color according to if is active
  useEffect(() => {
    if (isActive) {
      setColor(activeColor);
      setTextColor(activeTextColor);
    } else {
      setColor(inactiveColor);
      setTextColor(inactiveTextColor);
    }
  }, [isActive]);

  function handleClick() {
    handleSelectChoice(partOfSingleSelect, questionKey, answer);
  }

  return (
    <div onClick={handleClick} >
      <div>
        <button id={answer}
          style={{ backgroundColor: color, color: textColor }}>
          {answer}
        </button>
      </div>
    </div>
  );
}

interface ChoicesProps {
  questionKey: string;
  choices: string[];
  partOfSingleSelect: boolean;
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
  selectedChoices: Set<string>;
}

function Choices({
  questionKey,
  choices,
  partOfSingleSelect,
  handleSelectChoice,
  selectedChoices,
}: ChoicesProps): JSX.Element {

  var cps: JSX.Element[];

  // creates each choice is choices
  function buildCps(): JSX.Element[] {
    cps = choices.map((x, i) => (
      <Choice
        key={`ch-${i}`}
        questionKey={questionKey}
        answer={x}
        partOfSingleSelect={partOfSingleSelect}
        isActive={selectedChoices?.has(x)}
        handleSelectChoice={handleSelectChoice}></Choice>));
    return cps
  }
  return <div> {buildCps()}</div>;
}

function Question({
  title,
  questionKey,
  choices,
  isSingleSelect,
  selectedChoices,
  handleSelectChoice,
}: QuestionProps): JSX.Element {

  return (
    <div id="questionContainer">
      <p>{title}</p>

      <div >
        <Choices
          questionKey={questionKey}
          choices={choices}
          partOfSingleSelect={isSingleSelect}
          selectedChoices={selectedChoices}
          handleSelectChoice={handleSelectChoice}
        />
      </div>
    </div>
  );
}

export default Question;
