/**
 * Blog posts, stored in the repo as plain data (no CMS). The React pages in
 * src/components/Blog.tsx and the Cloudflare worker (workers-site/index.js,
 * which prerenders /blog and /blog/:slug for crawlers and lists the posts in
 * /sitemap.xml) both read this file, so keep it free of browser-only code.
 *
 * Text may hold inline links written as [label](href). An href of
 * "gift:r123" links to that gift's page (/gift/r123); anything else is used
 * as given (for example /blog/other-slug). A gift link whose gift is no longer
 * live on the site renders as plain text, and a retired gift drops out of its
 * card row, so check posts against the catalog when gifts are retired.
 *
 * Every gift referenced here must be live on the site (Status Live and Review
 * status TRUE in the Gifts sheet). House style: no em-dashes, the Oxford comma,
 * US spelling, and no Presently mentions.
 */

export type PostBlock =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  /** A row of gift cards, by sheet ID. */
  | { kind: "gifts"; ids: string[] };

export type Post = {
  slug: string;
  /** Used for the H1 and, with " · GiftPicker" added, the tab title. */
  title: string;
  /** Meta description and the blurb on /blog. Keep it under 160 characters. */
  description: string;
  /** ISO date, YYYY-MM-DD. */
  published: string;
  updated?: string;
  /** Lead paragraphs, set larger than the body. */
  intro: string[];
  body: PostBlock[];
  /** One or two sentences above the quiz button at the end of the post. */
  cta: string;
};

export type InlineSegment = { text: string; href?: string; giftId?: string };

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Split text with [label](href) links into plain and linked segments. */
export function parseInline(src: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let last = 0;
  for (const m of src.matchAll(LINK_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: src.slice(last, at) });
    const [, label, href] = m;
    if (href.startsWith("gift:")) {
      const giftId = href.slice(5);
      out.push({ text: label, href: `/gift/${giftId}`, giftId });
    } else {
      out.push({ text: label, href });
    }
    last = at + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10-17" → "October 17, 2026", without time zones shifting the day. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function findPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Every gift ID a post mentions, in order of first appearance (card rows and inline links). */
export function postGiftIds(post: Post): string[] {
  const ids: string[] = [];
  const add = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  const scan = (text: string) => parseInline(text).forEach((s) => s.giftId && add(s.giftId));
  post.intro.forEach(scan);
  for (const b of post.body) {
    if (b.kind === "gifts") b.ids.forEach(add);
    else if (b.kind === "list") b.items.forEach(scan);
    else scan(b.text);
  }
  return ids;
}

/** Newest first. Posts with the same date keep the order they have here. */
export const POSTS: Post[] = [
  {
    slug: "how-to-choose-a-gift-by-love-language",
    title: "How to choose a gift by love language",
    description:
      "Learn the everyday clues that show which love language someone speaks, then find gift ideas for quality time, words, acts of service, touch, and gifts.",
    published: "2026-10-17",
    intro: [
      "The idea of love languages comes from author Gary Chapman, who described five ways people tend to give and receive affection: quality time, words of affirmation, acts of service, physical touch, and receiving gifts. Most people respond to all five to some degree, though one or two usually matter more than the rest.",
      "That makes the idea useful when you are choosing a present. A gift that matches how someone feels cared for tends to land well, even when it costs less than something picked at random. The hard part is working out which language your person speaks, so this guide starts there before it gets to the gifts.",
    ],
    body: [
      { kind: "h2", text: "Start with how they show love" },
      {
        kind: "p",
        text: "People often express love in the way they hope to receive it, so pay attention to what they do for you and for the people around them. A few patterns to look for:",
      },
      {
        kind: "list",
        items: [
          "Quality time: they plan outings, protect phone-free evenings, and get quiet when plans fall through.",
          "Words of affirmation: they write long cards, send kind texts out of nowhere, and remember exactly what you said.",
          "Acts of service: they fix things without being asked, and they light up when someone takes a chore off their plate.",
          "Physical touch: they hug hello, sit close on the couch, and reach for your hand in a crowd.",
          "Receiving gifts: they keep ticket stubs and notes, give small presents often, and remember who gave them what.",
        ],
      },
      {
        kind: "p",
        text: "Their complaints are another clue. Someone who says the two of you never go anywhere is telling you something different from someone who says they handle everything around the house.",
      },

      { kind: "h2", text: "For quality time: something to do together" },
      {
        kind: "p",
        text: "For someone who values quality time, choose a gift that puts the two of you in the same room with your phones away, ideally more than once.",
      },
      {
        kind: "p",
        text: "[Couples Edition: 50 Scratch-Off Date Adventures](gift:r15) is a hardcover book of 50 dates hidden under scratch-off panels, with space on each page for a photo and a note, so it slowly becomes a record of your time together. A [private introductory dance lesson](gift:r1018) at a Fred Astaire studio covers 45 minutes of instruction for two, with a plan for styles like ballroom, swing, or salsa; it is for new students, so check for a studio nearby first. For evenings at home, [Sky Team](gift:r508) is a cooperative board game for exactly two players, in which a pilot and copilot work together to land a plane. It won the Spiel des Jahres in 2024.",
      },
      { kind: "gifts", ids: ["r15", "r1018", "r508"] },

      { kind: "h2", text: "For words of affirmation: something that says it in writing" },
      {
        kind: "p",
        text: "People who value words tend to reread what you write, so the best gifts give your words a lasting form. You don't need to be a poet, since specific memories usually mean more than polished phrasing.",
      },
      {
        kind: "p",
        text: "[Letters to My Love](gift:r891) is a keepsake book of 12 prompted letters that you write now, seal, and date for opening on a future anniversary or milestone. If you would like help with the melody, singer-songwriter David Morgan turns the stories you send him into a [made-to-order personalized song](gift:r705), delivered as an MP3 with the lyrics. For something lighter, [custom message shortbread cookies](gift:r735) arrive as a box of 24, each stamped with up to three short lines you choose.",
      },
      { kind: "gifts", ids: ["r891", "r705", "r735"] },

      { kind: "h2", text: "For acts of service: something that takes a job off their list" },
      {
        kind: "p",
        text: "People who speak this language feel cared for when life gets easier. The most direct version of the gift is doing a job yourself, and a well-chosen object can keep helping long after the gesture.",
      },
      {
        kind: "p",
        text: "A [Roomba robot vacuum](gift:r256) maps the house and empties its own bin for up to 60 days, which removes one weekly chore for good. An [Instacart gift card](gift:r768) covers groceries, delivery fees, and tips, and it pairs well with an offer to do the ordering yourself. If they are the one who keeps the household schedule in their head, the [Skylight Calendar 2](gift:r953) brings everyone's Google, Outlook, and Apple calendars onto one 15-inch touchscreen, with chore lists built in.",
      },
      { kind: "gifts", ids: ["r256", "r768", "r953"] },

      { kind: "h2", text: "For physical touch: something that feels good to hold" },
      {
        kind: "p",
        text: "This group responds to comfort they can feel. Look for warmth, weight, softness, or pressure, and think about where they carry their stress.",
      },
      {
        kind: "p",
        text: "The [RENPHO Shiatsu Foot Massager](gift:r372) kneads with heat and runs from a remote, which suits someone who is on their feet all day. For a stiff lower back after long drives or desk days, the [Hyperice Venom 2](gift:r958) wraps around the waist with three heat levels and three vibration patterns, and it runs cordless for about three hours. [The Comfy](gift:r938) is an oversized wearable blanket with a sherpa lining, a deep hood, and a front pocket, made for couch nights and cold mornings.",
      },
      { kind: "gifts", ids: ["r372", "r958", "r938"] },

      { kind: "h2", text: "For receiving gifts: something chosen with care" },
      {
        kind: "p",
        text: "People who love receiving gifts value the evidence that you were paying attention, so the story behind an object matters as much as the object itself.",
      },
      {
        kind: "p",
        text: "A [custom star map print](gift:r944) shows the sky over a chosen place and date, such as the night you met, along with a message of your own. The [solid walnut musical keepsake](gift:r706) is a palm-sized wind-up box that plays one tune you choose from hundreds. When you want a smaller surprise, [Compartés signature truffles](gift:r584) come as a box of 20 handmade truffles from Los Angeles, each decorated with a printed pattern.",
      },
      { kind: "gifts", ids: ["r944", "r706", "r584"] },

      { kind: "h2", text: "When they speak two languages" },
      {
        kind: "p",
        text: "Many people have a clear first language and a close second, and a gift that covers both is often the one they remember. A [mini paella kit](gift:r760) that you cook together counts as quality time and an act of service at once, and a [private chef dinner for two](gift:r831) does the same at a bigger budget: the chef shops, cooks, serves, and cleans up while the two of you enjoy the evening. A star map with a long handwritten note on the back speaks to words of affirmation as well as receiving gifts. A foot massager is about physical touch, and planning a slow evening at home around it adds quality time.",
      },
      { kind: "gifts", ids: ["r760", "r831"] },
      {
        kind: "p",
        text: "If you are still unsure, ask a question that doesn't give the gift away, such as what made them feel most appreciated this year. The answer usually points to one of the five.",
      },
    ],
    cta: "Know who you're shopping for but not what to get? Tell the quiz about them, and it will rank gifts from our catalog for you.",
  },

  {
    slug: "gifts-for-men-who-say-they-dont-need-anything",
    title: "Gifts for the man who says he doesn't need anything",
    description:
      "Four ways to shop for a man who already owns what he needs: give an experience, upgrade something he uses daily, pick something he'll use up, or start a hobby.",
    published: "2026-10-17",
    intro: [
      "Ask some men what they want and the answer never changes: nothing, really. Sometimes that is modesty, and sometimes it is true in a narrow sense, because he already owns a wallet, a watch, and more gadgets than he uses. Either way, it leaves you guessing.",
      "It helps to stop hunting for a missing object. The four approaches below work for a partner, a dad, a brother, or a friend, and each one gets around the problem of buying something he already has.",
    ],
    body: [
      { kind: "h2", text: "Give him an experience" },
      {
        kind: "p",
        text: "A man who has everything he needs can still collect stories. An experience leaves nothing to store, and a good one gives him something to talk about for years.",
      },
      {
        kind: "p",
        text: "An [Xtreme Xperience gift card](gift:r832) goes toward driving a supercar on a real racetrack, from a Lamborghini or Ferrari to a Porsche GT3, with a professional coach in the passenger seat. Events run at more than 40 tracks across the US, so check the schedule near him first. If he follows a team, [tickets to their game](gift:r1073) are easy to find by team and date on StubHub, and the seat details fit neatly in a card. For someone curious about golf, an [intro lesson at Five Iron Golf](gift:r1053), an indoor golf club in 26 US cities, covers grip, stance, and ball position on a Trackman simulator, with video of his swing.",
      },
      { kind: "gifts", ids: ["r832", "r1073", "r1053"] },

      { kind: "h2", text: "Upgrade something he uses every day" },
      {
        kind: "p",
        text: "He probably owns a kitchen knife, a watch, and a kettle already, but they may be the ones he bought in a hurry years ago. Replacing one with a much better version means he notices the gift every time he uses it.",
      },
      {
        kind: "p",
        text: "The [Shun Classic 8-Inch Chef's Knife](gift:r739) is handmade in Japan with a VG-MAX steel core and 68 layers of Damascus cladding, and it handles most of the chopping, slicing, and mincing in a home kitchen. The [Timex Marlin Automatic](gift:r960) reissues a 1960s design with a 21-jewel automatic movement, a green dial, and a black leather strap, and it never needs a battery. For his morning coffee or tea, the [Fellow Stagg EKG Pro](gift:r532) is a gooseneck electric kettle that heats water to the exact degree, which pour-over fans appreciate.",
      },
      { kind: "gifts", ids: ["r739", "r960", "r532"] },

      { kind: "h2", text: "Give him something he'll use up" },
      {
        kind: "p",
        text: "Consumables solve the clutter problem completely. He gets to enjoy them, and when they are gone there is no shelf to clear.",
      },
      {
        kind: "p",
        text: "The [Hot Ones 10 Pack](gift:r468) from Heatonist holds all ten craft hot sauces from a season of the Hot Ones interview show, boxed in order from mild to extreme. A man with a full beard will get real use out of the [Beardbrand Bold Fortune Grooming Set](gift:r924), which pairs beard oil, a matching cologne, and a large comb in a warm, smoky scent of leather, whiskey, saffron, and tobacco. If he runs the grill, the [Spiceology rub collection](gift:r586) gives him twelve mini jars of seasoning blends to work through, including Smoky Honey Habanero and Korean BBQ.",
      },
      { kind: "gifts", ids: ["r468", "r924", "r586"] },

      { kind: "h2", text: "Hand him a new hobby" },
      {
        kind: "p",
        text: "A hobby gives him something new to learn and a reason to set aside an afternoon for it. Look for a kit that includes everything he needs, so he can start on the day he opens the box.",
      },
      {
        kind: "p",
        text: "The [Orvis Clearwater Fly Rod Outfit](gift:r835) is a complete fly fishing setup from the Vermont outfitter founded in 1856: a four-piece rod, a matched reel, and fly line with backing, packed in a rod tube. The [Marcato Atlas 150](gift:r757) is a classic hand-crank pasta machine from a family company in Italy; it rolls dough to 10 thicknesses and cuts fettuccine and tagliolini. On a smaller budget, the [Weller Woodburning Kit](gift:r1056) comes with a 25-watt pen and ten interchangeable tips for burning names and patterns into boards, spoons, and signs.",
      },
      { kind: "gifts", ids: ["r835", "r757", "r1056"] },

      { kind: "h2", text: "Or ask for his stories" },
      {
        kind: "p",
        text: "Sometimes the man who wants nothing would quietly enjoy being asked about his life. [Dad, I Want to Hear Your Story](gift:r993) is a guided journal with more than 300 prompts about his childhood, work, and family, and once it is filled in it becomes a keepsake for his children and grandchildren. [Storyworth](gift:r636) works over a year instead, sending weekly prompts and turning his answers into a hardcover memoir.",
      },
      { kind: "gifts", ids: ["r993", "r636"] },

      { kind: "h2", text: "Narrowing it down" },
      {
        kind: "p",
        text: "If you are torn between these approaches, a little detective work helps. Look at what he uses until it wears out, since that points to an everyday upgrade worth making. Listen for the things he says he would like to try someday, which suggest an experience or a hobby. And ask the people who see him often, because a brother or a close friend may know exactly which team he follows or which hot sauce he keeps reordering.",
      },
      {
        kind: "p",
        text: "Whatever you choose, add a sentence to the card about why you picked it. For someone who insists he needs nothing, knowing the reason is often what makes the gift stick.",
      },
    ],
    cta: "Still stuck? Tell the quiz about his interests and your budget. On the results page, Edit answers lets you set the gift to be for him.",
  },

  {
    slug: "how-much-to-spend-on-a-coworker-gift",
    title: "How much to spend on a coworker gift, with picks at every price",
    description:
      "Budget guidance for coworker gifts from you alone or from the whole team, with picks for birthdays, promotions, new babies, weddings, and farewells.",
    published: "2026-10-17",
    intro: [
      "Most workplace gift questions come down to two things: who the gift is from and how big the moment is. A birthday treat from the person at the next desk calls for something different from a farewell collection taken up by a whole department, and the budget follows from there.",
      "This guide is organized by price. Each tier lists the occasions it usually fits, along with gifts from our catalog that suit a work relationship, meaning friendly and thoughtful without being too personal.",
    ],
    body: [
      { kind: "h2", text: "A rough guide to spending" },
      { kind: "p", text: "There is no fixed rule, but these ranges keep most offices comfortable:" },
      {
        kind: "list",
        items: [
          "From you alone, for a birthday or a thank-you: under $25.",
          "From you alone, for a close work friend or a bigger milestone like a promotion: $25 to $60.",
          "From a small group: $60 to $150, which works out to a modest amount per person.",
          "From the whole team, for a retirement, a long-time colleague's last day, a wedding, or a new baby: $150 and up.",
        ],
      },
      {
        kind: "p",
        text: "When you organize a collection, suggest an amount per person and make it clear that any contribution, including none, is welcome. Most teams include people on very different salaries, and nobody should feel watched. Gifts for a manager are also more comfortable as group gifts, since a solo gift sent upward can look like a bid for favor.",
      },

      { kind: "h2", text: "Under $25: a birthday or a thank-you from you" },
      {
        kind: "p",
        text: "At this price the goal is a small treat that feels chosen. Food that can be shared, or something that lives on a desk, works for almost anyone.",
      },
      {
        kind: "p",
        text: "L.A. Burdick's [signature chocolate mice](gift:r417) are hand-piped with ganache centers and silk ribbon tails, and they arrive boxed and tied. For the office coffee drinker, the [Onyx Coffee Lab Blend Discovery Box](gift:r425) holds three small boxes of whole bean coffee in dark, balanced, and light roasts. The [Hanayama Huzzle Cast Marble Puzzle](gift:r386) is a heavy, cast-metal take-apart puzzle from Japan that gives restless hands something to do on long calls. When someone lands a new job or a promotion, Sugarfina's [Champagne Bears Celebration Bottle](gift:r650) is easy to share around the office, and the gummies contain no alcohol.",
      },
      { kind: "gifts", ids: ["r417", "r425", "r386", "r650"] },

      { kind: "h2", text: "$25 to $60: a close colleague or a bigger milestone" },
      {
        kind: "p",
        text: "With a little more room, you can pick something tied to how they work or to what they enjoy outside of it.",
      },
      {
        kind: "p",
        text: "The [Ugmonk Analog Starter Kit](gift:r652) is a paper card system for daily priorities, with an aluminum stand and Today, Next, and Someday cards that keep the day's list in view on a new desk. For the colleague who is always traveling, the [AeroPress Go](gift:r685) packs a coffee press into its own mug and brews a cup in about two minutes in a hotel room. North Spore's [blue oyster mushroom kit](gift:r935) grows clusters of mushrooms straight out of the box with a daily mist of water, which makes a fun project for a cook. For a birthday the whole floor can enjoy, a [Levain Bakery cookie assortment](gift:r585) brings eight six-ounce cookies in the New York bakery's four original flavors.",
      },
      { kind: "gifts", ids: ["r652", "r685", "r935", "r585"] },

      { kind: "h2", text: "$60 to $150: when a few people chip in" },
      {
        kind: "p",
        text: "Pooling a few contributions opens up gifts with real staying power. This range suits a promotion, a work anniversary, a new baby, or a colleague moving on to another team.",
      },
      {
        kind: "p",
        text: "The [Leatherology A5 Junior Snap Padfolio](gift:r663) suits a new role, with a refillable notepad, card slots, a pen loop, and the option to deboss initials on the cover. The [Ember Mug 3](gift:r293) holds coffee or tea at a set temperature, which matters to anyone whose drink goes cold between meetings. For a coworker expecting a baby, Lovevery's [Play Kits](gift:r550) can be given as one to three stage-based kits that the parents activate with a code. If someone is leaving, the [Zingerman's Coffee Cake Club](gift:r515) sends three monthly deliveries of coffee cake, a pleasant reminder of the team after their last day.",
      },
      { kind: "gifts", ids: ["r663", "r293", "r550", "r515"] },

      { kind: "h2", text: "$150 and up: a send-off from the whole team" },
      {
        kind: "p",
        text: "Big collections usually mark big moments, so spend the money on something the person would hesitate to buy for themselves.",
      },
      {
        kind: "p",
        text: "For a retirement, the [Lettuce Grow Farmstand](gift:r296) is a self-watering hydroponic tower that grows 18 to 36 plants at once, indoors under grow lights or out on a patio, and it ships with live seedlings so the first harvest comes within a few weeks. For a wedding, a [Le Creuset cast iron round oven](gift:r62) is a piece the couple can cook with for years. If the guest of honor would enjoy an outing, a [Topgolf gift card](gift:r994) covers play, food, and lessons at Topgolf venues across the US, so check that there is one near them.",
      },
      { kind: "gifts", ids: ["r296", "r62", "r994"] },

      { kind: "h2", text: "Keeping it comfortable" },
      {
        kind: "list",
        items: [
          "Choose something neutral. Clothing, fragrance, and anything that depends on size or personal taste are risky with colleagues you don't know well.",
          "Ask about food before you send it. A quick question to a teammate about dietary restrictions avoids a box of treats nobody can eat.",
          "Check before giving alcohol. Some people don't drink, and some workplaces have rules about it.",
          "Pass a card around. A short note from each person often means as much as the gift, especially at a farewell.",
          "When a colleague is ill or grieving, the right gift looks different. Our guide to [what to send a coworker who is sick or grieving](/blog/what-to-send-a-coworker-who-is-sick-or-grieving) covers those situations.",
        ],
      },
    ],
    cta: "Shopping for one coworker in particular? Tell the quiz the occasion, their interests, and your budget, and it will rank gifts from our catalog.",
  },

  {
    slug: "what-to-send-a-coworker-who-is-sick-or-grieving",
    title: "What to send a coworker who is sick, recovering, or grieving",
    description:
      "Low-pressure gifts for a colleague who is ill, recovering, or grieving a person or a pet, plus what to check before you send anything and what to write.",
    published: "2026-10-17",
    intro: [
      "When a colleague is ill, recovering from surgery, or grieving, it is natural to want to do something, and just as natural to worry about getting it wrong. A good gift in these moments is easy to receive. It asks nothing of them, needs no thank-you note, and fits what they are actually going through.",
      "The suggestions below are grouped by situation, with a few practical checks first and some help with the card at the end.",
    ],
    body: [
      { kind: "h2", text: "Check a few things first" },
      {
        kind: "list",
        items: [
          "Ask someone close to them. A manager or a work friend often knows whether they would welcome a delivery, and where they are staying.",
          "Respect their privacy. Share only what they have chosen to share, and keep details about their health out of group chats and card messages.",
          "Ask about food. Treatment and recovery can change what someone is able to eat, and grief can take away an appetite entirely.",
          "Say that no reply is needed. Writing thank-you notes is one more task for someone who is already stretched.",
        ],
      },

      { kind: "h2", text: "If they're recovering at home" },
      {
        kind: "p",
        text: "Someone resting at home after surgery or an illness usually needs two things: food they don't have to cook and comfortable ways to pass the time.",
      },
      {
        kind: "p",
        text: "Spoonful of Comfort's [Get Well Soon Gift Package](gift:r600) brings two quarts of soup, six rolls, six cookies, a keepsake ladle, and a card with your message, which covers a few meals with no effort on their part. The [Bearaby Snuggler](gift:r771) is a weighted, bottle-shaped pillow with a clay-based fill that warms in the microwave in about a minute and holds heat for up to an hour, and it can rest on the stomach, back, or lap. For long afternoons on the couch, an [Audible gift membership](gift:r874) gives them one audiobook credit a month, and it doesn't auto-renew.",
      },
      { kind: "gifts", ids: ["r600", "r771", "r874"] },

      { kind: "h2", text: "If they're facing a longer stretch of treatment" },
      {
        kind: "p",
        text: "A long illness changes the kind of help that is useful. Gifts that keep working over weeks, or that make hospital stays and clinic visits a little easier, tend to mean more than one big gesture.",
      },
      {
        kind: "p",
        text: "A [Disney+ gift card](gift:r2) goes toward a subscription, which gives them something easy to watch at home or in a waiting room. [Loop Switch 2 earplugs](gift:r679) change between three settings with a dial, including 26 dB of noise reduction for sleep, which helps in a shared hospital room or a busy house. [Hope Cards](gift:r330) from KindSide are a small deck of 28 hand-painted affirmations, a gentle thing to keep on a nightstand or tray table.",
      },
      { kind: "gifts", ids: ["r2", "r679", "r330"] },

      { kind: "h2", text: "If they've lost someone" },
      {
        kind: "p",
        text: "When a colleague is grieving, the main thing is to let them know you are thinking of them. Keep the gift modest, and lean toward food for the household or something that honors the person who died.",
      },
      {
        kind: "p",
        text: "Harry & David's [Sympathy Gift Box](gift:r767) holds pears, apples, cheddar, summer sausage, crackers, and baked goods, packed in a box that can be set out when visitors come by. For someone who copes by reading, [It's OK That You're Not OK](gift:r772) by psychotherapist Megan Devine speaks to grieving people directly, with practical help for the anxiety and fog of grief. If you would like the gift to outlast the moment, One Tree Planted's [Gift Trees In Memory](gift:r1077) plants trees in the person's name, sends a personalized e-card on the date you choose, and leaves the family nothing to look after.",
      },
      { kind: "gifts", ids: ["r767", "r772", "r1077"] },

      { kind: "h2", text: "If they've lost a pet" },
      {
        kind: "p",
        text: "Coworkers often heard about that dog or cat every week, so a small acknowledgment shows you understand how much the loss hurts.",
      },
      {
        kind: "p",
        text: "The [Savor Pet Story Box](gift:r776) has a 5 by 7 photo frame on the front and three lidded compartments inside for a collar, tags, and other keepsakes. [Goodbye, Friend](gift:r775) by Gary Kowalski offers stories and advice for anyone grieving an animal, including how to talk with children about the loss. You can also make a [memorial donation to the ASPCA](gift:r778), which sends the family a card by email right away or by mail within 3 to 10 business days.",
      },
      { kind: "gifts", ids: ["r776", "r775", "r778"] },

      { kind: "h2", text: "What to write in the card" },
      {
        kind: "p",
        text: "Short and sincere works best. Acknowledge what happened, offer support without asking them to do anything, and leave out advice or comparisons with your own experience. A few starting points:",
      },
      {
        kind: "list",
        items: [
          "For an illness or recovery: “Thinking of you and hoping each day gets a little easier. Please don't worry about anything here.”",
          "For a loss: “I'm so sorry about your mother. I'm thinking of you and your family.”",
          "For a pet: “I'm so sorry about Biscuit. I know how much he meant to you.”",
        ],
      },
      {
        kind: "p",
        text: "If the whole team is signing, a short line from each person adds up to something that feels supportive without being overwhelming.",
      },
    ],
    cta: "Looking for a sympathy gift? Choose Coworker and Sympathy in the quiz to see only the gifts we've hand-picked for someone who is grieving.",
  },
];
