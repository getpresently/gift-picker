import {useEffect, useState} from 'react';
import fetch from 'unfetch';

import {Gift, QAndA} from './types';

const IdeasSource =
  'https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=Gifts';

const QuestionsSource =
  'https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=QandA';

const EmailsSource =
  "https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=Emails";

// handles email capture
export function postEmail(email: string): void {
  try {
    fetch(EmailsSource, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify([[email]]),
    }).then((res) => {
      if (!res.ok) {
        Promise.reject();
      }
    });
  } catch (error) {
    console.log(error);
  }
}

export function useFetch(url: string): { data: any; loading: boolean } {
  const [data, setData] = useState();
  const [loading, setLoading] = useState<boolean>(true); // generic (<boolean>) stores structure shape of the state

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

export function fetchURL(url: string): Promise<any> {
  return fetch(url)
    .then((response) => response.json())
    .then((response) => {
      return response.data;
    });
}

function instantiateGifts(data: any): Array<Gift> {
  const gifts: Gift[] = [];
  for (const row of data) {
    let g: Gift = {
      rowId: '',
      gift: '',
      brand: '',
      description: '',
      Age: [],
      Type: [],
      Interests: [],
      Price: [],
      actualPrice: '',
      photo: '',
      link: '',
      mailToLink: '',
      smsToLink: '',
      groupLink: '',
      status: '',
    };
    for (const key of Object.keys(row)) {
      if (key === "row_id") {
        g.rowId = row[key];
      } else if (key === "Gift") {
        g.gift = row[key];
      } else if (key === "Brand") {
        g.brand = row[key];
      } else if (key === "Description") {
        g.description = row[key];
      } else if (key === "Age") {
        g.Age = row[key].split(",").map((x: string) => x.trim());
      } else if (key === "Type") {
        g.Type = row[key].split(",").map((x: string) => x.trim());
      } else if (key === "Interests") {
        g.Interests = row[key].split(",").map((x: string) => x.trim());
      } else if (key === "Price") {
        g.Price = row[key].split(",").map((x: string) => x.trim());
      } else if (key === "PriceActual") {
        g.actualPrice = row[key].toString();
      } else if (key === "PhotoAddress") {
        g.photo = row[key];
      } else if (key === "Link") {
        g.link = row[key];
      } else if (key === "Mailto") {
        g.mailToLink = row[key].substring(0, row[key].length - 1);
      } else if (key === "Sms") {
        g.smsToLink = row[key].substring(0, row[key].length - 1);
      } else if (key === "Status") {
        g.status = row[key];
      }
    }

    //edit mailToLink and smsToLink
    g.mailToLink = g.mailToLink.concat(g.rowId.toString());
    g.smsToLink = g.smsToLink.concat(g.rowId.toString());

    g.groupLink = g.groupLink.concat(
      'https://getpresently.com/go/set-up-your-group-gift/?wpf3087_209=',
      g.gift,
      ' by ',
      g.brand,
      '&wpf3087_88=',
      g.photo,
      '&wpf3087_207=Add%20gift%20link&wpf3087_195=',
      g.Price.toString(),
      '&refsc=giftpicker',
    );
    gifts.push(g);
  }

  return gifts;
}

export function useIdeas(): { data: Gift[]; loading: boolean } {
  const {data: response, loading} = useFetch(IdeasSource);

  if (!response) {
    return {
      data: [],
      loading: true,
    };
  }

  return {
    data: instantiateGifts(response.data),
    loading,
  };
}

export function useQuestions(): { data: QAndA[]; loading: boolean } {
  const {data: response, loading} = useFetch(QuestionsSource);

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
      questionKey: "",
      maxSelectable: 0,
      answers: [],
    };
    for (const key of Object.keys(row)) {
      if (key === "Question") {
        qa.question = row[key];
      } else if (key === "QuestionKey") {
        qa.questionKey = row[key];
      } else if (key === "MaxSelectable") {
        qa.maxSelectable = parseInt(row[key]);
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

export async function getQuestions(): Promise<Array<any>> {
  const data = await fetchURL(QuestionsSource);

  const temp: QAndA[] = [];
  for (const row of data) {
    let qa: QAndA = {
      question: "",
      questionKey: "",
      maxSelectable: 0,
      answers: [],
    };
    for (const key of Object.keys(row)) {
      if (key === "Question") {
        qa.question = row[key];
      } else if (key === "QuestionKey") {
        qa.questionKey = row[key];
      } else if (key === 'MaxSelectable') {
        qa.maxSelectable = parseInt(row[key]);
      } else if (key.slice(0, 1) === 'A') {
        qa.answers.push(row[key]);
      }
    }

    temp.push(qa);
  }

  return temp;
}

export async function getIdeas(): Promise<Array<Gift>> {
  const data = await fetchURL(IdeasSource);
  return instantiateGifts(data);
}
