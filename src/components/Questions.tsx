import { useQuestions } from "../utils/hooks";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (k: string, v: string) => void;
}

function Questions({ handleSelectChoice }: PropTypes): JSX.Element {
  const { data: questions } = useQuestions();

  return (
    <div id="questionsContainer">
      {questions.map((x, i) => (
        <Question
          key={`que-${i}`}
          title={x.question}
          questionKey={x.questionKey}
          choices={x.answers}
          handleSelectChoice={handleSelectChoice}
        />
      ))}
    </div>
  );
}

export default Questions;
