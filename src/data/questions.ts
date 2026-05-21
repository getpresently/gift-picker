export type Option = {
  v: string;
  l: string;
  e?: string;
  hint?: string;
};

export type ChoiceQuestion = {
  id: keyof Answers;
  label: string;
  helper: string;
  type: "choice";
  autoAdvance: true;
  options: Option[];
};

export type MultiQuestion = {
  id: keyof Answers;
  label: string;
  helper: string;
  type: "multi";
  max: number;
  bigTiles?: boolean;
  showMoreAfter?: number;
  options: Option[];
};

export type SliderQuestion = {
  id: keyof Answers;
  label: string;
  helper: string;
  type: "slider";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type Question = ChoiceQuestion | MultiQuestion | SliderQuestion;

export type Answers = {
  recipient?: string;
  age?: string;
  occasion?: string;
  interests?: string[];
  vibe?: string[];
  budget?: number;
};

export const QUESTIONS: Question[] = [
  {
    id: "recipient",
    label: "Who's this for?",
    helper: "Pick one. We won't tell.",
    type: "choice",
    autoAdvance: true,
    options: [
      { v: "partner",     l: "Partner",          e: "💞" },
      { v: "parent",      l: "Parent",           e: "🌿" },
      { v: "grandparent", l: "Grandparent",      e: "🌻" },
      { v: "friend",      l: "Friend",           e: "🫶" },
      { v: "sibling",     l: "Sibling",          e: "🎈" },
      { v: "coworker",    l: "Coworker",         e: "☕️" },
      { v: "mentor",      l: "Mentor / Teacher", e: "📚" },
      { v: "self",        l: "Treat myself",     e: "✨" },
    ],
  },
  {
    id: "age",
    label: "How old are they?",
    helper: "Helps us nail the vibe.",
    type: "choice",
    autoAdvance: true,
    options: [
      { v: "kid",    l: "Little one",  e: "🧸", hint: "under 12" },
      { v: "teen",   l: "Teenager",    e: "🎧" },
      { v: "twenty", l: "Young adult", e: "🪩", hint: "20s" },
      { v: "adult",  l: "Adult",       e: "🍷", hint: "30s–50s" },
      { v: "senior", l: "Senior",      e: "🌳", hint: "60s+" },
    ],
  },
  {
    id: "occasion",
    label: "What's the occasion?",
    helper: "Last one before the fun stuff.",
    type: "choice",
    autoAdvance: true,
    options: [
      { v: "bday",       l: "Birthday",     e: "🎂" },
      { v: "anni",       l: "Anniversary",  e: "💍" },
      { v: "holi",       l: "Holiday",      e: "🎄" },
      { v: "wed",        l: "Wedding",      e: "💌" },
      { v: "jb",         l: "Just because", e: "☀️" },
      { v: "baby",       l: "New baby",     e: "🍼" },
      { v: "housewarm",  l: "Housewarming", e: "🏠" },
      { v: "appreciate", l: "Appreciation", e: "🌷" },
      { v: "thank",      l: "Thank you",    e: "🙏" },
    ],
  },
  {
    id: "interests",
    label: "What are they into?",
    helper: "Up to 3. They're not that complicated.",
    type: "multi",
    max: 3,
    showMoreAfter: 12,
    options: [
      { v: "best",     l: "Best Sellers",          e: "🏆" },
      { v: "apparel",  l: "Apparel & Accessories", e: "👕" },
      { v: "cooking",  l: "Cooking",               e: "🍳" },
      { v: "creative", l: "Creativity",            e: "🎨" },
      { v: "exp",      l: "Experiences",           e: "🎟️" },
      { v: "fitness",  l: "Fitness",               e: "💪" },
      { v: "food",     l: "Food & Drinks",         e: "🍷" },
      { v: "gaming",   l: "Gaming",                e: "🎮" },
      { v: "wellness", l: "Health & Wellness",     e: "🌙" },
      { v: "home",     l: "Home & Decor",          e: "🛋️" },
      { v: "learn",    l: "Learning",              e: "📚" },
      { v: "music",    l: "Music",                 e: "🎧" },
      { v: "outdoors", l: "Nature & Outdoors",     e: "🏔" },
      { v: "organize", l: "Organization",          e: "📦" },
      { v: "personal", l: "Personalization",       e: "✏️" },
      { v: "pets",     l: "Pets",                  e: "🐾" },
      { v: "rest",     l: "Rest & Relaxation",     e: "🛁" },
      { v: "seasonal", l: "Seasonal Gifts",        e: "🍁" },
      { v: "selfcare", l: "Self-Care & Beauty",    e: "🧴" },
      { v: "sustain",  l: "Sustainability",        e: "♻️" },
      { v: "tech",     l: "Tech & Electronics",    e: "🛠" },
      { v: "toys",     l: "Toys & Games",          e: "🧸" },
      { v: "travel",   l: "Travel",                e: "✈️" },
    ],
  },
  {
    id: "vibe",
    label: "What's the vibe?",
    helper: "Up to 2. Pick the truer ones.",
    type: "multi",
    max: 2,
    bigTiles: true,
    options: [
      { v: "fun",         l: "Fun",         e: "🎉" },
      { v: "practical",   l: "Practical",   e: "🔧" },
      { v: "sentimental", l: "Sentimental", e: "💛" },
      { v: "luxurious",   l: "Luxurious",   e: "💎" },
      { v: "adventurous", l: "Adventurous", e: "🧭" },
    ],
  },
  {
    id: "budget",
    label: "What's your budget?",
    helper: "No judgment. Drag to dial it in.",
    type: "slider",
    min: 15,
    max: 500,
    step: 5,
    defaultValue: 120,
  },
];

// --- Conditional flow: which questions/options apply given current answers? ---

// Recipients whose age is obvious from the relationship (we skip the age question entirely).
const SKIP_AGE_RECIPIENTS = new Set(["grandparent"]);

// Per-recipient age-option hides. Each set lists age codes that don't apply
// to that recipient and should be removed from the quiz.
const HIDE_KID_FOR = new Set(["partner", "parent", "coworker", "mentor", "self"]);
const HIDE_TEEN_FOR = new Set(["partner", "parent", "coworker", "mentor"]); // not self — a teen can be filling out the quiz
const HIDE_YOUNG_ADULT_FOR = new Set(["parent"]); // your parent is older than 20-something

// Per-age occasion-option hides. Kids and teens don't have weddings,
// housewarmings, anniversaries, or new-baby gifts of their own.
const HIDE_OCCASIONS_FOR_AGE: Record<string, Set<string>> = {
  kid: new Set(["housewarm", "wed", "baby", "anni"]),
  teen: new Set(["housewarm", "wed", "baby", "anni"]),
};

export function getActiveQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => {
    if (q.id === "age" && answers.recipient && SKIP_AGE_RECIPIENTS.has(answers.recipient)) return false;
    return true;
  });
}

export function getActiveOptions(q: Question, answers: Answers): Option[] {
  if (q.type === "slider") return [];

  if (q.id === "age" && answers.recipient) {
    const r = answers.recipient;
    return q.options.filter((o) => {
      if (o.v === "kid" && HIDE_KID_FOR.has(r)) return false;
      if (o.v === "teen" && HIDE_TEEN_FOR.has(r)) return false;
      if (o.v === "twenty" && HIDE_YOUNG_ADULT_FOR.has(r)) return false;
      return true;
    });
  }

  if (q.id === "occasion" && answers.age && HIDE_OCCASIONS_FOR_AGE[answers.age]) {
    const hidden = HIDE_OCCASIONS_FOR_AGE[answers.age];
    return q.options.filter((o) => !hidden.has(o.v));
  }

  return q.options;
}

const STORAGE_KEY = "giftpicker_answers_v1";

export function saveAnswers(answers: Answers): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // sessionStorage can throw in private mode or if full — fail silently
  }
}

export function loadAnswers(): Answers {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

export function clearAnswers(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
