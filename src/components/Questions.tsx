import { useQuestions } from "../utils/hooks";
import Question from "./Question";

function Questions(): JSX.Element {
  const { data: questions } = useQuestions();

  return (
    <div>
      {/* {questions.map((x: Object) => (
        <Question {...x} />
      ))} */}
    </div>
  );
}

export default Questions;
