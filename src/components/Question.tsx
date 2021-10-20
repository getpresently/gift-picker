import { useState } from "react";
import React from "react";

interface QuestionProps {
  title: string;
  questionKey: string;
  choices: string[];  
  isSingleSelect : boolean;
  handleSelectChoice: (isToAdd : boolean, isSingleSelect : boolean, k: string, v: string) => void;
}

interface ChoiceProps {
  questionKey: string;
  answer: string;
  partOfSingleSelect: boolean;
  handleSelectChoice: (isToAdd : boolean, isSingleSelect : boolean, k: string, v: string) => void;
}

function Choice({ questionKey, answer, partOfSingleSelect, handleSelectChoice }: ChoiceProps) {

  // inactive color settings
  const inactiveColor = "#a060fb60";
  const inactiveTextColor = "black"

  // active color 
  const activeColor = "#a160fb";
  const activeTextColor = "white";
  
  // default to inactive color
  const [color, setColor] = useState(inactiveColor);
  const [textColor, setTextColor] = useState(inactiveTextColor);

  // active = true if selected
  const [active, setActive] = React.useState(true);

  function handleClick() {

    // toggle if has been selected
    setActive(!active);

    // changes color according to if is active
    if (active) {
      setColor(activeColor);
      setTextColor(activeTextColor);
    } else {
      setColor(inactiveColor);
      setTextColor(inactiveTextColor);
    }

    // tells how the state of "choices" in App.tsx should be changed
    // if Single select, will override if new choice selected or delete itself if the same choice was selected
    if (partOfSingleSelect && active) {
      handleSelectChoice(true, partOfSingleSelect, questionKey, answer);
    } else if (partOfSingleSelect && !active) {
      handleSelectChoice(false, partOfSingleSelect, questionKey, answer);
    }
        // if multiselect, will add to current choices selected or delete itself from that list if it was already part of it
      else if (!partOfSingleSelect && active) {
      handleSelectChoice(true, partOfSingleSelect, questionKey, answer);
    } else if (!partOfSingleSelect && !active) {
      handleSelectChoice(false, partOfSingleSelect, questionKey, answer);
    }
  }

  return (
    <div onClick={handleClick} > 
      <div>
        <button id = {answer} 
        style = {{backgroundColor: color, color: textColor }}>
          {answer}
        </button>
      </div>
    </div>
    
  );
}

interface ChoicesProps {
  questionKey: string;
  choices: string[];
  partOfSingleSelect: boolean;
  handleSelectChoice: (isToAdd : boolean, isSingleSelect: boolean, k: string, v: string) => void;
}

function Choices({
  questionKey,
  choices,
  partOfSingleSelect,
  handleSelectChoice,
}: ChoicesProps): JSX.Element {

  var cps : JSX.Element[];

  function buildCps() :JSX.Element[]{
    cps  = choices.map((x, i) =>(
    <Choice 
      key={`ch-${i}`}
      questionKey={questionKey}
      answer={x}
      partOfSingleSelect = {partOfSingleSelect}
      handleSelectChoice={handleSelectChoice}></Choice>));

    return cps}
   
  // should somehow access all choices and render them through cps?
  //function handleClick() {}



  return <div> {buildCps()}</div>;
}

function Question({
  title,
  questionKey,
  choices,
  isSingleSelect, 
  handleSelectChoice,
}: QuestionProps): JSX.Element {

  //function handleClick() {}

  return (
    <div id="questionContainer"> 
      <p>{title}</p>

      <div > 
        <Choices
          questionKey={questionKey}
          choices={choices}  
          partOfSingleSelect = {isSingleSelect}
          handleSelectChoice={handleSelectChoice}
        />
      </div>
    </div>
  );
}

export default Question;
