interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];
  maxSelectable: number;
  selectedChoices: Set<string>;
  currentPage: number;
  pageCount: number;
  handleSelectChoice: (maxSelectable: number, k: string, v: string) => void;
}

interface ChoiceProps {
  questionKey: string;
  answer: string;
  partOfMaxSelectable: number;
  isActive: boolean;
  handleSelectChoice: (maxSelectable: number, k: string, v: string) => void;
}

function Choice({
  questionKey,
  answer,
  partOfMaxSelectable,
  isActive,
  handleSelectChoice,
}: ChoiceProps) {
  function handleClick() {
    handleSelectChoice(partOfMaxSelectable, questionKey, answer);
  }

  return (
    <div onClick={handleClick}>
      {isActive ? <button className="choiceButtons w-60 md:w-64 bg-selected text-white py-2 px-4 rounded-full"
      >
        {answer}
      </button> :
        <button className="choiceButtons w-60 md:w-64 bg-unselected hover:text-selected text-gray-500 py-2 px-4 rounded-full"
        >
          {answer}
        </button>}
    </div>
  );
}

interface ChoicesProps {
  questionKey: string;
  choices: string[];
  partOfMaxSelectable: number;
  handleSelectChoice: (maxSelectable: number, k: string, v: string) => void;
  selectedChoices: Set<string>;
}

function Choices({
  questionKey,
  choices,
  partOfMaxSelectable,
  handleSelectChoice,
  selectedChoices,
}: ChoicesProps): JSX.Element {
  return (
    <div className={`inline-grid ${questionKey === "Type" ? 'grid-cols-1' : (questionKey === "Interests" ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4')} gap-x-4 gap-y-4`}>
      {choices.map((answerText, questionId) => (
        <div className={`${questionKey === "Interests" ? "col-span-1" : "col-span-2"} ${(questionKey === "Price" || questionKey === "Relation") && (answerText === "Any budget" || answerText === "Mentor/Teacher") && "md:col-start-2"}`}>
          <Choice
            key={`ch-${questionId}`}
            questionKey={questionKey}
            answer={answerText}
            partOfMaxSelectable={partOfMaxSelectable}
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
  maxSelectable,
  selectedChoices,
  handleSelectChoice,
  currentPage,
  pageCount
}: QuestionProps): JSX.Element {
  return (
    <div id="questionContainer">
      <h2 className="text-xs ... text-gray-400 pb-2 text-center"> QUESTION {currentPage} OF {pageCount} </h2>
      <p className="text-2xl ... text-gray-100 font-normal">{title}</p>
      <div id="choiceContainer">
        <Choices
          questionKey={questionKey}
          choices={choices}
          partOfMaxSelectable={maxSelectable}
          selectedChoices={selectedChoices}
          handleSelectChoice={handleSelectChoice}
        />
      </div>
    </div>
  );
}

export default Question;
