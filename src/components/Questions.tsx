import { useQuestions } from "../utils/hooks";
import { useTimer } from 'react-timer-hook';
import Loading from "./Loading";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
  page: number;
  pageCount: number;
  choices: { [key: string]: Set<string> };
  setLoading: (load: boolean) => void;
}

// creates questions with attributes from google sheet
function Questions({
  handleSelectChoice,
  page,
  pageCount,
  choices,
  setLoading
}: PropTypes): JSX.Element {
  // start the timer when component mounts
  const time = new Date();
  time.setSeconds(time.getSeconds() + 2.85); // 2.85 seconds for gif to fully display load
  const { isRunning } = useTimer({ expiryTimestamp: time, onExpire: () => console.warn('onExpire called') });
  const { data: questions, loading: isLoading } = useQuestions();

  // inform app that questions are loading
  setLoading(isLoading || isRunning);
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
    />
  ));

  return isLoading || isRunning ? (
    <Loading></Loading>
  ) : (
    <div id="questionsContainer">
      {questionArr[page - 1]}
      {!questions[page - 1].isSingleSelect && <p className="text-xs text-gray-400">Select multiple</p>}
    </div>
  )
}

export default Questions;
