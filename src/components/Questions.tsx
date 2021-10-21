import { useQuestions } from "../utils/hooks";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (k: string, v: string) => void;
  page: number;
}

function Questions({ handleSelectChoice, page }: PropTypes): JSX.Element {
  const { data: questions } = useQuestions();

  let questionArr = questions.map((x, i) => (
    <Question
      key={`que-${i}`}
      title={x.question}
      questionKey={x.questionKey}
      choices={x.answers}
      handleSelectChoice={handleSelectChoice}
    />
  ));

  console.log(page);

  return <div id="questionsContainer">{questionArr[page - 1]}</div>;
}

export default Questions;
