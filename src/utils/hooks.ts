import {useEffect, useState} from 'react';
import fetch from 'unfetch';

import {Gift, QAndA} from './types';

const IdeasSource =
  'https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=Gifts';

const QuestionsSource =
  'https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=QandA';

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

export function useIdeas(): { data: Gift[]; loading: boolean } {
  const {data: response, loading} = useFetch(IdeasSource);

  if (!response) {
    return {
      data: [],
      loading: true,
    };
  }

  const temp: Gift[] = [];
  for (const row of response.data) {
    let g: Gift = {
      gift: '',
      brand: '',
      Age: [],
      Type: [],
      Interests: [],
      Price: [],
      actualPrice: [],
      photo: '',
      link: '',
      groupLink: '',
      status: '',
    };
    for (const key of Object.keys(row)) {
      if (key === 'Gift') {
        g.gift = row[key];
      } else if (key === 'Brand') {
        g.brand = row[key];
      } else if (key === 'Age') {
        g.Age = row[key].split(',').map((x: string) => x.trim());
      } else if (key === 'Type') {
        g.Type = row[key].split(',').map((x: string) => x.trim());
      } else if (key === 'Interests') {
        g.Interests = row[key].split(',').map((x: string) => x.trim());
      } else if (key === 'Price') {
        g.Price = row[key].split(',').map((x: string) => x.trim());
      } else if (key === 'PriceActual') {
        g.actualPrice = row[key].split(',').map((x: string) => x.trim());
      } else if (key === 'PhotoAddress') {
        g.photo = row[key];
      } else if (key === 'Link') {
        g.link = row[key];
      } else if (key === 'Status') {
        g.status = row[key];
      }
    }
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
    temp.push(g);
  }

  return {
    data: temp,
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
      question: '',
      questionKey: '',
      isSingleSelect: false,
      answers: [],
    };
    for (const key of Object.keys(row)) {
      if (key === 'Question') {
        qa.question = row[key];
      } else if (key === 'QuestionKey') {
        qa.questionKey = row[key];
      } else if (key === 'SelectType') {
        qa.isSingleSelect = row[key] === 'single';
      } else if (key.slice(0, 1) === 'A') {
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
      question: '',
      questionKey: '',
      isSingleSelect: false,
      answers: [],
    };
    for (const key of Object.keys(row)) {
      if (key === 'Question') {
        qa.question = row[key];
      } else if (key === 'QuestionKey') {
        qa.questionKey = row[key];
      } else if (key === 'SelectType') {
        qa.isSingleSelect = row[key] === 'single';
      } else if (key.slice(0, 1) === 'A') {
        qa.answers.push(row[key]);
      }
    }

    temp.push(qa);
  }

  return temp;
}
