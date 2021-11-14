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
        {isActive ? <button className="w-40 h-12 bg-selected text-gray-600 font-bold py-2 px-4 rounded-full"
        >
          {answer}
        </button> :
          <button className="w-40 h-12 bg-unselected hover:text-selected text-gray-600 font-bold py-2 px-4 rounded-full"
          >
            {answer}
          </button>}
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
    <div className="inline-grid grid-cols-3 gap-x-4 gap-y-4">
      {choices.map((answerText, questionId) => (
        <div>
          <Choice
            key={`ch-${questionId}`}
            questionKey={questionKey}
            answer={answerText}
            partOfSingleSelect={partOfSingleSelect}
            isActive={selectedChoices?.has(answerText)}
            handleSelectChoice={handleSelectChoice}
          />
        </div>
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
