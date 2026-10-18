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
 * status TRUE in the Gifts sheet); `npm test` checks this against the live
 * catalog (scripts/check-posts.mjs). Free ideas (a handwritten note, a
 * playlist) stay plain text with no link. House style: no em-dashes, the
 * Oxford comma, US spelling, and no Presently mentions.
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

/**
 * Where a text segment links, or null to show it as plain text. A gift link
 * stays a link while its gift is live; `live` is null when the catalog isn't
 * known (still loading, or it failed to load), and then every link stays.
 */
export function segmentHref(seg: InlineSegment, live: Set<string> | null): string | null {
  if (!seg.href) return null;
  if (seg.giftId && live && !live.has(seg.giftId)) return null;
  return seg.href;
}

/** The posts that recommend a gift, newest first (for "Featured in" on gift pages). */
export function postsFeaturing(giftId: string): Post[] {
  return POSTS.filter((p) => postGiftIds(p).includes(giftId));
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

/** The real date the current text was written; published dates are spread over the months before it. */
const REVISED = "2026-10-17";

const ALL_POSTS: Post[] = [
  {
    slug: "how-to-choose-a-gift-by-love-language",
    title: "How to choose a gift by love language",
    description:
      "Learn the everyday clues that show which love language someone speaks, then find gift ideas for quality time, words, acts of service, touch, and gifts.",
    published: "2026-07-22",
    updated: REVISED,
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
        text: "The simplest version costs nothing: a handwritten note. Pick three or four moments you love from your time together, write a few lines about each, and sign it by hand. A custom playlist works the same way. Choose songs whose lyrics say what you would like to tell them, put them in an order that tells a little story, and give the playlist a name only the two of you will understand.",
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
        text: "A homemade coupon book is the classic way to do the job yourself. Fill a small notebook or a stack of cards with offers they can redeem whenever they like, such as a Saturday of errands run for them, a dinner cooked start to finish, or a day of pampering while you handle everything else. Each coupon hands them a few hours away from the to-do list, on a day they get to choose.",
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
        text: "A [custom star map print](gift:r944) shows the sky over a chosen place and date, such as the night you met, along with a message of your own. The [solid walnut musical keepsake](gift:r706) is a palm-sized wind-up box that plays one tune you choose from hundreds. For someone who loves finding a package on the doorstep, a [Book of the Month membership](gift:r615) lets them pick a new hardcover or audiobook each month, so the gift keeps arriving long after the occasion.",
      },
      { kind: "gifts", ids: ["r944", "r706", "r615"] },

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
    published: "2026-07-08",
    updated: REVISED,
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
      {
        kind: "p",
        text: "For a film buff, the [Kodak Luma 75 pocket projector](gift:r242) plays HD video on a picture that stretches up to 100 inches, so movie night can happen on any wall or out in the backyard.",
      },
      { kind: "gifts", ids: ["r832", "r1073", "r1053", "r242"] },

      { kind: "h2", text: "Upgrade something he uses every day" },
      {
        kind: "p",
        text: "He probably owns a kitchen knife, a watch, and a kettle already, but they may be the ones he bought in a hurry years ago. Replacing one with a much better version means he notices the gift every time he uses it.",
      },
      {
        kind: "p",
        text: "The [Shun Classic 8-Inch Chef's Knife](gift:r739) is handmade in Japan with a VG-MAX steel core and 68 layers of Damascus cladding, and it handles most of the chopping, slicing, and mincing in a home kitchen. The [Timex Marlin Automatic](gift:r960) reissues a 1960s design with a 21-jewel automatic movement, a green dial, and a black leather strap, and it never needs a battery. For his morning coffee or tea, the [Fellow Stagg EKG Pro](gift:r532) is a gooseneck electric kettle that heats water to the exact degree, which pour-over fans appreciate. And if he runs the grill, the [MEATER Pro](gift:r373) is a fully wireless smart probe that tracks the temperature of whatever he is cooking.",
      },
      { kind: "gifts", ids: ["r739", "r960", "r532", "r373"] },

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
        text: "Sometimes the man who wants nothing would quietly enjoy being asked about his life. [Dad, I Want to Hear Your Story](gift:r993) is a guided journal with more than 300 prompts about his childhood, work, and family, and once it is filled in it becomes a keepsake for his children and grandchildren. [Storyworth](gift:r636) works over a year instead, sending weekly prompts and turning his answers into a hardcover memoir. If he would rather look at photos than write, the [Aura Carver](gift:r93) is a 10-inch digital frame you fill from a phone app, with unlimited free storage for the family pictures he keeps meaning to print.",
      },
      { kind: "gifts", ids: ["r993", "r636", "r93"] },

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
      "Budget guidance for coworker gifts from you alone or from the whole team, with picks for birthdays, promotions, weddings, new babies, farewells, and hard times.",
    published: "2026-08-05",
    updated: REVISED,
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
        text: "At this price the goal is a small treat that feels chosen, ideally something a little nicer than they would pick up for themselves.",
      },
      {
        kind: "p",
        text: "For the coworker who can't start the day without coffee, the [Onyx Coffee Lab Blend Discovery Box](gift:r425) holds three small boxes of whole bean coffee in dark, balanced, and light roasts from the award-winning Arkansas roaster. Queen Majesty's [Hot Sauce Trinity](gift:r418) is a gift box of three small-batch New York sauces, from Jalapeño Tequila Lime to Red Habanero Black Coffee. For the office cook, Jacobsen Salt Co.'s [Sea Salt Slide Tin Trio](gift:r424) packs hand-harvested Oregon sea salt into three illustrated pocket tins, including a pinot noir infused salt.",
      },
      { kind: "gifts", ids: ["r425", "r418", "r424"] },

      { kind: "h2", text: "$25 to $60: a close colleague or a bigger milestone" },
      {
        kind: "p",
        text: "With a little more room, you can pick something tied to what they enjoy outside of work.",
      },
      {
        kind: "p",
        text: "Chasing Threads' [Stitch Your Own Tea Towel kit](gift:r1027) is a white tea towel printed with nine gold cocktail drawings to fill in with colored embroidery, with thread, a needle, and video lessons for a beginner. A [Candlelight concert gift card](gift:r700) from Fever pays for a string quartet or pianist playing classical pieces and pop tributes in a venue lit by thousands of candles, which makes a lovely thank-you for someone who went above and beyond. For the tea drinker, Tea Forté's [Frank Lloyd Wright Terra Teapot](gift:r1049) is a 20-ounce stoneware pot etched with an original Wright pattern, with an infuser that brews loose tea for two.",
      },
      { kind: "gifts", ids: ["r1027", "r700", "r1049"] },

      { kind: "h2", text: "$60 to $150: when a few people chip in" },
      {
        kind: "p",
        text: "Pooling a few contributions opens up gifts with real staying power, and this is the range where most team gifts land.",
      },
      {
        kind: "p",
        text: "For a promotion or a new role, a year of [MasterClass](gift:r362) gives them online classes from experts across every field, a good fit for someone who loves to learn. Leatherology's [monogrammed leather valet tray](gift:r497) gives their keys, watch, and phone a home on the desk, debossed or hand-painted with their initials.",
      },
      { kind: "gifts", ids: ["r362", "r497"] },
      {
        kind: "p",
        text: "For a coworker's wedding, think about the home the couple is building together. Crate & Barrel's [36-inch cheese board](gift:r12) is a long collage of acacia wood made for hosting, and Williams-Sonoma's [monogrammed kitchen tool set](gift:r191) puts their initials on the tools they will reach for every day. If they enjoy a good bottle, a [virtual wine tasting package](gift:r313) from Priority Wine Pass ships wines from a small winery along with a live tasting session they can turn into a date night.",
      },
      { kind: "gifts", ids: ["r12", "r191", "r313"] },
      {
        kind: "p",
        text: "The first months with a new baby leave very little time for grocery runs. A [Farm Fresh To You produce box](gift:r180) brings seasonal fruit and vegetables to the door, and an [Uber and Uber Eats gift card](gift:r135), in whatever amount the group collects, covers takeout on the nights when cooking is out of the question.",
      },
      { kind: "gifts", ids: ["r180", "r135"] },
      {
        kind: "p",
        text: "For a farewell, help them hold on to the good memories and rest up before the next chapter. The Fujifilm [smartphone photo printer](gift:r274) prints credit-card-size photos from a phone in seconds, which comes in handy at the goodbye party and on whatever comes next. A [ResortPass gift card](gift:r1005) books a day at one of more than 2,700 hotel pools and spas, so they can take a real break between jobs.",
      },
      { kind: "gifts", ids: ["r274", "r1005"] },
      {
        kind: "p",
        text: "When a colleague is going through a hard time, a team gift is a quiet way to show up for them. Spoonful of Comfort's [care package](gift:r600) brings two quarts of soup, six rolls, six cookies, a keepsake ladle, and a card with your message. A year of [Calm](gift:r601), the meditation and sleep app, can arrive by email on the day you choose, and the [Serenity Gift Box](gift:r263) from Loved and Found gathers natural spa products for a slow evening at home.",
      },
      { kind: "gifts", ids: ["r600", "r601", "r263"] },

      { kind: "h2", text: "$150 and up: a gift from the whole team" },
      {
        kind: "p",
        text: "Big collections usually mark big moments, so spend the money on something the person would hesitate to buy for themselves.",
      },
      {
        kind: "p",
        text: "For a new baby, Upon a Box's [Baby Book Library](gift:r39) is a set of classic and bestselling board books for the first years of story time, and Coterie's [diaper and wipes gift subscription](gift:r595) sends monthly deliveries for two to twelve months, with the parents choosing the size when they redeem it.",
      },
      { kind: "gifts", ids: ["r39", "r595"] },
      {
        kind: "p",
        text: "For a wedding or a long-awaited retirement trip, Away's [Carry-On Suitcase](gift:r571) has a hard shell, spinner wheels, and an interior compression system, and an [Airbnb gift card](gift:r309) goes toward the stay itself, whether that is a honeymoon or a farewell adventure.",
      },
      { kind: "gifts", ids: ["r571", "r309"] },
      {
        kind: "p",
        text: "For a milestone birthday or a big promotion, a splurge from the team goes a long way. Sony's [WH-1000XM6 headphones](gift:r596) block out a noisy office with adaptive noise canceling and up to 30 hours of battery. The [LARQ PureVis pitcher](gift:r597) filters water and treats it with UV-C light, a nice upgrade for anyone serious about staying hydrated. Plant lovers will be thrilled with The Sill's [Best Sellers Duo](gift:r598), a monstera and a snake plant that arrive potted in ceramic planters. And for the coffee lover who drinks espresso all day, the [Breville Barista Pro](gift:r50) is a home espresso machine with a built-in grinder.",
      },
      { kind: "gifts", ids: ["r596", "r597", "r598", "r50"] },
      {
        kind: "p",
        text: "If the team can't settle on an object, cash in a card signed by everyone is always welcome, especially at a farewell. And if they would rather do some good, a [TisBest Charity Gift Card](gift:r769) lets the recipient give the money to any of about 1.8 million US charities.",
      },
      { kind: "gifts", ids: ["r769"] },

      { kind: "h2", text: "Keeping it comfortable" },
      {
        kind: "list",
        items: [
          "Choose something neutral. Clothing, fragrance, and anything that depends on size or personal taste are risky with colleagues you don't know well.",
          "Ask about food before you send it. A quick question to a teammate about dietary restrictions avoids a box of treats nobody can eat.",
          "Check before giving alcohol. Some people don't drink, and some workplaces have rules about it.",
          "Pass a card around. A short note from each person often means as much as the gift, especially at a farewell.",
          "When a colleague is ill or grieving, our guide to [what to send someone who is sick, recovering, or grieving](/blog/what-to-send-someone-who-is-sick-or-grieving) has more ideas.",
        ],
      },
    ],
    cta: "Shopping for one coworker in particular? Tell the quiz the occasion, their interests, and your budget, and it will rank gifts from our catalog.",
  },

  {
    slug: "gifts-for-your-brother-or-sister",
    title: "Gifts for your brother or sister, from game night to their first apartment",
    description:
      "Gift ideas for every kind of sibling, from the game night champion to the one who just moved into their first place, plus a few ideas that cost nothing.",
    published: "2026-08-19",
    updated: REVISED,
    intro: [
      "Nobody knows you quite like a sibling, which makes shopping for one oddly hard. You know their taste better than almost anyone, and you also know they will tell you exactly what they think of whatever you pick.",
      "Whether yours is the oldest, the youngest, or somewhere in the middle, the ideas below are sorted by the kind of sibling they are. A few are meant to be shared, since the best part of having a brother or sister is the time you spend together.",
    ],
    body: [
      { kind: "h2", text: "For the sibling who turns every holiday into game night" },
      {
        kind: "p",
        text: "Every family has one: the sibling who pulls out a game the minute dessert is over and still remembers who won last year.",
      },
      {
        kind: "p",
        text: "[Wavelength](gift:r852) is a team party game for 2 to 12 players in which one person gives a clue on a spectrum, like hot to cold, and teammates turn a dial to find the hidden target. The rounds are quick and the debates get loud. [Hitster](gift:r877) is a music game for mixed ages: you scan a song card with your phone, hear the track, and place it on your timeline by release year, with more than 300 songs spanning a century. For a head-to-head rivalry, [KLASK](gift:r509) is a Danish wooden tabletop game that plays like a mix of air hockey and foosball, with magnetic strikers and ten-minute matches.",
      },
      { kind: "gifts", ids: ["r852", "r877", "r509"] },

      { kind: "h2", text: "For the one who just got their first place" },
      {
        kind: "p",
        text: "A first apartment comes with plenty of empty shelves and very few nice things, so help them make it feel like home.",
      },
      {
        kind: "p",
        text: "SodaStream's [Art sparkling water maker](gift:r814) has a retro look and a lever for setting the fizz, and its refillable cylinder and reusable bottle replace a fridge full of cans. Our Place's [Titanium Always Pan Pro](gift:r531) is a 10.5-inch frying pan with a coating-free nonstick surface, the kind of pan that makes cooking at home feel less like a chore. If their walls are still bare, Nanoleaf's [Shapes Hexagons](gift:r577) are modular LED light panels they can arrange however they like and control from an app, by voice, or by touch.",
      },
      { kind: "gifts", ids: ["r814", "r531", "r577"] },

      { kind: "h2", text: "For the sibling who's always on the move" },
      {
        kind: "p",
        text: "If they are the one sending photos from a different airport every month, give them something that makes the trip easier.",
      },
      {
        kind: "p",
        text: "Cotopaxi's [Allpa 35L Travel Pack](gift:r569) is a carry-on backpack that opens like a suitcase, with zippered mesh compartments and shoulder straps that tuck away. For long flights and train rides, the [Trtl travel pillow](gift:r970) wraps around the neck like a soft fleece scarf, with an internal support that holds the head upright, and it weighs less than a phone.",
      },
      { kind: "gifts", ids: ["r569", "r970"] },

      { kind: "h2", text: "For the youngest in the family" },
      {
        kind: "p",
        text: "Shopping for a younger sibling is a chance to be the cool one. The [Camp Snap](gift:r454) is a pocket digital camera with no screen and six film-style filters, so every photo stays a surprise until it is uploaded. For a teen who wants a story to tell at school, an [iFLY gift card](gift:r1051) pays for indoor skydiving, where first-time flyers get training from a certified instructor and then fly twice with one-on-one coaching.",
      },
      { kind: "gifts", ids: ["r454", "r1051"] },

      { kind: "h2", text: "For the one who remembers everything you did as kids" },
      {
        kind: "p",
        text: "Some siblings can recall every family road trip in detail, including the parts you would rather forget. A gift built from your shared history plays right into that.",
      },
      {
        kind: "p",
        text: "The [RetroViewer with a custom photo reel](gift:r733) pairs a classic stereo viewer with a reel of seven of your own photos, made by a company founded by a former View-Master employee. Shutterfly's [custom photo playing cards](gift:r992) put a family picture on the back of every card, which makes the next card game at the holidays a lot more personal.",
      },
      { kind: "gifts", ids: ["r733", "r992"] },
      {
        kind: "p",
        text: "A free idea for this sibling: dig out an old family photo, recreate it together with the same poses and as close to the same outfits as you can manage, and frame the two pictures side by side.",
      },

      { kind: "h2", text: "For the sibling you don't see enough" },
      {
        kind: "p",
        text: "When life has spread you across different cities or different schedules, the best gift might be a plan. [Concert tickets](gift:r1072) to see their favorite artist put a date on the calendar, and Bandsintown makes it easy to find a show near them and buy from the official seller.",
      },
      { kind: "gifts", ids: ["r1072"] },
      {
        kind: "p",
        text: "If the budget is tight, a sibling day costs very little. Pick a morning, plan the whole thing yourself, from breakfast at the diner you went to as kids to a long walk somewhere new, and send them the itinerary as the gift.",
      },
    ],
    cta: "Shopping for a sibling with very specific taste? Tell the quiz what they're into and your budget, and it will rank gifts from our catalog for them.",
  },

  {
    slug: "what-to-send-someone-who-is-sick-or-grieving",
    title: "What to send someone who is sick, recovering, or grieving",
    description:
      "Thoughtful, low-pressure gifts for a friend, relative, or colleague who is ill, recovering, or grieving a person or a pet, plus free ways to help.",
    published: "2026-09-09",
    updated: REVISED,
    intro: [
      "When someone you care about is ill, recovering from surgery, or grieving, it is natural to want to do something, and just as natural to worry about getting it wrong. A good gift in these moments is easy to receive. It asks nothing of them, needs no thank-you note, and fits what they are actually going through.",
      "The ideas below work for a friend, a relative, or a colleague, and they are grouped by situation, with a few practical checks first, some ways to help that cost nothing, and help with the card at the end.",
    ],
    body: [
      { kind: "h2", text: "Check a few things first" },
      {
        kind: "list",
        items: [
          "Ask someone close to them. A partner, a parent, or a close friend often knows whether they would welcome a delivery, and where they are staying.",
          "Respect their privacy. Share only what they have chosen to share, and keep details about their health out of group chats and card messages.",
          "Ask about food. Treatment and recovery can change what someone is able to eat, and grief can take away an appetite entirely.",
          "Say that no reply is needed. Writing thank-you notes is one more task for someone who is already stretched.",
        ],
      },

      { kind: "h2", text: "Start with the things that cost nothing" },
      {
        kind: "list",
        items: [
          "Reach out. A short text or a quick call that says you are thinking of them, and asks for nothing back, can mean as much as anything in a box.",
          "Offer specific help. “Can I walk the dog on Thursday?” is easier to accept than “Let me know if you need anything.”",
          "Share something to listen to. Send a short list of favorite podcasts or audiobooks for the long hours of rest.",
          "Gather a card. If they are a coworker or part of a club or team, pass a card around so they can see how many people are rooting for them.",
        ],
      },

      { kind: "h2", text: "If they're recovering at home: meals and treats" },
      {
        kind: "p",
        text: "Someone resting at home after surgery or an illness usually needs two things: food they don't have to cook and comfortable ways to pass the time. Meals come first.",
      },
      {
        kind: "p",
        text: "An [Instacart gift card](gift:r768) covers groceries, delivery fees, and tips, and it never expires, so they can use it whenever they need a restock. An [Uber and Uber Eats gift card](gift:r135) handles takeout on the nights when nobody feels like cooking. If they live in BoyceMode's delivery area, a [weekly plant-based meal subscription](gift:r318) brings fresh dishes they pick themselves.",
      },
      { kind: "gifts", ids: ["r768", "r135", "r318"] },
      {
        kind: "p",
        text: "Then something sweet. American Spoon's [Up North Breakfast Box](gift:r519) is full of small-batch Michigan preserves, lemon curd, maple syrup, and pancake mix for a slow breakfast in bed. For someone who eats keto or gluten-free, Wonder Monday's [keto cheesecakes](gift:r158) come in four flavors with zero grains or gluten. Sugarfina's [Champagne Bears](gift:r650) are gummies made with Dom Pérignon champagne that contain no alcohol, and they arrive in a festive bottle. For someone who loves a good cocktail, the [Robert Simonson Old-Fashioned Set](gift:r708) is a lovely thing to tuck away for the day they are feeling like themselves again.",
      },
      { kind: "gifts", ids: ["r519", "r158", "r650", "r708"] },

      { kind: "h2", text: "For the long days on the couch" },
      {
        kind: "p",
        text: "Recovery involves a lot of waiting, so look for gifts that make the waiting a little more comfortable.",
      },
      {
        kind: "p",
        text: "Thistle Farms' [essential oil roll-on set](gift:r801) has Calm, Balance, and Focus blends handcrafted by women survivors at the Nashville nonprofit, and the pocket-size rollers need no diffuser. The Qi's [Daily Ritual Flower Tea Set](gift:r612) comes with nine whole blooms and a glass cup for a caffeine-free moment of calm. The [Bearaby Snuggler](gift:r771) is a weighted, bottle-shaped pillow with a clay-based fill that warms in the microwave in about a minute and holds heat for up to an hour, so it can rest on the stomach, back, or lap.",
      },
      { kind: "gifts", ids: ["r801", "r612", "r771"] },
      {
        kind: "p",
        text: "An [Audible gift membership](gift:r874) gives them one audiobook credit a month, and it doesn't auto-renew. [The Little Book of Hygge](gift:r896) by Meik Wiking is a cozy, illustrated read about candlelight, warm drinks, and unhurried time, which suits a slow week at home. And for when they are back on their feet, a [Heyday facial gift card](gift:r1003) pays for a 50-minute facial built around a skin analysis; check that there is a studio near them first.",
      },
      { kind: "gifts", ids: ["r874", "r896", "r1003"] },

      { kind: "h2", text: "If it's a longer stretch of treatment" },
      {
        kind: "p",
        text: "A long illness changes the kind of help that is useful. Gifts that keep working over weeks, or that brighten the room where someone spends most of their time, tend to mean more than one big gesture.",
      },
      {
        kind: "p",
        text: "Living plants bring some green to a room that hasn't seen much fresh air lately. The Sill's [Houseplant of the Month Club](gift:r1075) delivers a new plant in a ceramic planter every month, and its [Best Sellers Duo](gift:r598) sends a monstera and a snake plant at once. For someone who likes to grow their own, the self-watering [Click & Grow Smart Garden 3](gift:r613) grows herbs and greens on the counter under its own lights, and a [heirloom tomato seed bundle](gift:r1074) gives a gardener something hopeful to plan for next season.",
      },
      { kind: "gifts", ids: ["r1075", "r598", "r613", "r1074"] },
      {
        kind: "p",
        text: "A favorite photo makes a thoughtful addition to their space. Framebridge's [custom framed photo](gift:r766) prints your picture, frames it behind a white mat, and ships it in a gift box with a personal note. Voluspa's [customized candle set](gift:r88) lets you pick three mini candles in the scents you think they would like.",
      },
      { kind: "gifts", ids: ["r766", "r88"] },

      { kind: "h2", text: "If they've lost someone" },
      {
        kind: "p",
        text: "When someone is grieving, the main thing is to let them know you are thinking of them. Keep the gift modest, and lean toward food for the household or something that honors the person who died.",
      },
      {
        kind: "p",
        text: "Harry & David's [Sympathy Gift Box](gift:r767) holds pears, apples, cheddar, summer sausage, crackers, and baked goods, packed in a box that can be set out when visitors come by. [Healing After Loss](gift:r774) by Martha Whitmore Hickman offers a short reading for every day of the year, which suits the days when a whole book feels impossible. A [TisBest Charity Gift Card](gift:r769) lets the family give to a charity the person they lost cared about.",
      },
      { kind: "gifts", ids: ["r767", "r774", "r769"] },

      { kind: "h2", text: "If they've lost a pet" },
      {
        kind: "p",
        text: "Friends, family, and coworkers often heard about that dog or cat every week, so a small acknowledgment shows you understand how much the loss hurts.",
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
          "For an illness or recovery: “Thinking of you and hoping each day gets a little easier. I'll check in next week, and there's no need to reply.”",
          "For a loss: “I'm so sorry about your mother. I'm thinking of you and your family.”",
          "For a pet: “I'm so sorry about Biscuit. I know how much he meant to you.”",
        ],
      },
      {
        kind: "p",
        text: "If the card is from a group, such as your team at work, a short line from each person adds up to something that feels supportive without being overwhelming.",
      },
    ],
    cta: "Looking for a sympathy gift? Choose who it's for and Sympathy in the quiz to see only the gifts we've hand-picked for someone who is grieving.",
  },

  {
    slug: "gifts-for-mom-and-dad-from-morning-to-night",
    title: "Gifts for Mom and Dad, from morning coffee to lights out",
    description:
      "Gift ideas for parents that fit their daily routine, from a better morning coffee to dinner at home, weekend trips, and slow evenings.",
    published: "2026-09-24",
    updated: REVISED,
    intro: [
      "Parents spend years looking after everyone else, then insist they don't need a thing when their own birthday comes around. Finding a gift that feels worthy of all that can be a lot of pressure.",
      "It helps to picture an ordinary day in their house. Where do they start the morning, what is for dinner, and how do they wind down at night? The gifts below follow that day from the first cup of coffee to lights out, and each one makes some part of it a little nicer. Most work for one parent or for both, and a few are the kind of thing the whole family can chip in on.",
    ],
    body: [
      { kind: "h2", text: "For their morning coffee" },
      {
        kind: "p",
        text: "In plenty of houses the day starts with coffee, so begin there. The [Ember Mug 3](gift:r293) holds coffee or tea at the exact temperature they choose, adjustable on the mug or in the app, so the first cup doesn't go cold while they read the news. For parents who love a café drink, Nespresso's [Vertuo Next with the Aeroccino3 milk frother](gift:r606) makes espresso, coffee, cappuccinos, and lattes at home.",
      },
      {
        kind: "p",
        text: "For the kitchen counter, Tivoli Audio's [Model One BT radio](gift:r754) is a classic Henry Kloss design in a handmade wood cabinet, now with Bluetooth, so the morning news or their favorite station plays with full sound.",
      },
      { kind: "gifts", ids: ["r293", "r606", "r754"] },

      { kind: "h2", text: "For dinner at home" },
      {
        kind: "p",
        text: "Busy weeks make it hard to cook a real meal, even for parents who love to. If they live in BoyceMode's delivery area, a [weekly plant-based meal subscription](gift:r318) lets them pick the week's dishes and have them arrive fresh. For the parent who likes to cook, the [AeroGarden Harvest](gift:r368) grows fresh herbs and greens on the counter all year with no soil, so the basil is always a snip away. And Fat Gold's [olive oil subscription](gift:r361) sends four tins of small-batch California olive oil over the year, each from a different harvest.",
      },
      { kind: "gifts", ids: ["r318", "r368", "r361"] },

      { kind: "h2", text: "For the weekends" },
      {
        kind: "p",
        text: "Weekends are for getting out of the house. The [National Parks Annual Pass](gift:r201) covers entry to federal recreation lands for a full year and admits everyone in the car, so it works for a road trip with the grandkids too. On rainy weekends, [Wingspan](gift:r855) is a beautifully illustrated board game about attracting birds to your wildlife preserves; it plays one to five people and won the 2019 Kennerspiel des Jahres. (If your parents keep a bird feeder, this one is an easy choice.)",
      },
      { kind: "gifts", ids: ["r201", "r855"] },

      { kind: "h2", text: "For slow evenings and lights out" },
      {
        kind: "p",
        text: "Evenings are when parents finally get to sit down. UGG's [Tasman II slipper](gift:r429) is a suede slipper lined in a wool blend, with a sole sturdy enough for a trip to the mailbox. Aromatherapy Associates' [bath and shower oil collection](gift:r703) holds ten small bottles, including Deep Relax for sleep and De-Stress Muscle for sore muscles, in a navy drawer box that looks lovely on a bathroom shelf.",
      },
      {
        kind: "p",
        text: "If you live far away, a pair of [Long Distance Friendship Lamps](gift:r173) lets you say goodnight without a phone call: touch yours, and theirs lights up with the same glow, wherever they are. And for lights out, the [Hatch Restore 3](gift:r538) combines a sunrise alarm clock, a sound machine, and a bedside light, so the phone can stay in another room.",
      },
      { kind: "gifts", ids: ["r429", "r703", "r173", "r538"] },

      { kind: "h2", text: "Making it a family gift" },
      {
        kind: "p",
        text: "Several of these, like the Nespresso machine or the friendship lamps, are easy to split among siblings. Agree on one gift early, let one person handle the ordering, and ask everyone to add a line to the card, so your parents get to open one thoughtful present from all of you together.",
      },
      {
        kind: "p",
        text: "If you live nearby, the best addition costs nothing. Show up one evening to cook dinner with them, using the herbs from the AeroGarden or the new olive oil, and stay for the board game afterward.",
      },
    ],
    cta: "Shopping for just one of them? Tell the quiz about Mom or Dad, their interests, and your budget, and it will rank gifts from our catalog.",
  },

  {
    slug: "just-because-gifts-for-your-partner",
    title: "Just-because gifts for your partner",
    description:
      "Surprise gifts for your partner for no reason at all: ideas for a night in, a night out, a little pampering, sentimental keepsakes, and small treats.",
    published: "2026-10-08",
    updated: REVISED,
    intro: [
      "Birthdays and anniversaries come with a deadline, so those gifts tend to get planned. The surprises your partner remembers, though, are often the ones that show up on an ordinary Tuesday for no reason except that you were thinking of them.",
      "Here are just-because gifts sorted by the kind of evening or mood they suit, plus a few ideas that cost nothing at all.",
    ],
    body: [
      { kind: "h2", text: "For a night in" },
      {
        kind: "p",
        text: "Some of the best dates happen on the couch. [We're Not Really Strangers: Couples Edition](gift:r406) is a card game for two with 150 questions across three levels, written to help couples learn something new about each other. [The Fox in the Forest Duet](gift:r404) is a cooperative card game for exactly two players, in which you move through a storybook forest as a team without talking strategy. For a slower project, Red Head Barrels' [custom engraved oak aging barrel](gift:r1048) holds two liters of whiskey, rum, or a batched cocktail, and the oak flavors it in about four to six weeks, which gives you a reason to plan a tasting night.",
      },
      { kind: "gifts", ids: ["r406", "r404", "r1048"] },

      { kind: "h2", text: "For a night out" },
      {
        kind: "p",
        text: "If your partner would rather do something than own something, plan the outing for them. A [Board & Brush gift card](gift:r1013) covers a workshop where an instructor guides you through staining and stenciling a wood sign or tray, and the studios are BYOB. A [Melting Pot gift card](gift:r1012) turns dinner into a long evening of cheese fondue, a main course cooked at the table, and chocolate fondue to finish. For a true surprise, a [sunrise hot air balloon ride](gift:r365) ends with a champagne toast. Check for a nearby location before buying any of the three.",
      },
      { kind: "gifts", ids: ["r1013", "r1012", "r365"] },

      { kind: "h2", text: "For a little pampering" },
      {
        kind: "p",
        text: "Treat the partner who never makes time for themselves. Olfactory NYC's [at-home custom scent experience](gift:r919) lets them sample scents at home, order blends of their favorites, and finish with a 50 ml bottle of their own fragrance with their name on the label. Mount Lai's [jade facial spa set](gift:r920) pairs a gua sha and a roller for a few calm minutes of facial massage, and the gua sha won a 2022 Allure Best of Beauty award. For a bath night, Herbivore's [Coco Milk bath soak](gift:r894) is a powdered coconut milk and vanilla soak that leaves skin soft.",
      },
      { kind: "gifts", ids: ["r919", "r920", "r894"] },

      { kind: "h2", text: "For the sentimental one" },
      {
        kind: "p",
        text: "A just-because gift can say a lot in a few words. Patricia Carlin's [Intersection of Love print](gift:r731) is a black-and-white photo of two crossing street signs printed with your names and the years that matter to you. YELLOWPOP's [custom LED neon sign](gift:r641) lets you design your own words, font, and color, and it usually ships ready to hang within two to three weeks. For someone who still loves getting letters, Artisaire's [monogram wax seal stamp](gift:r946) is engraved with your two initials, ready for the next note you leave on their pillow.",
      },
      { kind: "gifts", ids: ["r731", "r641", "r946"] },

      { kind: "h2", text: "Small surprises for an ordinary day" },
      {
        kind: "p",
        text: "Not every just-because gift needs a big moment. Hukka's [Orbits Eye Stones](gift:r893) are two rings of Finnish soapstone that hold the cold from the fridge and rest on tired eyes after a long day at a screen. Companion Candles' [Cuddle Me Cozy Candle](gift:r331) smells of fresh linen, clean cotton, and warm musk, and it is made to be pet-friendly. For the whiskey fan, Pop Chart's [Whiskeys scratch-off chart](gift:r1047) hides famous bottles under scratch-off panels that they reveal one tasting at a time.",
      },
      { kind: "gifts", ids: ["r893", "r331", "r1047"] },

      { kind: "h2", text: "And a few that cost nothing" },
      {
        kind: "list",
        items: [
          "Leave a note where they will find it: in a coat pocket, a lunch bag, or on the bathroom mirror. Two lines about something you noticed this week are plenty.",
          "Plan the whole date yourself, down to the reservation and the babysitter, so all they have to do is show up.",
          "Take over the chore they like least for a week, without being asked and without mentioning it.",
        ],
      },
      {
        kind: "p",
        text: "Whatever you choose, skip the big buildup. Leave it on the kitchen table or hand it over at the end of an ordinary day, with a line about why it made you think of them.",
      },
    ],
    cta: "Want ideas matched to your partner's interests? Tell the quiz a little about them and your budget, and it will rank gifts from our catalog.",
  },
];

/** Newest first. */
export const POSTS: Post[] = [...ALL_POSTS].sort((a, b) => b.published.localeCompare(a.published));
