import { useQuestions } from "../utils/hooks";
import Question from "./Question";

function Questions(): JSX.Element {
  const { data: questions } = useQuestions();

  return (
    <div className="questionsContainer">
      {questions.map((x, i) => (
        <Question key={`que-${i}`} title={x.question} choices={x.answers} />
      ))}
    </div>
  );
}

export default Questions;
