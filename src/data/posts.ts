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
  /** The H1, and with " · GiftPicker" added the title tag, unless metaTitle is set. */
  title: string;
  /** A shorter title tag, for when the H1 plus " · GiftPicker" runs past 60 characters. */
  metaTitle?: string;
  /** Meta description and the blurb on /blog: 155 characters or fewer, unique per post. */
  description: string;
  /** Slugs of two or three related posts, linked at the end of the post. */
  related?: string[];
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
 * Gifts added to the sheet for these posts that Dalia has not approved yet
 * (Status Live, Review status FALSE), from
 * ~/Sites/gift-picker-batches/blog/batch_presently_gifts.json. Until a gift is
 * in the live catalog it reads as plain text with no card; once she approves it,
 * it links and shows its card on its own. `npm test` (scripts/check-posts.mjs)
 * reports these as pending, says when one has gone live (then delete its entry
 * here), and fails if she rejects one, so its sentence can be rewritten.
 */
export const PENDING_GIFTS: Record<string, { name: string; presentlySource: string }> = {};

export function isPendingGift(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(PENDING_GIFTS, id);
}

/**
 * Where a text segment links, or null to show it as plain text. A gift link
 * stays a link while its gift is live. `live` is null when the catalog isn't
 * known (still loading, or it failed to load): then established gifts keep
 * their links, and pending gifts wait until the catalog confirms them.
 */
export function segmentHref(seg: InlineSegment, live: Set<string> | null): string | null {
  if (!seg.href) return null;
  if (seg.giftId && (live ? !live.has(seg.giftId) : isPendingGift(seg.giftId))) return null;
  return seg.href;
}

/** The posts that recommend a gift, newest first (for "Featured in" on gift pages). */
export function postsFeaturing(giftId: string): Post[] {
  return POSTS.filter((p) => postGiftIds(p).includes(giftId));
}

/** The page's <title>: 60 characters or fewer (checked in scripts/logic.test.ts). */
export function postTitleTag(post: Post): string {
  return post.metaTitle ?? `${post.title} · GiftPicker`;
}

/** The post's share image (1200x630, in public/blog/og/, made by scripts/make-share-images.mjs). */
export function postShareImage(post: Post): string {
  return `/blog/og/${post.slug}.jpg`;
}

/** Two or three posts to link at the end of a post: its `related` list, topped up with the newest others. */
export function relatedPosts(post: Post, count = 3): Post[] {
  const picked = (post.related ?? []).map(findPost).filter((p): p is Post => !!p && p.slug !== post.slug);
  for (const p of POSTS) {
    if (picked.length >= count) break;
    if (p.slug !== post.slug && !picked.includes(p)) picked.push(p);
  }
  return picked.slice(0, count);
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
const REVISED = "2026-10-18";

const ALL_POSTS: Post[] = [
  {
    slug: "baby-shower-gifts-for-a-coworker",
    title: "Baby shower gifts for a coworker, at every budget",
    metaTitle: "Baby shower gifts for a coworker · GiftPicker",
    description:
      "Baby shower gifts for a coworker at every budget, from a sweet little gift from you to a big one from the whole team, plus office baby shower ideas.",
    related: ["how-much-to-spend-on-a-coworker-gift", "holiday-gifts-for-kids-by-age", "how-to-choose-a-gift-by-love-language"],
    published: "2026-10-25",
    intro: [
      "A coworker with a baby on the way is one of the happiest things an office gets to celebrate! Picking the gift takes a little more thought, though. New parents are about to be short on sleep, time, and free hands, so the best gifts are the ones they reach for again and again.",
      "Here are gifts at every budget, from a sweet little something you can give on your own to a bigger gift the whole team can go in on, plus a few ideas for throwing the shower itself.",
    ],
    body: [
      { kind: "h2", text: "How much to spend" },
      {
        kind: "p",
        text: "Check the registry first. The host can usually share the link, or you can search the parent's name on Babylist, Amazon, or Target. If you're shopping off the registry, $25 to $50 is plenty from you alone, $50 to $150 works for a few coworkers together, and $150 and up covers one of the bigger registry items from the whole team. If you're collecting, suggest an amount per person and let everyone know they can give whatever works for them.",
      },

      { kind: "h2", text: "Go in on one gift together" },
      {
        kind: "p",
        text: "Small shower gifts have a way of doubling up. Between coworkers, friends, and family, new parents can end up with three copies of the same board book and a mountain of tiny outfits, while the carrier or the diaper subscription they registered for goes unbought. When eight or ten coworkers each chip in $15 or $20, the team can give one gift the parents will use every single day. Everyone still signs the card, and nobody has to guess what's already in the nursery.",
      },
      {
        kind: "p",
        text: "Want to give something of your own too? A small gift from a work friend is always a sweet touch, and the picks under $50 below are easy to bring along.",
      },

      { kind: "h2", text: "Little gifts under $50" },
      {
        kind: "p",
        text: "Start the baby's bookshelf early! The [Hello, World! board books](gift:r821) introduce birds, bugs, dinosaurs, and the solar system with bright art and simple first facts, and the [Goodnight Little Me personalized book](gift:r736) puts the baby's name right on the cover and all through a bedtime story. Just make sure the parents have shared the name, and leave a little time for printing. A picture book you loved as a kid, with a note inside about why, is a sweet choice too.",
      },
      { kind: "gifts", ids: ["r821", "r736"] },
      {
        kind: "p",
        text: "Sophie la Girafe's [teether](gift:r292) has been a first-toy favorite since 1961, and babies love that she squeaks. Crate & Kids' [Monthly Milestone Mat](gift:r196) sets the scene for the month-by-month photos most new parents love to take, and a [Shoott gift card](gift:r828) puts credit toward a family photo session with a local photographer once the little one arrives.",
      },
      { kind: "gifts", ids: ["r292", "r196", "r828"] },

      { kind: "h2", text: "Everyday essentials from a few coworkers" },
      {
        kind: "p",
        text: "With a few people chipping in ($50 to $150), you can cover the gear parents use every day. Solly Baby's [Wrap Carrier](gift:r554) keeps a newborn snuggled close while leaving the parent's hands free for a cup of coffee. Hatch's [sound machine and night light](gift:r250) plays white noise and glows softly for 3 a.m. feedings, then works as a time-to-rise clock in the toddler years. Savor's [Baby Deluxe Keepsake Box](gift:r611) gives every first card and hospital bracelet a labeled spot, from birth to age four, and Babo Botanicals' [Sensitive Baby Care Essentials set](gift:r1173) covers bath time and diaper changes with four fragrance-free basics in a reusable pouch.",
      },
      { kind: "gifts", ids: ["r554", "r250", "r611", "r1173"] },
      {
        kind: "p",
        text: "Cooking is usually the first thing to go once a newborn comes home, which makes a meal delivery gift card one of the most welcome gifts there is. An [Uber Eats gift card](gift:r135) covers takeout on the nights nobody has time to cook, and a DoorDash card works just as well.",
      },
      { kind: "gifts", ids: ["r135"] },

      { kind: "h2", text: "Big gifts from the whole team" },
      {
        kind: "p",
        text: "When the whole office goes in together ($150 and up), you can give something that keeps on helping for months. Coterie's [diaper and wipes gift subscription](gift:r595) arrives every month for 2 to 12 months, and the parents pick the size when they redeem it, so it always fits. Upon a Box's [Baby Book Library](gift:r39) fills the nursery shelf with classic and bestselling board books for story time. Lovevery's [Play Gym](gift:r237) gives a newborn something to look at, bat at, and finally grab during tummy time, with new pieces for each stage of the first year, and Indi's [diaper backpack](gift:r147) looks like an everyday backpack while holding everything a parent needs to get out the door with a baby.",
      },
      { kind: "gifts", ids: ["r595", "r39", "r237", "r147"] },

      { kind: "h2", text: "A little something for the parents" },
      {
        kind: "p",
        text: "Parents need some looking after too! A Spafinder gift card works at spas across the country and gives a new parent a few hours to themselves once they're ready for a break. And for after the baby arrives, if the team knows them well, RENPHO's [shiatsu foot massager](gift:r372) treats tired feet to a deep-kneading massage with heat, right from the couch.",
      },
      { kind: "gifts", ids: ["r372"] },
      {
        kind: "p",
        text: "And you really can't go wrong with cash or a gift card. A Target or Amazon card lets the parents fill in whatever is still missing from the registry, and a little cash from the whole team can go straight into the baby's savings account.",
      },

      { kind: "h2", text: "Office baby shower ideas" },
      {
        kind: "list",
        items: [
          "Ask the parent-to-be first. Some people would rather skip a party at work, and a card with a group gift is a lovely alternative.",
          "Plan it a few weeks before their leave starts, when they still feel up for a celebration. Lunch or an afternoon break in a conference room works well.",
          "Keep it short: half an hour with cake and a card is plenty.",
          "Pass a card around, and invite remote teammates to sign a digital card or join by video.",
          "Think ahead to after the baby arrives. A meal delivery gift card, or a meal train the team signs up for, is a big help in those first weeks at home.",
        ],
      },

      { kind: "h2", text: "Giving in the baby's honor" },
      {
        kind: "p",
        text: "If the parents would rather not receive more things, the team can give back in the baby's honor (check with them first). A [TisBest Charity Gift Card](gift:r769) lets them choose from about 1.8 million US charities, including March of Dimes and Every Mother Counts, which work for healthy pregnancies and safe births. Send it with a card the whole team signs.",
      },
      { kind: "gifts", ids: ["r769"] },
    ],
    cta: "Shopping for a different coworker or occasion? Tell the quiz who it's for and your budget, and it will pick gifts from our catalog for you.",
  },

  {
    slug: "holiday-gifts-for-kids-by-age",
    title: "Holiday gifts for kids, from toddlers to teens",
    metaTitle: "Holiday gifts for kids by age · GiftPicker",
    description:
      "Holiday gifts for kids from toddlers to teens, sorted by age: toys, books, craft kits, games, and gear they keep using. Most work for fall birthdays too.",
    related: ["gifts-for-your-brother-or-sister", "baby-shower-gifts-for-a-coworker", "how-to-choose-a-gift-by-love-language"],
    published: "2026-10-25",
    intro: [
      "There's nothing quite like watching a kid tear into a gift they love! The best ones keep that excitement going long after the wrapping paper is gone, and they spark creativity, imagination, and curiosity along the way.",
      "We sorted our favorites by age, from babies to teens, and picked each one for how well it fits that age and how long it holds up. Most work just as well for a fall birthday, and the bigger ones make great group gifts, so the whole family can go in on one really good present.",
    ],
    body: [
      { kind: "h2", text: "A few tips before you shop" },
      {
        kind: "list",
        items: [
          "Go by the age on the box, since a gift that's too advanced usually ends up on a shelf.",
          "Check with the parents about space and noise. A drum set is a big commitment in a small apartment!",
          "Twins and close siblings can share a big gift like a building set, but each will want something of their own to open too.",
          "Order by early December. Popular toys sell out, and deliveries slow down in the last weeks before the holidays.",
        ],
      },

      { kind: "h2", text: "Babies and toddlers, under 3" },
      {
        kind: "p",
        text: "Little ones learn with their hands and bodies, so look for toys they can climb, push, and bang on. Lovevery's [Play Kits](gift:r550) are Montessori-inspired boxes of toys, each designed for a child's exact stage of development. You can prepay one to three kits, and each one is matched to the child's age when the parents activate it, so new toys keep arriving as they grow.",
      },
      {
        kind: "p",
        text: "Hape's [Pound & Tap Bench](gift:r824) sends balls rolling over xylophone keys with every whack of the hammer, and the xylophone slides out to play on its own. HABA's [First Orchard](gift:r716) is a first board game for ages 2 and up, where everyone works together to pick the chunky wooden fruit before the raven gets there.",
      },
      { kind: "gifts", ids: ["r550", "r824", "r716"] },

      { kind: "h2", text: "Ages 3 to 5" },
      {
        kind: "p",
        text: "Still wondering whether they'll grow up to be a chef, a shopkeeper, or the world's best ice cream scooper? Melissa & Doug's [Scoop and Serve Ice Cream Counter](gift:r907) lets them try all three, with eight scoops, toppings, cones, and play money, and the counter stores every piece when the shop closes for the day. Pretend play like this is how preschoolers practice talking, sharing, and solving problems.",
      },
      {
        kind: "p",
        text: "A [Magna-Tiles Classic 32-Piece Set](gift:r551) snaps together into towers, houses, and ramps, and the translucent tiles glow when the sun shines through them. For quiet time, the [Toniebox 2](gift:r549) plays songs and stories when a child sets a character figure on top, with no screen in sight, and it comes with one figure to get them started.",
      },
      { kind: "gifts", ids: ["r907", "r551", "r549"] },

      { kind: "h2", text: "Ages 6 to 8" },
      {
        kind: "p",
        text: "Kids this age love building something big enough to climb inside, and Tubelox's [Deluxe 220-Piece Set](gift:r1170) is a STEM building set of big plastic tubes and connectors that snap into race cars, forts, and whatever else they dream up, and at this size it's a great one for grandparents and relatives to go in on together. Elenco's [Snap Circuits Beginner kit](gift:r717), for ages 5 to 9, builds more than 20 working circuits, from a spinning fan to flashing lights, and Makedo's [cardboard construction kit](gift:r795), for ages 5 and up, turns delivery boxes into forts, costumes, and cars with kid-safe saws and 120 reusable screws.",
      },
      { kind: "gifts", ids: ["r1170", "r717", "r795"] },
      {
        kind: "p",
        text: "For family game night, [Ticket to Ride: First Journey](gift:r784) is the kids' version of the classic train game for ages 6 and up, and a round takes just 15 to 30 minutes. The [Dog Man box set](gift:r1162) collects the first six of Dav Pilkey's graphic novels, a favorite even with kids who don't usually pick up a book. And to get them outside, Razor's [A Kick Scooter](gift:r1153) folds flat to carry and suits riders 5 and up (add a helmet if they don't have one yet).",
      },
      { kind: "gifts", ids: ["r784", "r1162", "r1153"] },

      { kind: "h2", text: "Ages 9 to 12" },
      {
        kind: "p",
        text: "Older kids are ready for real tools and real projects, and there's nothing like the pride of making something themselves. National Geographic's [Kids' Pottery Wheel Kit](gift:r798), for ages 8 and up, comes with a plug-in wheel, air-dry clay, sculpting tools, and paints, so they can shape cups and bowls and paint them once they dry, no kiln needed. Thames & Kosmos's [Chem C1000](gift:r725), for ages 10 and up, guides 125 experiments, from invisible ink to splitting water into hydrogen and oxygen, and Sphero's [Mini coding robot](gift:r787), for ages 8 and up, is a robot the size of a ping-pong ball that they drive from a phone or tablet and learn to program with the free app.",
      },
      { kind: "gifts", ids: ["r798", "r725", "r787"] },
      {
        kind: "p",
        text: "For bookworms, [The Wild Robot boxed set](gift:r1163) holds all three books about a robot who learns to survive on a wild island, and the [illustrated edition of Harry Potter and the Sorcerer's Stone](gift:r1164) has more than 100 full-color pictures by Jim Kay. Doodlers and painters will love Faber-Castell's [Young Artist Essentials set](gift:r800), a wooden case of colored and watercolor pencils, oil pastels, markers, and paper. And Camp Snap's [screen-free camera](gift:r454) has six built-in film-style filters, so every photo is a surprise until it's downloaded.",
      },
      { kind: "gifts", ids: ["r1163", "r1164", "r800", "r454"] },

      { kind: "h2", text: "Teens, 13 to 17" },
      {
        kind: "p",
        text: "Teenagers can be tricky to shop for, so start with a hobby they already love or a skill they've been wanting to learn. Not sure what that is? Ask a parent. Fujifilm's [Instax Mini 13](gift:r148) prints credit-card-size photos in about five seconds, the kind that end up taped to a mirror or a locker. Learning an instrument is a great way to spend some time away from screens, and Yamaha's [GigMaker Deluxe pack](gift:r1171) has everything a new guitarist needs: a full-size acoustic guitar, a gig bag, a clip-on tuner, a strap, and picks. If they already play electric, Positive Grid's [Spark GO](gift:r756) is a palm-size practice amp whose app shows the chords to the songs they want to learn.",
      },
      { kind: "gifts", ids: ["r148", "r1171", "r756"] },
      {
        kind: "p",
        text: "Penny's original [22-inch board](gift:r1156) is a plastic cruiser small enough to fit in a backpack. And speaking of backpacks, Fjällräven's [Kånken](gift:r1159) has carried books and lunches since 1978, with a full zip opening, two side pockets, and 38 colors to choose from. And for a group of friends, the [Dungeons & Dragons Starter Set](gift:r856) is made so first-timers can start their adventure the same night.",
      },
      { kind: "gifts", ids: ["r1156", "r1159", "r856"] },

      { kind: "h2", text: "Advent calendars and Hanukkah gifts" },
      {
        kind: "p",
        text: "An advent calendar gives them something to open every morning in December. LEGO's [City Advent Calendar](gift:r802) hides 24 small builds behind numbered doors, and the box folds out into Santa's workshop. Melissa & Doug's [wooden advent calendar](gift:r1167) is a tree with 24 magnetic ornaments that comes out again every year, and the [Where's Waldo? Advent Calendar](gift:r1168) holds a tiny search-and-find book for each day.",
      },
      {
        kind: "p",
        text: "With eight nights of Hanukkah, many families give a small gift on most nights and one bigger gift on another. Smaller picks from this guide, like the Snap Circuits kit or a book from one of the boxed sets, make easy single-night gifts. For the holiday itself, Super Smalls' [activity set](gift:r1169) lets kids paint their own ceramic menorah, which holds real candles once it's finished, and comes with a booklet of trivia and jokes for all eight nights.",
      },
      { kind: "gifts", ids: ["r802", "r1167", "r1168", "r1169"] },

      { kind: "h2", text: "Gifts that give back" },
      {
        kind: "p",
        text: "The holidays are a great time to show kids how much fun giving back can be, and they get even more into it when they choose the cause. World Wildlife Fund's [polar bear adoption kit](gift:r812) is a donation to WWF's conservation work that comes with a plush polar bear and an adoption certificate. You can also donate together to a charity they pick, like Make-A-Wish, which grants wishes to children with critical illnesses, Oceana for a kid who loves the ocean, or a toy drive in your town.",
      },
      { kind: "gifts", ids: ["r812"] },
    ],
    cta: "Shopping for one child in particular? Tell the quiz their age, what they're into, and your budget, and it will pick gifts from our catalog for you.",
  },

  {
    slug: "how-to-choose-a-gift-by-love-language",
    title: "How to choose a gift by love language",
    description:
      "Learn the everyday clues that show which love language someone speaks, then find gift ideas for quality time, words, acts of service, touch, and gifts.",
    related: ["just-because-gifts-for-your-partner", "gifts-for-mom-and-dad-from-morning-to-night", "gifts-for-men-who-say-they-dont-need-anything"],
    published: "2026-10-08",
    updated: "2026-10-19",
    intro: [
      "The idea of love languages comes from author Gary Chapman, who described five ways people tend to give and receive affection: quality time, words of affirmation, acts of service, physical touch, and receiving gifts. Most people respond to all five to some degree, though one or two usually matter more than the rest.",
      "That makes the idea useful when you are choosing a present. A gift that matches how someone feels cared for tends to land well, even when it costs less than something picked at random. The hard part is working out which language your person speaks, so this guide starts there before it gets to the gifts.",
    ],
    body: [
      { kind: "h2", text: "Which love language do they speak?" },
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
        text: "A [Roomba robot vacuum](gift:r256) maps the house and empties its own bin for up to 60 days, which removes one weekly chore for good (my mom still says this is the best gift we ever bought her). An [Instacart gift card](gift:r768) covers groceries, delivery fees, and tips, and it pairs well with an offer to do the ordering yourself. If they are the one who keeps the household schedule in their head, the [Skylight Calendar 2](gift:r953) brings everyone's Google, Outlook, and Apple calendars onto one 15-inch touchscreen, with chore lists built in.",
      },
      { kind: "gifts", ids: ["r256", "r768", "r953"] },

      { kind: "h2", text: "For physical touch: something that feels good to hold" },
      {
        kind: "p",
        text: "This group responds to comfort they can feel. Look for warmth, weight, softness, or pressure, and think about where they carry their stress.",
      },
      {
        kind: "p",
        text: "A weighted blanket is about as close to a hug as a gift can get. The [Gravity Weighted Blanket](gift:r139) spreads its weight evenly across the body for that settled, held feeling, on the couch or in bed.",
      },
      {
        kind: "p",
        text: "The [RENPHO Shiatsu Foot Massager](gift:r372) kneads with heat and runs from a remote, which suits someone who is on their feet all day. For a stiff lower back after long drives or desk days, the [Hyperice Venom 2](gift:r958) wraps around the waist with three heat levels and three vibration patterns, and it runs cordless for about three hours. [The Comfy](gift:r938) is an oversized wearable blanket with a sherpa lining, a deep hood, and a front pocket, made for couch nights and cold mornings.",
      },
      { kind: "gifts", ids: ["r139", "r372", "r958", "r938"] },

      { kind: "h2", text: "For receiving gifts: something chosen with care" },
      {
        kind: "p",
        text: "People who love receiving gifts value the evidence that you were paying attention. For them, the story of why you picked something is a big part of the present.",
      },
      {
        kind: "p",
        text: "A [custom star map print](gift:r944) shows the sky over a chosen place and date, such as the night you met, along with a message of your own. The [solid walnut musical keepsake](gift:r706) is a palm-sized wind-up box that plays one tune you choose from hundreds. For someone who loves finding a package on the doorstep, a [Book of the Month membership](gift:r615) lets them pick a new hardcover or audiobook each month, so a new one keeps arriving after the occasion is over.",
      },
      {
        kind: "p",
        text: "Jewelry can carry a message too. Little Words Project's [custom word bracelet](gift:r929) spells out any word or name you choose in handmade beads, so you can pick one that means something to the two of you. And if they love to browse, a gift card to their favorite store, like Sephora for the beauty lover, turns into a small shopping spree they get to plan themselves.",
      },
      { kind: "gifts", ids: ["r944", "r706", "r615", "r929"] },

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
      "Four ways to shop for a man who already owns what he needs: an experience, an everyday upgrade, something he'll use up, or a new hobby.",
    metaTitle: "Gifts for men who say they need nothing · GiftPicker",
    related: ["gifts-for-mom-and-dad-from-morning-to-night", "just-because-gifts-for-your-partner", "gifts-for-your-brother-or-sister"],
    published: "2026-07-08",
    updated: REVISED,
    intro: [
      "Ask some men what they want and the answer never changes: nothing, really. Sometimes that is modesty, and sometimes it is true in a narrow sense, because he already owns a wallet, a watch, and more gadgets than he uses. Either way, it leaves you guessing.",
      "It helps to stop hunting for a missing object. The approaches below work for a partner, a dad, a brother, or a friend, and each one gets around the problem of buying something he already has.",
    ],
    body: [
      { kind: "h2", text: "Give him an experience" },
      {
        kind: "p",
        text: "A man who has everything he needs can still collect stories. An experience leaves nothing to store, and a good one gives him something to talk about for years.",
      },
      {
        kind: "p",
        text: "An [Xtreme Xperience gift card](gift:r832) goes toward driving a supercar on a real racetrack, from a Lamborghini or Ferrari to a Porsche GT3, with a professional coach in the passenger seat. Events run at more than 40 tracks across the US, so check the schedule near him first. If he follows a team, [tickets to their game](gift:r1073) are easy to find by team and date on StubHub, and the seat details fit neatly in a card. For someone curious about golf, an [intro lesson at Five Iron Golf](gift:r1053), an indoor golf club in 26 US cities, covers grip, stance, and ball position on a Trackman simulator, with video of his swing. For a film buff, a backyard movie night counts too, and the [Kodak Luma 75 pocket projector](gift:r242) plays HD video on a picture that stretches up to 100 inches on any wall.",
      },
      { kind: "gifts", ids: ["r832", "r1073", "r1053", "r242"] },

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
        text: "The [Hot Ones 10 Pack](gift:r468) from Heatonist holds all ten craft hot sauces from a season of the Hot Ones interview show, boxed in order from mild to extreme. A man with a full beard will get real use out of the [Beardbrand Bold Fortune Grooming Set](gift:r924), which pairs beard oil, a matching cologne, and a large comb in a warm, smoky scent of leather, whiskey, saffron, and tobacco. If he runs the grill, Omaha Steaks' [Steak Sampler](gift:r1094) sends eight steaks in four cuts, from T-bones to filet mignon, and the [Spiceology rub collection](gift:r586) gives him twelve mini jars of seasoning blends to try on them, including Smoky Honey Habanero and Korean BBQ.",
      },
      { kind: "gifts", ids: ["r468", "r924", "r1094", "r586"] },

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
    title: "Coworker gifts for every occasion, and how much to spend",
    description:
      "Coworker gift ideas for every occasion, from Secret Santa gifts under $25 to team gifts for birthdays, babies, weddings, promotions, and goodbyes.",
    metaTitle: "Coworker gifts by occasion and budget · GiftPicker",
    related: ["baby-shower-gifts-for-a-coworker", "what-to-send-someone-who-is-sick-or-grieving", "gifts-for-men-who-say-they-dont-need-anything"],
    published: "2026-08-05",
    updated: "2026-10-25",
    intro: [
      "Celebrating together is one of the best parts of work, whether it's a birthday, a new baby, or a big promotion. The right gift for a coworker is friendly and thoughtful without being too personal, and it should feel like you picked it with them in mind.",
      "Here are our favorite coworker gifts for every occasion. Secret Santa coming up? It's right at the top!",
    ],
    body: [
      { kind: "h2", text: "How much to spend" },
      {
        kind: "p",
        text: "From you alone, under $25 covers a birthday or a thank-you, and $25 to $60 is right for a close work friend or a big moment like a promotion. When a group chips in, $60 to $150 is typical, and a gift from the whole team for a wedding, a new baby, or a retirement often runs $150 or more. If you're collecting, suggest an amount and make it clear that any contribution, including none, is welcome.",
      },

      { kind: "h2", text: "Secret Santa gifts under $25" },
      {
        kind: "p",
        text: "Drew the name of someone you barely know? Stay at or just under your office's limit, and go for a treat they'll enjoy or something that makes their desk a little nicer. L.A. Burdick's [Signature Chocolate Mice](gift:r417) are four hand-piped chocolates with ganache centers and silk ribbon tails, and they look like far more than they cost. For the coffee lover, Onyx Coffee Lab's [Blend Discovery Box](gift:r425) holds three small boxes of whole-bean coffee, from dark to light. And for the coworker who brings the best lunches, Diaspora Co.'s [Spice Sampler](gift:r420) packs ten single-origin spices into an illustrated box. Most of these are treats, so check for allergies or dietary rules if you can.",
      },
      { kind: "gifts", ids: ["r417", "r425", "r420"] },
      {
        kind: "p",
        text: "Rifle Paper Co.'s [2027 Desk Calendar](gift:r989), with hand-painted farm illustrations for every month, is a safe bet when you know almost nothing about them. Queen Majesty's [Hot Sauce Trinity](gift:r418) is a gift box of three small-batch New York sauces for the one who puts hot sauce on everything, and Jacobsen Salt Co.'s [Sea Salt Slide Tin Trio](gift:r424) packs hand-harvested Oregon sea salt into three illustrated pocket tins. If your office's limit is a little higher, Vosges Haut-Chocolat's [Snowbound Little Gift](gift:r972) stacks dark chocolate caramels and holiday mini bars into a ribbon-tied tower.",
      },
      { kind: "gifts", ids: ["r989", "r418", "r424", "r972"] },

      { kind: "h2", text: "Birthday gifts" },
      {
        kind: "p",
        text: "For a birthday from you, think about a hobby they've mentioned. Chasing Threads' [Stitch Your Own Tea Towel kit](gift:r1027) comes with nine gold cocktail drawings to fill in with colored embroidery, plus everything a beginner needs. The tea drinker on your team will love Tea Forté's [Frank Lloyd Wright Terra Teapot](gift:r1049), a stoneware pot etched with an original Wright pattern. And for the colleague who lives by lists, Ugmonk's [Analog Starter Kit](gift:r652) keeps the day's priorities on cards in an aluminum stand.",
      },
      { kind: "gifts", ids: ["r1027", "r1049", "r652"] },
      {
        kind: "p",
        text: "For a milestone birthday, pool your money for a splurge. Sometimes you just need to get in the zone, and Sony's [WH-1000XM6 headphones](gift:r596) block out a noisy office with up to 30 hours of battery. Calling all plant lovers! The Sill's [Best Sellers Duo](gift:r598) sends a monstera and a snake plant already potted in ceramic planters. And for the coworker who spends weekends outdoors, the [GoPro HERO12 Black](gift:r369) records stabilized video on every hike and ride.",
      },
      { kind: "gifts", ids: ["r596", "r598", "r369"] },

      { kind: "h2", text: "Baby shower gifts" },
      {
        kind: "p",
        text: "New parents have lots of new responsibilities and very little time for themselves. An [Uber Eats gift card](gift:r135) in whatever amount the group collects covers takeout on the nights dinner isn't happening. From the whole team, Upon a Box's [Baby Book Library](gift:r39) starts the baby's bookshelf with classic board books, and Coterie's [diaper and wipes gift subscription](gift:r595) arrives every month for up to a year. Our guide to [baby shower gifts for a coworker](/blog/baby-shower-gifts-for-a-coworker) has many more ideas at every budget.",
      },
      { kind: "gifts", ids: ["r135", "r39", "r595"] },

      { kind: "h2", text: "Wedding gifts" },
      {
        kind: "p",
        text: "If you can't find the right thing on their registry, a Williams Sonoma or Crate & Barrel gift card goes toward anything their new home still needs. Away's [Carry-On](gift:r571) is ready for the honeymoon, and an [Airbnb gift card](gift:r309) can cover a night or two of the trip. For a couple who loves wine, SommSelect's [three-month wine club membership](gift:r1092) sends bottles chosen by a team led by a Master Sommelier, each with tasting notes and food pairings.",
      },
      { kind: "gifts", ids: ["r571", "r309", "r1092"] },

      { kind: "h2", text: "Promotion and work anniversary gifts" },
      {
        kind: "p",
        text: "A new role deserves a little celebration! From you, a [Candlelight concert gift card](gift:r700) from Fever pays for a string quartet playing in a venue lit by thousands of candles, a lovely thank-you after a big stretch of work (check that there's a show near them first). From a few teammates, a year of [MasterClass](gift:r362) gives someone who loves to learn online classes from experts in every field, and Smythson's [Panama weekly journal](gift:r662), the pocket diary the London stationer introduced in 1908, is ready for the year ahead in the new job.",
      },
      { kind: "gifts", ids: ["r700", "r362", "r662"] },

      { kind: "h2", text: "Farewell and retirement gifts" },
      {
        kind: "p",
        text: "Saying goodbye to a coworker is hard, so send them off with something they'll use at the party or in the break before what's next. Fujifilm's [smartphone photo printer](gift:r274) turns the send-off photos into prints in seconds, and a [ResortPass gift card](gift:r1005) books a day at one of more than 2,700 hotel pools and spas. Cash tucked into a card signed by everyone is always welcome too, especially for a retirement.",
      },
      { kind: "gifts", ids: ["r274", "r1005"] },

      { kind: "h2", text: "Thinking of you and sympathy gifts" },
      {
        kind: "p",
        text: "When a colleague is going through a hard time, a thoughtful package from the team means a lot. Spoonful of Comfort's [care package](gift:r600) brings two quarts of soup, rolls, cookies, a keepsake ladle, and a card with your message, and Loved and Found's [Serenity Gift Box](gift:r263) gathers natural spa products for a slow evening at home. From a close colleague, [It's OK That You're Not OK](gift:r772) by psychotherapist Megan Devine speaks to grieving people directly. Our guide to [what to send someone who is sick, recovering, or grieving](/blog/what-to-send-someone-who-is-sick-or-grieving) has more ideas.",
      },
      { kind: "gifts", ids: ["r600", "r263", "r772"] },

      { kind: "h2", text: "For any occasion" },
      {
        kind: "p",
        text: "When the team can't settle on one thing, cash in a signed card or an Amazon gift card lets them choose for themselves. A year of [New York Times Games](gift:r1124) arrives as a gift code, which makes it an easy pick for a remote coworker. And if they'd rather do some good, a [TisBest Charity Gift Card](gift:r769) lets them give to any of about 1.8 million US charities.",
      },
      { kind: "gifts", ids: ["r1124", "r769"] },

      { kind: "h2", text: "A few tips for gifting at work" },
      {
        kind: "list",
        items: [
          "Keep it neutral. Clothing, fragrance, and anything that depends on size or personal taste are risky with colleagues you don't know well.",
          "Ask about food and drinks first. A quick question to a teammate about allergies, diets, or alcohol saves a gift nobody can enjoy.",
          "Gifts for a manager work best as group gifts, since a solo gift sent upward can feel awkward.",
          "Pass a card around. A short note from each person often means as much as the gift itself.",
        ],
      },
    ],
    cta: "Shopping for one coworker in particular? Tell the quiz the occasion, what they're into, and your budget, and it will pick gifts from our catalog for you.",
  },

  {
    slug: "gifts-for-your-brother-or-sister",
    title: "Gifts for your brother or sister, from game night to their first apartment",
    description:
      "Gift ideas for every kind of sibling, from the game night champion to the one who just moved into their first place, plus a few ideas that cost nothing.",
    metaTitle: "Gifts for your brother or sister · GiftPicker",
    related: ["gifts-for-mom-and-dad-from-morning-to-night", "just-because-gifts-for-your-partner", "gifts-for-men-who-say-they-dont-need-anything"],
    published: "2026-08-19",
    updated: REVISED,
    intro: [
      "Shopping for a sibling is oddly hard. You know their taste better than almost anyone, and you also know they will tell you exactly what they think of whatever you pick.",
      "The ideas below are sorted by the kind of sibling they are. A few are meant to be shared, so you can use them together.",
    ],
    body: [
      { kind: "h2", text: "For the sibling who turns every holiday into game night" },
      {
        kind: "p",
        text: "This is the sibling who pulls out a game the minute dessert is over and still remembers who won last year.",
      },
      {
        kind: "p",
        text: "[Wavelength](gift:r852) is a team party game for 2 to 12 players in which one person gives a clue on a spectrum, like hot to cold, and teammates turn a dial to find the hidden target. Rounds are short, and teams tend to argue over every clue. [Hitster](gift:r877) is a music game for mixed ages: you scan a song card with your phone, hear the track, and place it on your timeline by release year, with more than 300 songs spanning a century. For a head-to-head rivalry, [KLASK](gift:r509) is a Danish wooden tabletop game that plays like a mix of air hockey and foosball, with magnetic strikers and ten-minute matches.",
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
        text: "Cotopaxi's [Allpa 35L Travel Pack](gift:r569) is a carry-on backpack that opens like a suitcase, with zippered mesh compartments and shoulder straps that tuck away. For long flights and train rides, the [Trtl travel pillow](gift:r970) wraps around the neck like a soft fleece scarf, with an internal support that holds the head upright, and it weighs less than a phone. To keep track of it all, a [scratch-off travel map](gift:r261) lets them reveal each country they have visited on a 23-by-33-inch world map poster.",
      },
      { kind: "gifts", ids: ["r569", "r970", "r261"] },

      { kind: "h2", text: "For the youngest in the family" },
      {
        kind: "p",
        text: "Shopping for a younger sibling is a chance to be the cool one. The [Camp Snap](gift:r454) is a pocket digital camera with no screen and six film-style filters, so every photo stays a surprise until it is uploaded. For a teen who wants a story to tell at school, an [iFLY gift card](gift:r1051) pays for indoor skydiving, where first-time flyers get training from a certified instructor and then fly twice with one-on-one coaching. And the [Nintendo Switch Lite](gift:r205) is a compact handheld console made for playing Switch games anywhere, which makes the next long family drive go a lot faster.",
      },
      { kind: "gifts", ids: ["r454", "r1051", "r205"] },

      { kind: "h2", text: "For the one who remembers everything you did as kids" },
      {
        kind: "p",
        text: "Some siblings can recall every family road trip in detail, including the parts you would rather forget. A gift built from your shared history plays right into that.",
      },
      {
        kind: "p",
        text: "The [RetroViewer with a custom photo reel](gift:r733) pairs a classic stereo viewer with a reel of seven of your own photos, made by a company founded by a former View-Master employee. Shutterfly's [custom photo playing cards](gift:r992) put a family picture on the back of every card, ready for the next card game at the holidays. For the full archive, Artifact Uprising's [hardcover photo book](gift:r637) is fabric-bound and holds up to 200 pictures, enough for every bad haircut and school portrait.",
      },
      { kind: "gifts", ids: ["r733", "r992", "r637"] },
      {
        kind: "p",
        text: "A free idea for this sibling: dig out an old family photo, recreate it together with the same poses and as close to the same outfits as you can manage, and frame the two pictures side by side.",
      },

      { kind: "h2", text: "For the sibling you don't see enough" },
      {
        kind: "p",
        text: "If you live in different cities or keep different schedules, a plan to see each other can be the gift. [Concert tickets](gift:r1072) to see their favorite artist put a date on the calendar, and Bandsintown makes it easy to find a show near them and buy from the official seller. A [Hipcamp gift card](gift:r680) pays for a campsite, cabin, or treehouse on private land near parks, lakes, and beaches, so you can plan a weekend away together. For an afternoon closer to home, a [Topgolf gift card](gift:r994) covers play, food, and drinks at Topgolf venues across the US; check that there is one near them first.",
      },
      { kind: "gifts", ids: ["r1072", "r680", "r994"] },
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
    metaTitle: "What to send someone who is sick or grieving · GiftPicker",
    related: ["how-much-to-spend-on-a-coworker-gift", "gifts-for-mom-and-dad-from-morning-to-night", "how-to-choose-a-gift-by-love-language"],
    published: "2026-07-22",
    updated: REVISED,
    intro: [
      "When someone you care about is ill, recovering from surgery, or grieving, most of us want to do something and also worry about getting it wrong. Look for something they can simply accept. It shouldn't need a thank-you note or any effort from them, and it should fit what they are actually going through.",
      "The ideas below work for a friend, a relative, or a colleague, and they are grouped by situation. Suggestions for the card are at the end.",
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
        text: "Someone resting at home after surgery or an illness usually needs food they don't have to cook and comfortable ways to pass the time, so start with meals.",
      },
      {
        kind: "p",
        text: "An [Instacart gift card](gift:r768) covers groceries, delivery fees, and tips, and it never expires, so they can use it whenever they need a restock. An [Uber and Uber Eats gift card](gift:r135) handles takeout on the nights when nobody feels like cooking, and a HelloFresh gift card brings meal kits with pre-measured ingredients for the days they feel up to cooking. For anything else they need, an Amazon gift card arrives by email the same day.",
      },
      { kind: "gifts", ids: ["r768", "r135"] },
      {
        kind: "p",
        text: "For treats and easy pantry meals, Stonewall Kitchen's [Best of the Best Gift Basket](gift:r1093) packs twenty of its favorites, from Wild Maine Blueberry Jam to pancake mix and pasta sauce, into a reusable wicker basket, enough for easy breakfasts and dinners while they recover. For someone who eats keto or gluten-free, Wonder Monday's [keto cheesecakes](gift:r158) come in four flavors with zero grains or gluten. Sugarfina's [Champagne Bears](gift:r650) are gummies made with Dom Pérignon champagne that contain no alcohol, and Teaspressa's [Champagne Bellini Mixer Kit](gift:r1095) holds 18 handmade fruit cubes to drop into prosecco, or into sparkling water for a mocktail, on the day they feel like celebrating.",
      },
      { kind: "gifts", ids: ["r1093", "r158", "r650", "r1095"] },

      { kind: "h2", text: "For the long days on the couch" },
      {
        kind: "p",
        text: "Recovery involves a lot of waiting, so look for gifts that make the waiting a little more comfortable.",
      },
      {
        kind: "p",
        text: "Thistle Farms' [essential oil roll-on set](gift:r801) has Calm, Balance, and Focus blends handcrafted by women survivors at the Nashville nonprofit, and the pocket-size rollers need no diffuser. The Qi's [Daily Ritual Flower Tea Set](gift:r612) comes with nine whole blooms and a glass cup for brewing caffeine-free tea. The [Bearaby Snuggler](gift:r771) is a weighted, bottle-shaped pillow with a clay-based fill that warms in the microwave in about a minute and holds heat for up to an hour, so it can rest on the stomach, back, or lap.",
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
        text: "A long illness changes the kind of help that is useful. Look for gifts that keep working over weeks, or that brighten the room where someone spends most of their time.",
      },
      {
        kind: "p",
        text: "Living plants bring some green to a room that hasn't seen much fresh air lately. The Sill's [Houseplant of the Month Club](gift:r1075) delivers a new plant in a ceramic planter every month, and its [Best Sellers Duo](gift:r598) sends a monstera and a snake plant at once. For someone who likes to grow their own, the self-watering [Click & Grow Smart Garden 3](gift:r613) grows herbs and greens on the counter under its own lights, and Truelove Seeds' [African Diaspora Collection](gift:r1097) pairs four heritage seed packets, including the Paul Robeson tomato, with illustrated postcards that tell each seed's story, which gives them something to plant next spring.",
      },
      { kind: "gifts", ids: ["r1075", "r598", "r613", "r1097"] },
      {
        kind: "p",
        text: "Framebridge's [custom framed photo](gift:r766) prints a favorite picture of yours, frames it behind a white mat, and ships it in a gift box with a personal note.",
      },
      { kind: "gifts", ids: ["r766"] },

      { kind: "h2", text: "If they've lost someone" },
      {
        kind: "p",
        text: "When someone is grieving, the main thing is to let them know you are thinking of them. Keep the gift modest, and lean toward food for the household or something that honors the person who died.",
      },
      {
        kind: "p",
        text: "Harry & David's [Sympathy Gift Box](gift:r767) holds pears, apples, cheddar, summer sausage, crackers, and baked goods, packed in a box that can be set out when visitors come by. [Healing After Loss](gift:r774) by Martha Whitmore Hickman offers a short reading for every day of the year, which suits the days when a whole book feels impossible. A [TisBest Charity Gift Card](gift:r769) lets the family give to a charity the person they lost cared about. And The Little Market's candles, now made by Prosperity Candle, include an [In Loving Memory personalized candle](gift:r1096) with the name and date you choose, hand-poured by a woman artisan who came to the US as a refugee.",
      },
      { kind: "gifts", ids: ["r767", "r774", "r769", "r1096"] },

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
        text: "Keep it short and sincere. Acknowledge what happened, offer support without asking them to do anything, and leave out advice or comparisons with your own experience. A few starting points:",
      },
      {
        kind: "list",
        items: [
          "For an illness or recovery: “Thinking of you and hoping each day gets a little easier. I'll check in next week, and there's no need to reply.”",
          "For a loss: “I'm so sorry for your loss. I'm thinking of you and your family.”",
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
    title: "Gifts for Mom and Dad, from morning coffee to weekend getaways",
    description:
      "A short list of gifts for Mom and Dad: a better morning coffee, dinners with a night off, weekend outings, and a video montage from the whole family.",
    metaTitle: "Thoughtful gifts for Mom and Dad · GiftPicker",
    related: ["gifts-for-men-who-say-they-dont-need-anything", "gifts-for-your-brother-or-sister", "how-to-choose-a-gift-by-love-language"],
    published: "2026-09-09",
    updated: REVISED,
    intro: [
      "Parents spend years looking after everyone else, then insist they don't need a thing when their own birthday comes around. Finding a gift that feels worthy of all that can be a lot of pressure.",
      "Picture a regular week in their house. Where do they start the morning, what is for dinner, and what do they do on a free Saturday? The gifts below follow that week from the first cup of coffee to a weekend away. There are only a handful, and most are the kind of thing the whole family can chip in on.",
    ],
    body: [
      { kind: "h2", text: "For their morning coffee" },
      {
        kind: "p",
        text: "In plenty of houses the day starts with coffee, so begin there. The [Ember Mug 3](gift:r293) holds coffee or tea at the exact temperature they choose, adjustable on the mug or in the app, so the first cup doesn't go cold while they read the news. For parents who love a café drink, Nespresso's [Vertuo Next with the Aeroccino3 milk frother](gift:r606) makes espresso, coffee, cappuccinos, and lattes at home, with the frother turning milk into foam at the press of a button.",
      },
      { kind: "gifts", ids: ["r293", "r606"] },

      { kind: "h2", text: "For dinner at home" },
      {
        kind: "p",
        text: "If they have cooked for the family for decades, give them a few nights off. Goldbelly's [monthly restaurant food box subscription](gift:r1091) sends famous dishes from restaurants and bakeries around the country, like pizza, barbecue, cakes, and pies, and each box serves at least four. For the nights they do cook, Le Creuset's [cast iron round oven](gift:r62) is an enameled Dutch oven for a Sunday roast or a big pot of soup, and the [AeroGarden Harvest](gift:r368) grows fresh herbs and greens on the counter all year with no soil, so the basil is always a snip away.",
      },
      { kind: "gifts", ids: ["r1091", "r62", "r368"] },

      { kind: "h2", text: "For the weekends" },
      {
        kind: "p",
        text: "For parents who like to get out on weekends, the [National Parks Annual Pass](gift:r201) covers entry to federal recreation lands for a full year and admits everyone in the car, so it works for a road trip with the grandkids too. Pair it with the official [Passport To Your National Parks](gift:r887), a spiral-bound book for collecting free cancellation stamps at more than 400 park sites, so every visit becomes a dated keepsake. For a quieter weekend closer to home, a [ResortPass gift card](gift:r1005) books a day at a hotel pool or spa near them, with a cabana or a treatment if they like.",
      },
      { kind: "gifts", ids: ["r201", "r887", "r1005"] },

      { kind: "h2", text: "A video montage from the whole family" },
      {
        kind: "p",
        text: "One of the gifts parents love most costs nothing but a little organizing: a short video of the people they love, each sharing a memory or a wish. It works for a milestone birthday, an anniversary, or a retirement.",
      },
      {
        kind: "list",
        items: [
          "Pick a deadline two or three weeks before the day, and ask family and friends to record a clip of 30 seconds or less on their phones, held sideways, somewhere quiet and well lit.",
          "Give everyone the same simple prompt, such as a favorite memory with them or something they taught you, so the clips fit together.",
          "Collect everything in one shared folder or album, for example a shared Google Drive folder, and add a few old photos and home videos while you are at it.",
          "Put it together in a free editor such as iMovie, keep the finished video under about five minutes, and end with the whole family saying happy birthday or congratulations together.",
          "Play it at the celebration with everyone in the room, then send them the file so they can watch it whenever they like.",
        ],
      },

      { kind: "h2", text: "Making it a family gift" },
      {
        kind: "p",
        text: "Several of these, like the Nespresso machine, the Le Creuset, or the Goldbelly subscription, are easy to split among siblings. Agree on one gift early, let one person handle the ordering, and ask everyone to add a line to the card, so your parents get to open one thoughtful present from all of you together.",
      },
      {
        kind: "p",
        text: "If you live nearby, add something free: show up one evening to cook dinner with them, and stay for dessert.",
      },
    ],
    cta: "Shopping for just one of them? Tell the quiz about Mom or Dad, their interests, and your budget, and it will rank gifts from our catalog.",
  },

  {
    slug: "just-because-gifts-for-your-partner",
    title: "Just-because gifts for your partner",
    description:
      "Surprise gifts for your partner for no reason at all: ideas for a night in, a night out, a big gesture, a little pampering, keepsakes, and small treats.",
    related: ["how-to-choose-a-gift-by-love-language", "gifts-for-your-brother-or-sister", "gifts-for-mom-and-dad-from-morning-to-night"],
    published: "2026-09-24",
    updated: REVISED,
    intro: [
      "Birthdays and anniversaries come with a deadline, so those gifts tend to get planned. A just-because gift can turn up on any weeknight, for no reason except that you were thinking of them, and that is often the one your partner remembers.",
      "Here are just-because gifts sorted by the kind of evening or mood they suit, plus a few ideas that cost nothing at all.",
    ],
    body: [
      { kind: "h2", text: "For a night in" },
      {
        kind: "p",
        text: "[We're Not Really Strangers: Couples Edition](gift:r406) is a card game for two with 150 questions across three levels, written to help couples learn something new about each other. [The Fox in the Forest Duet](gift:r404) is a cooperative card game for exactly two players, in which you move through a storybook forest as a team without talking strategy.",
      },
      {
        kind: "p",
        text: "For a date night that comes to you, Priority Wine Pass's [virtual wine tasting package](gift:r313) ships wines from a small winery along with a live tasting session, and Dandelion Chocolate's [virtual chocolate tasting class](gift:r1015) sends five single-origin bars and a code for a live hour-long class on how to taste them. If you would rather cook, Williams Sonoma's [DIY Sushi Kit](gift:r96) has the ingredients for seasoned sushi rice and a rolling mat, so dinner becomes something you make together.",
      },
      { kind: "gifts", ids: ["r406", "r404", "r313", "r1015", "r96"] },

      { kind: "h2", text: "For a night out" },
      {
        kind: "p",
        text: "Book the whole evening yourself and tell them only what time to be ready. A [Board & Brush gift card](gift:r1013) covers a workshop where an instructor guides you through staining and stenciling a wood sign or tray, and the studios are BYOB. A [Melting Pot gift card](gift:r1012) turns a weeknight into a long dinner of cheese fondue, a main course cooked at the table, and chocolate to finish. Or book a [Sur La Table cooking class](gift:r363), where a chef walks the two of you through a new menu in a real kitchen. All three have locations around the country, so check for one near you first.",
      },
      { kind: "gifts", ids: ["r1013", "r1012", "r363"] },

      { kind: "h2", text: "For a big gesture or a weekend away" },
      {
        kind: "p",
        text: "A [sunrise hot air balloon ride](gift:r365) ends with a champagne toast. If a trip is already on the calendar, a [Flytographer session](gift:r123) books a local photographer for a private shoot wherever you are traveling, so you finally come home with photos of the two of you together. And for a weekend you decide on at the last minute, a [CityPASS](gift:r1052) bundles tickets to three to five top museums, aquariums, and landmarks in one of more than a dozen US cities. Balloon flights and CityPASS both depend on location, so look up the launch sites and the city list before you book.",
      },
      { kind: "gifts", ids: ["r365", "r123", "r1052"] },

      { kind: "h2", text: "For a little pampering" },
      {
        kind: "p",
        text: "Treat the partner who never makes time for themselves. Olfactory NYC's [at-home custom scent experience](gift:r919) lets them sample scents at home, order blends of their favorites, and finish with a 50 ml bottle of their own fragrance with their name on the label. Mount Lai's [jade facial spa set](gift:r920) pairs a gua sha and a roller for a few calm minutes of facial massage, and the gua sha won a 2022 Allure Best of Beauty award. For a bath night, add Herbivore's [Coco Milk bath soak](gift:r894) to the water; the powdered coconut milk and vanilla leave skin soft. And after a long day at a screen, Hukka's [Orbits Eye Stones](gift:r893) are two rings of Finnish soapstone that hold the cold from the fridge and rest on tired eyes.",
      },
      { kind: "gifts", ids: ["r919", "r920", "r894", "r893"] },

      { kind: "h2", text: "For the sentimental one" },
      {
        kind: "p",
        text: "Each of these is made from your own names, photos, or old T-shirts. Patricia Carlin's [Intersection of Love print](gift:r731) is a black-and-white photo of two crossing street signs printed with your names and the years that matter to you. Liberty Puzzles turns a favorite photo of the two of you into a [custom wooden jigsaw](gift:r943) with whimsy pieces shaped like animals and objects, which doubles as a night-in project. And if they keep a drawer of old concert and team T-shirts they can't part with, a [Project Repat T-shirt quilt gift card](gift:r764) turns them into a fleece-backed quilt sewn in North Carolina.",
      },
      { kind: "gifts", ids: ["r731", "r943", "r764"] },

      { kind: "h2", text: "Small surprises for an ordinary day" },
      {
        kind: "p",
        text: "If you share the couch with a dog or cat, try Companion Candles' [Cuddle Me Cozy Candle](gift:r331), which is made to be pet-friendly and smells of fresh linen, clean cotton, and warm musk. Runamok's [Sugarmaker's Cut maple syrup](gift:r421) is organic Vermont syrup from the season's best runs, in a heavy glass bottle that makes Saturday pancakes feel like an occasion. For the tea drinker, Tea Forté's [KATI steeping cup](gift:r651) is a double-walled ceramic tumbler with an infuser, so a good cup of loose tea is only a few minutes away.",
      },
      { kind: "gifts", ids: ["r331", "r421", "r651"] },

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
        text: "When you give it, skip the big buildup. Leave it on the kitchen table or hand it over at the end of a regular day, with a line about why it made you think of them.",
      },
    ],
    cta: "Want ideas matched to your partner's interests? Tell the quiz a little about them and your budget, and it will rank gifts from our catalog.",
  },
];

/** Newest first. */
export const POSTS: Post[] = [...ALL_POSTS].sort((a, b) => b.published.localeCompare(a.published));
