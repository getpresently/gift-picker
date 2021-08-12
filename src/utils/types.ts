export interface QAndA {
  question: string;
  answers: string[];
  handleSelectChoice: () => void;
}

export interface Gift {
  gift: string;
  brand: string;
  ages: string[];
  types: string[];
  interests: string[];
  budget: number;
  photo: string;
  link: string;
}
