/**
 * Logic checks for the parts of the site that decide what a shopper sees and
 * where a Buy click goes: twins, buy links, the Treat-myself filter, interest
 * credit, answer cleanup, and the blog post data. Run with `npm test` (scripts/test.mjs bundles
 * this file with esbuild and runs it on node:test). Run it before a deploy.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { foldTwins, rankGifts, scoreGift, twinSeed, twinsOf, type Gift, type RankedGift } from "../src/data/gifts";
import { affiliateUrl, AMAZON_TAG, buyLinks, isAmazonUrl, primaryBuy } from "../src/data/affiliate";
import { QUESTIONS, questionLabel, reconcileAnswers, type Answers } from "../src/data/questions";
import { decodeAnswers, encodeAnswers } from "../src/data/share";
import { relatedGifts } from "../src/data/related";
import { findPost, formatPostDate, parseInline, postGiftIds, POSTS } from "../src/data/posts";

function gift(id: string, over: Partial<Gift> = {}): Gift {
  return {
    id,
    name: `Gift ${id}`,
    brand: `Brand ${id}`,
    description: "",
    price: 50,
    priceMax: null,
    priceOpen: false,
    isYourChoice: false,
    billingPeriod: "one-time",
    priceLabel: "$50",
    image: "",
    link: `https://brand-${id}.example.com/p`,
    amazonLink: "",
    ages: ["Adult"],
    types: ["Fun"],
    interests: ["Cooking"],
    primaryInterest: "Cooking",
    relations: ["Friend"],
    occasions: ["Birthday"],
    status: "Live",
    gender: "",
    twinGroup: "",
    ...over,
  };
}

const ranked = (g: Gift, matchScore: number): RankedGift => ({ ...g, matchScore });
const ids = (list: Gift[]) => list.map((g) => g.id);

/* ---------------------------- twinSeed ---------------------------- */

test("twinSeed ignores budget, vibe, occasion, interest order, and an Anyone gender", () => {
  const a: Answers = { recipient: "friend", age: "adult", interests: ["cooking", "home"], budget: 50, vibe: ["fun"], occasion: "bday" };
  const b: Answers = { recipient: "friend", age: "adult", interests: ["home", "cooking"], budget: 200, vibe: ["practical"], occasion: "holi", gender: "any" };
  assert.equal(twinSeed(a), twinSeed(b));
  assert.notEqual(twinSeed(a), twinSeed({ ...a, recipient: "partner" }));
  assert.notEqual(twinSeed(a), twinSeed({ ...a, gender: "her" }));
});

/* ---------------------------- foldTwins --------------------------- */

test("foldTwins keeps one card per group, best match wins, the rest ride along", () => {
  const list = [
    ranked(gift("a", { twinGroup: "speakers" }), 90),
    ranked(gift("x"), 85),
    ranked(gift("b", { twinGroup: "speakers" }), 80),
    ranked(gift("c", { twinGroup: "speakers" }), 70),
  ];
  const out = foldTwins(list, "seed");
  assert.deepEqual(ids(out), ["a", "x"]);
  assert.deepEqual(ids(out[0].twins ?? []), ["b", "c"]);
  assert.equal(list[0].twins, undefined, "input is not mutated");
});

test("foldTwins leaves lists without a full twin group untouched", () => {
  const list = [ranked(gift("a", { twinGroup: "solo" }), 90), ranked(gift("b"), 80)];
  assert.equal(foldTwins(list, "seed"), list);
});

test("foldTwins tie: same seed, same winner; across seeds about 50/50", () => {
  const list = [ranked(gift("a", { twinGroup: "g" }), 80), ranked(gift("b", { twinGroup: "g" }), 80)];
  assert.equal(foldTwins(list, "s1")[0].id, foldTwins(list, "s1")[0].id);
  let aWins = 0;
  for (let i = 0; i < 2000; i++) if (foldTwins(list, `seed-${i}`)[0].id === "a") aWins++;
  assert.ok(aWins > 850 && aWins < 1150, `a won ${aWins} of 2000`);
  // Input order does not change the toss.
  for (let i = 0; i < 50; i++) {
    assert.equal(foldTwins(list, `s${i}`)[0].id, foldTwins([...list].reverse(), `s${i}`)[0].id);
  }
});

test("foldTwins winner takes the group's highest slot", () => {
  // Tied twins with another gift between them: whichever twin wins sits first.
  for (let i = 0; i < 40; i++) {
    const out = foldTwins(
      [ranked(gift("a", { twinGroup: "g" }), 80), ranked(gift("x"), 80), ranked(gift("b", { twinGroup: "g" }), 80)],
      `seed-${i}`,
    );
    assert.equal(out.length, 2);
    assert.ok(out[0].twinGroup === "g", `seed-${i}: top slot went to ${out[0].id}`);
    assert.equal(out[1].id, "x");
  }
});

test("foldTwins passes over reported twins unless every twin is reported", () => {
  const list = [ranked(gift("a", { twinGroup: "g" }), 90), ranked(gift("b", { twinGroup: "g" }), 70)];
  assert.equal(foldTwins(list, "s", new Set(["a"]))[0].id, "b");
  assert.deepEqual(ids(foldTwins(list, "s", new Set(["a"]))[0].twins ?? []), ["a"]);
  assert.equal(foldTwins(list, "s", new Set(["a", "b"]))[0].id, "a");
});

/* ----------------------------- twinsOf ---------------------------- */

test("twinsOf lists the other members, Best Sellers first, then by name", () => {
  const all = [
    gift("a", { twinGroup: "g", name: "Alpha" }),
    gift("b", { twinGroup: "g", name: "Zed", interests: ["Cooking", "Best Sellers"] }),
    gift("c", { twinGroup: "g", name: "Beta" }),
    gift("d", { twinGroup: "other" }),
    gift("e"),
  ];
  assert.deepEqual(ids(twinsOf(all[0], all)), ["b", "c"]);
  assert.deepEqual(twinsOf(all[4], all), []);
});

test("relatedGifts never repeats the gift's twins", () => {
  const all = [gift("a", { twinGroup: "g" }), gift("b", { twinGroup: "g" }), gift("c"), gift("d")];
  assert.ok(!ids(relatedGifts(all[0], all)).includes("b"));
  assert.ok(ids(relatedGifts(all[0], all)).includes("c"));
});

/* ---------------------------- buy links --------------------------- */

test("an Amazon Link is the Amazon button, with no brand button", () => {
  const g = gift("a", { link: "https://www.amazon.com/dp/B0ABCDEFGH", amazonLink: "https://www.amazon.com/dp/B0ZZZZZZZZ" });
  assert.deepEqual(buyLinks(g), { amazon: "https://www.amazon.com/dp/B0ABCDEFGH", brand: "" });
  assert.deepEqual(primaryBuy(g), { url: "https://www.amazon.com/dp/B0ABCDEFGH", destination: "amazon" });
});

test("a brand Link plus an Amazon alt link gives both buttons; the quick Buy goes to Amazon", () => {
  const g = gift("a", { amazonLink: "https://www.amazon.com/dp/B0ABCDEFGH" });
  assert.deepEqual(buyLinks(g), { amazon: "https://www.amazon.com/dp/B0ABCDEFGH", brand: g.link });
  assert.equal(primaryBuy(g).destination, "amazon");
});

test("a brand-only gift buys from the brand", () => {
  const g = gift("a");
  assert.deepEqual(buyLinks(g), { amazon: "", brand: g.link });
  assert.deepEqual(primaryBuy(g), { url: g.link, destination: "brand" });
});

test("Amazon links get the Associates tag, rebuilt as /dp/ASIN", () => {
  assert.equal(AMAZON_TAG, "dalia0f8-20");
  assert.equal(
    affiliateUrl("https://www.amazon.com/Some-Product/dp/b0abcdefgh/ref=sr_1_1?smid=X&linkCode=ll1&tag=old-20"),
    "https://www.amazon.com/dp/B0ABCDEFGH?tag=dalia0f8-20",
  );
  assert.equal(new URL(affiliateUrl("https://www.amazon.com/s?k=mug")).searchParams.get("tag"), "dalia0f8-20");
  assert.equal(affiliateUrl("https://brand.example.com/p"), "https://brand.example.com/p");
  assert.equal(isAmazonUrl("https://amzn.to/abc"), false);
});

/* ----------------------- Treat myself / labels --------------------- */

test("Treat myself hides gifts made only for someone else", () => {
  const self: Answers = { recipient: "self", interests: ["cooking"], budget: 100 };
  assert.equal(scoreGift(gift("p", { relations: ["Parent"] }), self), -1);
  assert.equal(scoreGift(gift("t", { relations: ["Coworker", "Mentor/Teacher"] }), self), -1);
  assert.equal(scoreGift(gift("g", { relations: ["Grandparent", "Parent"] }), self), -1);
  assert.ok(scoreGift(gift("c", { relations: ["Partner"] }), self) >= 0, "partner-only gifts stay");
  assert.ok(scoreGift(gift("f", { relations: ["Parent", "Friend"] }), self) >= 0);
});

test("a gift tagged only Self never shows for someone else", () => {
  const g = gift("s", { relations: ["Self"] });
  assert.equal(scoreGift(g, { recipient: "friend", interests: ["cooking"] }), -1);
  assert.ok(scoreGift(g, { recipient: "self", interests: ["cooking"] }) >= 0);
});

test("questionLabel speaks to the shopper on Treat myself", () => {
  const interests = QUESTIONS.find((q) => q.id === "interests")!;
  assert.equal(questionLabel(interests, { recipient: "self" }), "What are you into?");
  assert.equal(questionLabel(interests, { recipient: "friend" }), "What are they into?");
});

/* ------------------------- interest credit ------------------------ */

test("a main interest the quiz doesn't offer counts as unassigned (full credit for its tags)", () => {
  const answers: Answers = { recipient: "friend", age: "adult", interests: ["cooking"], budget: 60 };
  const offered = gift("h", { primaryInterest: "Home & Decor", interests: ["Home & Decor", "Cooking"] });
  const unoffered = gift("u", { primaryInterest: "Not A Quiz Interest", interests: ["Not A Quiz Interest", "Cooking"] });
  const primary = gift("c");
  assert.equal(scoreGift(unoffered, answers), scoreGift(primary, answers));
  assert.equal(scoreGift(offered, answers), scoreGift(primary, answers) - 20, "a secondary tag earns half of 40");
});

test("rankGifts returns live, in-budget gifts best first", () => {
  const all = [gift("cheap", { price: 20 }), gift("dead", { status: "Retired" }), gift("over", { price: 500 }), gift("fit", { price: 55 })];
  assert.deepEqual(ids(rankGifts(all, { recipient: "friend", age: "adult", interests: ["cooking"], budget: 60 })), ["fit", "cheap"]);
});

/* ------------------------- answer cleanup ------------------------- */

test("reconcileAnswers drops interests the quiz doesn't offer, or hides for the age", () => {
  assert.deepEqual(reconcileAnswers({ recipient: "friend", age: "adult", interests: ["cooking", "made-up"] }).interests, ["cooking"]);
  assert.deepEqual(reconcileAnswers({ recipient: "friend", age: "baby", interests: ["gaming", "toys"] }).interests, ["toys"]);
  assert.equal(reconcileAnswers({ recipient: "grandparent", age: "adult" }).age, undefined);
});

test("share links round-trip and shed unknown codes", () => {
  const answers: Answers = { recipient: "partner", age: "adult", occasion: "bday", interests: ["cooking", "home"], vibe: ["fun"], budget: 150, budgetMin: 40, gender: "her" };
  assert.deepEqual(decodeAnswers(encodeAnswers(answers)), answers);
  assert.deepEqual(decodeAnswers("r=friend&a=adult&i=cooking,made-up")?.interests, ["cooking"]);
});

test("post links: gift: links go to the gift page, other links stay as written", () => {
  assert.deepEqual(parseInline("See [the mug](gift:r293) or [this guide](/blog/x)."), [
    { text: "See " },
    { text: "the mug", href: "/gift/r293", giftId: "r293" },
    { text: " or " },
    { text: "this guide", href: "/blog/x" },
    { text: "." },
  ]);
  assert.deepEqual(parseInline("No links here"), [{ text: "No links here" }]);
});

test("post dates read as the calendar day in any time zone", () => {
  assert.equal(formatPostDate("2026-10-17"), "October 17, 2026");
  assert.equal(formatPostDate("2027-01-02"), "January 2, 2027");
});

test("blog posts: unique slugs, sheet-style gift IDs, links to real posts, and house style", () => {
  const slugs = POSTS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug");
  for (const post of POSTS) {
    assert.match(post.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, post.slug);
    assert.match(post.published, /^\d{4}-\d{2}-\d{2}$/, post.slug);
    assert.ok(post.description.length <= 160, `${post.slug}: description is ${post.description.length} characters`);
    assert.ok(postGiftIds(post).length > 0, `${post.slug}: no gifts`);
    for (const id of postGiftIds(post)) assert.match(id, /^r\d+$/, `${post.slug}: ${id}`);
    const texts = [post.title, post.description, post.cta, ...post.intro];
    for (const b of post.body) {
      if (b.kind === "list") texts.push(...b.items);
      else if (b.kind !== "gifts") texts.push(b.text);
    }
    for (const t of texts) {
      assert.ok(!t.includes("\u2014"), `${post.slug}: em-dash in "${t.slice(0, 40)}"`);
      assert.ok(!/presently/i.test(t), `${post.slug}: mentions Presently`);
      for (const s of parseInline(t)) {
        const blog = s.href?.match(/^\/blog\/(.+)$/);
        if (blog) assert.ok(findPost(blog[1]), `${post.slug}: links to missing post ${blog[1]}`);
      }
    }
  }
});

