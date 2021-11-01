import { useEffect, useState } from "react";

interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];
  isSingleSelect: boolean;
  selectedChoices: Set<string>;
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
}

interface ChoiceProps {
  questionKey: string;
  answer: string;
  partOfSingleSelect: boolean;
  isActive: boolean;
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
}

function Choice({
  questionKey,
  answer,
  partOfSingleSelect,
  isActive,
  handleSelectChoice,
}: ChoiceProps) {
  // inactive color settings
  const INACTIVE_COLOR = "#a060fb60";
  const INACTIVE_TEXT_COLOR = "black";

  // active color
  const ACTIVE_COLOR = "#a160fb";
  const ACTIVE_TEXT_COLOR = "white";

  // default to inactive color
  const [color, setColor] = useState(INACTIVE_COLOR);
  const [textColor, setTextColor] = useState(INACTIVE_TEXT_COLOR);

  // changes color according to if is active
  useEffect(() => {
    if (isActive) {
      setColor(ACTIVE_COLOR);
      setTextColor(ACTIVE_TEXT_COLOR);
    } else {
      setColor(INACTIVE_COLOR);
      setTextColor(INACTIVE_TEXT_COLOR);
    }
  }, [isActive]);

  function handleClick() {
    handleSelectChoice(partOfSingleSelect, questionKey, answer);
  }

  return (
    <div onClick={handleClick}>
      <div>
        <button
          id={answer}
          style={{ backgroundColor: color, color: textColor }}
        >
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

  // creates each choice from choices
  function buildCps(): JSX.Element[] {
    cps = choices.map((x, i) => (
      <Choice
        key={`ch-${i}`}
        questionKey={questionKey}
        answer={x}
        partOfSingleSelect={partOfSingleSelect}
        isActive={selectedChoices?.has(x)}
        handleSelectChoice={handleSelectChoice}
      ></Choice>
    ));
    return cps;
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
      <div>
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
