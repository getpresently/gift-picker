import Loading from "./Loading";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
  page: number;
  pageCount: number;
  choices: { [key: string]: Set<string> };
  questions: any[];
}

// creates questions with attributes from google sheet
function Questions({
  handleSelectChoice,
  page,
  pageCount,
  choices,
  questions,
}: PropTypes): JSX.Element {
  let questionArr = questions.map((answerTexts, questionId) => (
    <Question
      key={`que-${questionId}`}
      title={answerTexts.question}
      questionKey={answerTexts.questionKey}
      isSingleSelect={answerTexts.isSingleSelect}
      choices={answerTexts.answers}
      selectedChoices={choices[answerTexts.questionKey]}
      handleSelectChoice={handleSelectChoice}
      currentPage={page}
      pageCount={pageCount}
      infoText={answerTexts.info}
    />
  ));

  return questions.length === 0 ? (
    <Loading />
  ) : (
    <div id="questionsContainer">
      {questionArr[page - 1]}
      {!questions[page - 1].isSingleSelect && (
        <p className="text-s text-gray-400 pb-2 pt-4">Select multiple</p>
      )}
    </div>
  );
}

export default Questions;
