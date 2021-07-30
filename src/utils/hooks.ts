import { useEffect, useState } from "react";
import fetch from "unfetch";

import { QAndA, Gift } from "./types";

const IdeasSource = "https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=Gifts";

const QuestionsSource = "https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=QandA";

export function useFetch(url: string): { data: any; loading: boolean } {
  const [data, setData] = useState();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(url)
      .then((response) => response.json())
      .then((response) => {
        setData(response);
        setLoading(false);
      });
  }, [url]);

  return {
    data,
    loading,
  };
}

export function useIdeas(): { data: Gift[]; loading: boolean } {
  const { data: response, loading } = useFetch(QuestionsSource);

  if (!response) {
    return {
      data: [],
      loading: true,
    };
  }

  const temp: Gift[] = [];
  for (const row of response.data) {
    // Clean and extract data here like in useQuestions
  }

  return {
    data: temp,
    loading,
  };
}

export function useQuestions(): { data: QAndA[]; loading: boolean } {
  const { data: response, loading } = useFetch(QuestionsSource);

  if (!response) {
    return {
      data: [],
      loading: true,
    };
  }

  const temp: QAndA[] = [];
  for (const row of response.data) {
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

    temp.push(qa);
  }

  return {
    data: temp,
    loading,
  };
}
