import { useEffect } from "react";
import { useQuestions } from "../utils/hooks";
import { useTimer } from 'react-timer-hook';
import Loading from "./Loading";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
  page: number;
  choices: { [key: string]: Set<string> };
}

// creates questions with attributes from google sheet
function Questions({
  handleSelectChoice,
  page,
  choices,
}: PropTypes): JSX.Element {
  // start the timer when component mounts
  const time = new Date();
  time.setSeconds(time.getSeconds() + 3); // 3 seconds for gif to fully display load
  const { isRunning } = useTimer({ expiryTimestamp: time, onExpire: () => console.warn('onExpire called') });

  const { data: questions, loading: isLoading } = useQuestions();
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
    />
  ));

  return isLoading || isRunning ? (
    <Loading></Loading>
  ) : (
    <div id="questionsContainer">{questionArr[page - 1]}</div>
  );
}

export default Questions;
