import fetch from "unfetch";
import useSWR from "swr";

const IdeasSource =
  "https://v1.nocodeapi.com/qlangstaff/google_sheets/cIMNrJLsqTxDGZCn?tabId=Gifts&perPage=500&page=1&valueRenderOption=FORMATTED_VALUE?";

const QuestionsSource =
  "https://v1.nocodeapi.com/qlangstaff/google_sheets/cIMNrJLsqTxDGZCn?tabId=Q&A&perPage=4&page=1&valueRenderOption=FORMATTED_VALUE";

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

export function useQuestions() {
  const { data } = useSWR(QuestionsSource, fetcher);
  console.log(data);

  return {
    data,
  };
}
