interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];
  isSingleSelect: boolean;
  selectedChoices: Set<string>;
  currentPage: number;
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
      {isActive ? <button className="w-full bg-selected text-gray-600 font-bold py-2 px-4 rounded-full"
      >
        {answer}
      </button> :
        <button className="w-full bg-unselected hover:text-selected text-gray-600 font-bold py-2 px-4 rounded-full"
        >
          {answer}
        </button>}
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
  currentPage,
}: QuestionProps): JSX.Element {
  return (
    <div id="questionContainer">
    <h2 className= "text-base ... text-gray-300"> Questions {currentPage} of 4 </h2>
    <p className="text-lg ... text-gray-100">{title}</p>
      <div id="choiceContainer">
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
