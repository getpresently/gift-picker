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
  /**
   * Free-text occasion typed by the user when they pick "Other" on the
   * occasion question. When set, `occasion === "other"` and the algorithm
   * skips all occasion-based scoring; the typed value is logged to the
   * Requests sheet (with a "NEW: " prefix) on quiz completion.
   */
  occasionOther?: string;
  interests?: string[];
  vibe?: string[];
  budget?: number;
  /** Optional budget floor (the slider's left handle). Unset means no floor. */
  budgetMin?: number;
  /** Optional refinement from the results page; never asked in the quiz. */
  gender?: Gender;
};

export type Gender = "any" | "him" | "her";

export const GENDER_OPTIONS: { v: Gender; l: string }[] = [
  { v: "any", l: "Anyone" },
  { v: "him", l: "For him" },
  { v: "her", l: "For her" },
];

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
      { v: "baby",   l: "Baby",        e: "👶", hint: "0–2" },
      { v: "kid",    l: "Little one",  e: "🧸", hint: "3–12" },
      { v: "teen",   l: "Teenager",    e: "🎧", hint: "13–17" },
      { v: "twenty", l: "Young adult", e: "🪩", hint: "18–25" },
      { v: "adult",  l: "Adult",       e: "🍷", hint: "late 20s–50s" },
      { v: "senior", l: "Senior",      e: "🌳", hint: "60+" },
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
      { v: "newjob",     l: "New job",      e: "💼" },
      // Picking Other reveals a free-text input under the tiles (no
      // auto-advance). The typed value is stored as `occasionOther`,
      // bypasses occasion-based scoring, and gets logged to the
      // Requests sheet on quiz completion with a "NEW: " prefix.
      { v: "other",      l: "Other",        e: "✨" },
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
    // Vibes mirror the sheet's Type column (Fun / Practical / Sentimental /
    // Luxurious). "Adventurous" was retired upstream and folded into Fun;
    // see VIBE_LABELS in gifts.ts for the back-compat fallback.
    options: [
      { v: "fun",         l: "Fun",         e: "🎉" },
      { v: "practical",   l: "Practical",   e: "🔧" },
      { v: "sentimental", l: "Sentimental", e: "💛" },
      { v: "luxurious",   l: "Luxurious",   e: "💎" },
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
const HIDE_BABY_FOR = new Set(["partner", "parent", "coworker", "mentor", "self"]);
const HIDE_KID_FOR = new Set(["partner", "parent", "coworker", "mentor", "self"]);
const HIDE_TEEN_FOR = new Set(["parent", "coworker", "mentor"]); // partners and self can be teens
const HIDE_YOUNG_ADULT_FOR = new Set(["parent"]); // your parent is older than 20-something

// Per-age occasion-option hides. Babies, children, and teens don't have
// weddings, housewarmings, anniversaries, or new-baby gifts of their own.
// Teens keep "New job" (first jobs happen); babies and kids don't.
const HIDE_OCCASIONS_FOR_AGE: Record<string, Set<string>> = {
  baby: new Set(["housewarm", "wed", "baby", "anni", "newjob"]),
  kid:  new Set(["housewarm", "wed", "baby", "anni", "newjob"]),
  teen: new Set(["housewarm", "wed", "baby", "anni"]),
};

// Typed "Other" occasions that mean an occasion we already offer. The
// shopper's own wording still shows on the results page; only scoring
// treats it as the built-in occasion. Anything unmatched stays "other".
const TYPED_OCCASION_ALIASES: { code: string; pattern: RegExp }[] = [
  { code: "holi", pattern: /\b(christmas|xmas|x-mas|c?hanukk?ah|kwanzaa|diwali|eid|lunar new year|holidays?|secret santa)\b/i },
  { code: "newjob", pattern: /\b(new job|first job|job|promotion|promoted|new role|new position)\b/i },
];

/** Built-in occasion code for a typed "Other" occasion, or null if it is genuinely new. */
export function typedOccasionCode(text: string | undefined): string | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  return TYPED_OCCASION_ALIASES.find((a) => a.pattern.test(t))?.code ?? null;
}

/** Answers as the scorer should see them: a typed holiday counts as Holiday, and so on. */
export function scoringAnswers(answers: Answers): Answers {
  if (answers.occasion !== "other") return answers;
  const code = typedOccasionCode(answers.occasionOther);
  return code ? { ...answers, occasion: code } : answers;
}

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
      if (o.v === "baby" && HIDE_BABY_FOR.has(r)) return false;
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
    // sessionStorage can throw in private mode or if full, fail silently
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

/**
 * Map the internal v-codes stored in `Answers` (e.g. `partner`, `twenty`,
 * `bday`, `cooking`) to the human labels the user actually clicked
 * (`Partner`, `Young adult`, `Birthday`, `Cooking`). Used before we ship
 * answers out to the Apps Script, the Feedback and Requests sheets
 * read much better when they show the same words the user saw.
 *
 * Unknown codes (e.g. the "NEW: <typed text>" occasion override set by
 * Quiz.tsx for free-text occasions) pass through unchanged. The
 * `occasionOther` field is intentionally dropped from the output, its
 * content has already been folded into `occasion` at the call site.
 */
export function humanizeAnswers(answers: Answers): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const choiceLabel = (qid: keyof Answers, code: string | undefined): string | undefined => {
    if (code === undefined) return undefined;
    const q = QUESTIONS.find((x) => x.id === qid);
    if (!q || q.type !== "choice") return code;
    return q.options.find((o) => o.v === code)?.l ?? code;
  };

  const multiLabels = (qid: keyof Answers, codes: string[] | undefined): string[] | undefined => {
    if (codes === undefined) return undefined;
    const q = QUESTIONS.find((x) => x.id === qid);
    if (!q || q.type !== "multi") return codes;
    return codes.map((v) => q.options.find((o) => o.v === v)?.l ?? v);
  };

  const recipient = choiceLabel("recipient", answers.recipient);
  if (recipient !== undefined) out.recipient = recipient;

  const age = choiceLabel("age", answers.age);
  if (age !== undefined) out.age = age;

  // Free-text "Other" occasions: if the caller hasn't already baked the
  // typed text into `occasion` (e.g. Quiz.tsx overrides it to "NEW: …"
  // for Requests), surface the user's wording here so the Feedback
  // sheet doesn't just say "Other".
  if (answers.occasion === "other" && answers.occasionOther) {
    out.occasion = answers.occasionOther;
  } else {
    const occ = choiceLabel("occasion", answers.occasion);
    if (occ !== undefined) out.occasion = occ;
  }

  const interests = multiLabels("interests", answers.interests);
  if (interests !== undefined) out.interests = interests;

  const vibe = multiLabels("vibe", answers.vibe);
  if (vibe !== undefined) out.vibe = vibe;

  if (answers.budget !== undefined) {
    out.budget = typeof answers.budgetMin === "number" ? `${answers.budgetMin}-${answers.budget}` : answers.budget;
  }
  if (answers.gender && answers.gender !== "any") {
    out.gender = GENDER_OPTIONS.find((g) => g.v === answers.gender)?.l ?? answers.gender;
  }

  return out;
}
