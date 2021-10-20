import { useQuestions } from "../utils/hooks";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (isToAdd : boolean, isSingleSelect : boolean, k: string, v: string) => void;
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
          // where if a question is single select is set, should be added to gsheet
          isSingleSelect = {true}
          choices={x.answers}
          handleSelectChoice={handleSelectChoice}
        />
      ))}
    </div>
  );
}

export default Questions;
