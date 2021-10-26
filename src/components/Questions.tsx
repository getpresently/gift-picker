import { useQuestions } from "../utils/hooks";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (k: string, v: string) => void;
  page: number;
  selected: { [key: string]: string };
}

function Questions({ handleSelectChoice, page, selected }: PropTypes): JSX.Element {
  const { data: questions } = useQuestions();

  let questionArr = questions.map((x, i) => (
    <Question
      key={`que-${i}`}
      title={x.question}
      questionKey={x.questionKey}
      choices={x.answers}
      selected={selected}
      handleSelectChoice={handleSelectChoice}
    />
  ));

  return <div id="questionsContainer">{questionArr[page - 1]}</div>;
}

export default Questions;
