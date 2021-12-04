export interface QAndA {
  question: string;
  questionKey: string;
  isSingleSelect: boolean;
  answers: string[];
}

export interface Gift {
  rowId: String;
  gift: string;
  brand: string;
  description: String;
  Age: string[];
  Type: string[];
  Interests: string[];
  Price: string[];
  actualPrice: string;
  photo: string;
  link: string;
  groupLink: string;
  status: string;
}
