import fetch from "unfetch";
import useSWR from "swr";

import { QAndA } from "./types";

const IdeasSource = "https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=Gifts";

const QuestionsSource = "https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=QandA";

function fetcher(url: string) {
  return fetch(url).then((response) => response.json());
}

export function useIdeas() {
  const { data } = useSWR(IdeasSource, fetcher);
  console.log(data);

  return {
    data,
  };
}

export function useQuestions(): { data: QAndA[] } {
  const response: QAndA[] = [];
  const { data } = useSWR(QuestionsSource, fetcher);

  for (const row of data.data) {
    let qa: QAndA = {
      question: "",
      answers: [],
    };
    for (const key of Object.keys(row)) {
      if (key === "Q") {
        qa.question = row[key];
      } else if (key.slice(0, 1) === "A") {
        qa.answers.push(row[key]);
      }
    }

    response.push(qa);
  }

  return {
    data: response,
  };
}
