import { useQuestions } from "../utils/hooks";
import Question from "./Question";

interface PropTypes {
  handleSelectChoice: (isSingleSelect: boolean, k: string, v: string) => void;
  choices: { [key: string]: Set<string> };
}

// creates questions with attributes from google sheet
function Questions({ handleSelectChoice, choices }: PropTypes): JSX.Element {
  const { data: questions } = useQuestions();

  return (
    <div id="questionsContainer">
      {questions.map((x, i) => (
        <Question
          key={`que-${i}`}
          title={x.question}
          questionKey={x.questionKey}
          isSingleSelect={true}
          choices={x.answers}
          selectedChoices={choices[x.questionKey]}
          handleSelectChoice={handleSelectChoice}
        />
      ))}
    </div>
  );
}

export default Questions;
