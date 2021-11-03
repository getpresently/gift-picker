import { useQuestions } from "../utils/hooks";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
  choices: { [key: string]: Set<string> };
  page: number;
}

// creates questions with attributes from google sheet
function Questions({
  handleSelectChoice,
  choices,
  page,
}: PropTypes): JSX.Element {
  const { data: questions } = useQuestions();

  let questionArr = questions.map((answerTexts, questionId) => (
    <Question
      key={`que-${questionId}`}
      title={answerTexts.question}
      questionKey={answerTexts.questionKey}
      isSingleSelect={answerTexts.isSingleSelect}
      choices={answerTexts.answers}
      selectedChoices={choices[answerTexts.questionKey]}
      handleSelectChoice={handleSelectChoice}
    />
  ));

  return <div id="questionsContainer">{questionArr[page - 1]}</div>;
}

export default Questions;
