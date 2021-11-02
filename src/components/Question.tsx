// constants
// inactive color settings
const INACTIVE_COLOR = "#a060fb60";
const INACTIVE_TEXT_COLOR = "black";

// active color
const ACTIVE_COLOR = "#a160fb";
const ACTIVE_TEXT_COLOR = "white";

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
  function handleClick() {
    handleSelectChoice(partOfSingleSelect, questionKey, answer);
  }

  return (
    <div onClick={handleClick}>
      <div>
        <button
          id={answer}
          style={{
            backgroundColor: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
            color: isActive ? ACTIVE_TEXT_COLOR : INACTIVE_TEXT_COLOR,
          }}
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
  return (
    <div>
      {choices.map((answerText, questionId) => (
        <Choice
          key={`ch-${questionId}`}
          questionKey={questionKey}
          answer={answerText}
          partOfSingleSelect={partOfSingleSelect}
          isActive={selectedChoices?.has(answerText)}
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
