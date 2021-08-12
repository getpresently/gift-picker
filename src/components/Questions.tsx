import { useQuestions } from "../utils/hooks";
import Question from "./Question";

function Questions({ handleSelectChoice }): JSX.Element {
  const { data: questions } = useQuestions();

  return (
    <div className="questionsContainer">
      {questions.map((x, i) => (
        <Question key={`que-${i}`} title={x.question} choices={x.answers} handleSelectChoice={x.handleSelectChoice}/>
      ))}
    </div>
  );
}

export default Questions;
