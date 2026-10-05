# GiftPicker curation playbook

How the GiftPicker catalog is curated: what belongs in it, how rows are named and tagged, how the ranking uses those tags, and how requests and reviews are handled. Follow it when adding, editing, retiring, or reviewing gifts, whether you are a person or an AI agent.

Last updated 2026-10-03. Written from Dalia's own corrections and approvals (9/21 to 10/3/26), every Rejected, Retired, and Dead row in the Gifts sheet with its Feedback note, and the code at commit `062802e` (`src/data/gifts.ts`, `questions.ts`, `related.ts`, `similarity.ts`). Sourcing agents get the short version in [catalog-agent-brief.md](catalog-agent-brief.md).

Where a reason below is Dalia's, it is quoted or attributed to her. Where a gift was rejected in /review without a note, the pattern is inferred from what she kept and cut in the same batch, and it says so.

---

## 1. What a GiftPicker gift is

### The standard

Dalia's brief for new gifts (9/21/26): gifts that are "meaningful, unique, and wow" and high quality. She ruled out "a stocking stuffer," "a chachka," and "a cheap plastic toy that will break and get thrown out immediately." She asked that past suggestions be checked to "see they pass the sniff test."

A practical version of that test: a thoughtful person would be proud to hand it over, and the recipient would keep it. If the item is interchangeable with a store-brand version of itself, it fails.

### What she approves

- **Experiences and memberships.** Hipcamp Gift Card, National Parks Annual Pass, ClassBento Pottery Class Experience, ClassPass, MasterClass (now "Online Classes Gift Membership (1 Year)").
- **Subscriptions with clear contents.** Atlas "Coffee Gift Subscription," Murray's "Cheese of the Month Club," Storyworth One-Year Memoir Subscription.
- **Personalized and sentimental gifts.** The Custom LED Neon Sign (YELLOWPOP) was her own request: "those are really cool." Family Recipe Cutting Board, Long Distance Friendship Lamps (Set of 2).
- **Name-brand tech and kitchen gear with a reason to exist.** AirPods Pro 3, Kindle Paperwhite, Ember Mug 3, KitchenAid Artisan stand mixer, Ninja Blast portable blender.
- **Kids' learning toys.** Lovevery Play Gym, Magna-Tiles Classic 32-Piece Set, Yoto Mini.
- **Cheap items with a twist or a point of view.** Urban Map Whiskey Glass ($18), Pantone: Box of Color ($15), Carson MicroBrite pocket microscope ($14.99), Airbnb Gift Card from $10, SKLZ Reaction Ball ($11.99).
- **Hands-on crafts with a satisfying result.** Speedball lino cutter kit, Boku-Undo suminagashi marbling set. She kept these for the teen $15 request and cut the plain fitness gear and desk toys beside them, so the second pass looked for things a teen would enjoy making or doing.
- **Premium indulgences at high budgets.** Urbani white truffle and slicer bundle, Smythson Panama weekly journal, Leatherology padfolio, The Mahjong Line tiles, Arcade1Up Ms. Pac-Man machine.
- **Honest crossovers.** The Official Stardew Valley Cookbook and Heroes' Feast (D&D cookbook) answered a request for Gaming plus Cooking without forcing it.
- **Functional apparel and accessories.** lululemon Everywhere Belt Bag, UGG Fluff Yeah Slippers, OOFOS OOahh Recovery Slide, Wallaroo Victoria UPF Sun Hat.

### What she rejects, by pattern

Rows rejected in /review carry Status `Rejected`. Some were rejected by Claude in a 9/21 first pass that applied her pattern; she could restore them and did not. Those are marked "(first pass)."

1. **Plain basics interchangeable with any store-brand version.**
   - Hers: Agate Coaster (Anthropologie, $16), Monogrammed Mug (Crate & Barrel, $13), Fell Asleep Here Magnetic Bookmark ($20), Fluted Indoor/Outdoor Planter (West Elm, $18), Geo F. Trumper body wash, Glass Surface Desk (Crate & Barrel).
   - First pass: HAY Tube Candle Holder, Iittala Kastehelmi votive, Umbra Prisma frame, Zeroll ice cream scoop, Microplane zester, SteelSeries mousepad, Glocusent clip-on book light, Brainwavz headphone hanger.
2. **Apparel basics.** Rothy's The Point III ("too simple"), Brooklinen Super-Plush Robe ("not special, just white"), Grace Eleyae Chunky Knit Satin-Lined Beanie ("I don't think a beanie is a good gift idea"), Comrad compression socks, Alo Accolade Hoodie, Paka The Hoodie, Patagonia Better Sweater, Veja Campo, Nike Air Force 1, Axel Arigato Clean 90, HOKA Clifton 11, Petite Plume kids' flannel robe. Hair clips (Chunks, Emi Jay) were retired at her request: "hair clips are a lame gift. stocking stuffer."
3. **Plain stationery and single writing tools.** Field Notes Original Kraft Memo Books were proposed twice and rejected twice (r390 on 9/21, r645 on 10/3). Also Delfonics Rollbahn notebook, Kaweco Classic Sport fountain pen, LAMY 2000 rollerball, and (first pass) Uni Kuru Toga pencil, Pentel pocket brush pen, Lihit Lab pen case, Book Darts. Stationery she approved has a format or a system behind it: Smythson Panama journal, Leuchtturm1917 Learning Journal, Ugmonk Analog Starter Kit, Papier Daily Planner.
4. **Pantry staples that read as groceries.** Jade Leaf ceremonial matcha stick packs, Comvita UMF 15+ Mānuka honey, Sfoglini semolina pasta sampler (she asked for its removal), Sugar Plum Chocolate Pretzel Passion assortment. These were rejected without notes. Food she approved comes with a presentation, a tool, an occasion, or small-batch character: Sugarfina Champagne Bears bottle, Golde Superwhisk and turmeric kit, Compartés truffles, the Urbani truffle bundle, Runamok maple syrup, Diaspora Co. Spice Sampler. The line is not sharp, so flag borderline pantry gifts for her call.
5. **Plain fitness and recovery tools.** Fringe Sport peanut lacrosse ball, IronMind Expand-Your-Hand bands, compression socks, and (first pass) Rogue SR-3 speed rope. Fitness gifts she kept feel like a game or a real upgrade: SKLZ Reaction Ball, Crossrope weighted jump rope set, Theragun Prime Plus.
6. **Cheap science desk trinkets.** Exploratorium Gyroscope and Color-Mixing Cube. The Carson pocket microscope stays.
7. **Repeats of a slot already filled.** YETI Rambler tumbler: "the tumbler is the same as the other water bottles." A second Keurig single-serve maker. The Fellow Carter Move Mug was rejected without a note; the drinkware slot already holds Ember Mug 3, Owala FreeSip, and two Hydro Flask bottles.
8. **Dated or uncool tech.** Koss KSC75 ear-clip headphones: "this feels like an outdated uncool gift."
9. **Not right for the catalog.** The Maude vibrator: "it doesn't feel right."

Three 10/3 rejections came without a note and fit no single pattern above: MoMA Design Store Mini Sky Umbrella, Orbitkey Key Organizer Pro, and the LAMY pen. Given patterns 1 and 3, the likely reading is that a design touch was not enough to lift an everyday accessory into gift territory.

### What curators retired for quality

- Dropship or generic personalized goods: Kespire photo LED lamp, the YourPhotosocks "Custom Photo Moon Lamp" with a keyword-stuffed title, ForAllGifts crystal keepsake.
- Spam-style brands and commodity bundles: KETO4ALL! snack box, Sparia ultrasonic diffuser (a design sold under many house brands).
- Impersonal or vague: Costco Membership; The Sill "Live Plant," which never named a plant.
- Kitschy gags: Himalayan salt shot glasses; a $10 beaded keychain; a $9 Zippy Paws plush.
- Unreliable sellers and dead products: Page 1 Books (a multi-year pattern of customers not receiving books), Drinkworks Home Bar (shut down), Lululemon Mirror (discontinued), a "Belize Adventure Tour" from a company that only runs wine tours.

### Hit rate by budget (10/3 batches sourced by agents)

| Batch | Kept |
|---|---|
| Teen sibling, $15 (first pass) | 3 of 8 |
| New Job occasion adds, $22 to $45 | 3 of 6 |
| Request #20, treat myself, $120 | 4 of 6 |
| Request #21, friend, $80 | 4 of 6 |
| Request #25, coworker, $120 | 4 of 6 |
| Request #24, treat myself, $500 | 6 of 6 |

Low budgets pull sourcing toward commodity items. Under about $50, every pick needs a twist, a hands-on result, or a known name, and at $20 or under the stricter rule below applies. Return fewer gifts rather than padding a batch with weak ones.

### Prefer the original over a copycat (binding, Dalia 10/3/26)

Before proposing a product, search whether it copies an original brand that created the category or the design. Prefer the original. A copycat is acceptable only if it is genuinely better (quality, reviews, or value), is separately very popular in its own right, or is meaningfully easier for US shoppers to get (Neso over Otentik). Say which applies in the Feedback note.

Dalia's example: she believes Otentik is the original of the sandbag-anchored stretch beach shade that Neso sells. Otentik did come first (2011, versus Neso's 2014 Kickstarter), but it ships from Israel ($29 shipping, 5 to 12 business days, possible import duties) and is unavailable on Amazon US, so Dalia kept Neso: "availability matters too."

### Dalia's rulings of 10/3/26 (binding)

- **Everyday items need something special.** A plain or everyday item qualifies only with one of: a well-known, respected brand; personalization; working exceptionally well (the best of its kind); or a distinctive design. Otherwise skip it.
- **Basic clothing is out.** No plain apparel basics (tees, hoodies, socks, beanies, plain robes, simple sneakers or flats).
- **No groceries** unless the item is a specialty or novelty product (small-batch, a curated sampler, a notable maker, a giftable presentation).
- **No pure utility tools.** If someone wants it, they buy it for the utility; it is not a hobby and reads as a strange gift. Dalia rejected the iFixit Minnow and Mako driver kits for this reason.
- **More than one gift per slot is fine when they are clearly distinct** in design or use case. Two near-identical items (same type, similar look, same use) are a duplicate even across brands.
- **No collectibles.** Skip gifts whose appeal depends on the recipient already collecting that line (designer figurines like Kay Bojesen, collectible series, limited editions sold to collectors). Shoppers can't know who collects what, and decorative figures read as kids' toys. Dalia rejected the Kay Bojesen monkey and retired the songbird for this (10/3/26).
- **Availability counts.** A gift that is hard for US shoppers to get (ships from abroad, long waits, import duties, Amazon listings unavailable) loses to a readily available equivalent. Dalia kept the Neso beach shade over Otentik, the original, because Neso ships in the US and is on Amazon.

### Dalia's rulings of 10/4/26 (binding)

- **On the site means Live AND approved.** A gift shows only when Status is `Live` and Review status is TRUE. New rows go in as Live with FALSE and stay hidden until Dalia approves them in /review.
- **Don't drop an interesting gift on soft grounds.** A weak or packaging photo means find a better photo; thin ratings mean find a better-rated version of the same idea. She asked for the paella kit, the Opinel mushroom knife, and the cheesemaking kit back after they were dropped for exactly that (the better-rated La Tienda mini kit, the Opinel with sheath, and Standing Stone Farms replaced them).
- **"Utility tools" means basic tools,** like screwdriver kits. A hobby tool with a story (a foraging knife) is fine.
- **Self only** (Relation is exactly `Self`, so the gift never shows for anyone else): things people buy for themselves, including tactical sports gear. Her picks: Leatherman Wave Plus, Bala Bangles, lululemon Everywhere Belt Bag, Synapse 140 sport kite, MSR Evo snowshoes, Opinel mushroom knife, Patagonia Black Hole Duffel 40L (10/5), The Home Edit organizing book (10/5; from someone else it reads as a hint about the recipient's house). A "treat myself" gift that also suits others is different: it keeps its other recipients. Dalia added Self to all three Cotopaxi bags (Allpa 35L, Batac 24L, Todo 3L) on 10/5 this way. Practical gear people often buy for themselves gets `Self` added to its other recipients (Dalia 10/5, after the FoodCycler, SodaStream, and bee house were missed): kitchen appliances and knives, gaming and desk gear, fitness and outdoor gear, everyday apparel, grooming tools, pet gear. Gifts that only make sense from someone else (personalized keepsakes, gift boxes of food, experiences, gift cards, party games) do not. 63 gifts from the 9/21 to 10/5 batches gained Self on 10/5. So is a complete starter outfit that introduces a hobby: Dalia reversed Self only on the Orvis Clearwater fly rod outfit (10/5): "it's interesting, it's like gifting a hobby." Gear for someone already in the sport (the kite, snowshoes, a chalk bag) stays Self only.
- **No flowers.** Venus et Fleur preserved roses were rejected on 10/4. The LEGO flower kits stay in the catalog, but flowers, real or LEGO, never appear in marketing images.
- **Kids:** see Age in section 4. Recipient Child means 17 or younger, and `Child` age goes only on gifts a 3 to 12 year old would want.
- **Some gifts read as for seniors only:** the Kitchen Linens Bundle and the Classic Personalized Apron are tagged Senior only.
- **Tags must survive a shopper's eye:** celebrity cookbooks are Cooking, not Music (they outranked real music gifts); a wind chime is Home & Decor, not Music; astronomy binoculars are Nature & Outdoors, not Learning; the Tivoli radio is Home & Decor first, Music second.

### Ratings and seller reputation (binding, Dalia 10/3/26)

Nothing poorly rated, and no seller with a bad reputation:
- **Product rating:** at least 4.3 stars from at least 50 ratings on the brand site, Amazon, or a major retailer. If the product has fewer ratings, it needs at least 4.5 stars or must come from an established, well-reviewed brand. Experiences and gift cards skip this check, but the seller check still applies.
- **Seller reputation:** no pattern of complaints about orders never arriving, damaged or dead deliveries, counterfeits, no-shows, or refused refunds (Page 1 Books, Insect Lore, Cozymeal, and Hand & Stone were removed for this). A BBB "F" alone is not disqualifying, because many direct-to-consumer brands get one for unanswered complaints; it fails a gift only when the complaints show one of those patterns or a safety problem. Trustpilot counts only for small or direct-to-consumer sellers with meaningful volume (3.5 or higher); ignore it for big brands and major retailers (Target, Barnes & Noble, KitchenAid), whose Trustpilot pages skew negative.
- **Write it down:** record what you found in the Feedback note, for example `Rating: 4.7 from 2,300 (Amazon); seller: Trustpilot 4.4, BBB A+`. If you can't find ratings at all, say so, and the gift must have another strong reason to be trusted (a respected maker, or a major retailer as the seller).

### Gifts at $20 or under (binding, Dalia 10/3/26)

At this price the recipient could easily have bought it themselves, so the bar is higher. The gift must be something they would not have thought to buy:

- **A kit that starts a hobby.** Her example: the DMC Learning Embroidery Kit ($13), "cute and a nice hobby to gift." Also the Speedball lino cutter kit and the Boku-Undo marbling set.
- **A specialty or artisan version of an everyday thing.** Runamok Sugarmaker's Cut maple syrup, L.A. Burdick chocolate mice.
- **A clever design object.** Urban Map Whiskey Glass, Pantone: Box of Color, Hanayama Huzzle Cast puzzle.
- **A curated sampler.** Diaspora Co. Spice Sampler, Onyx Coffee Lab Blend Discovery Box, Queen Majesty Hot Sauce Trinity.

Commodity items fail. Her example: the Discraft UltraStar disc, "if someone wants a frisbee they'd have already bought one." She rejected it on 10/3, along with the Pilot Parallel calligraphy pen. Earlier rejections fit the same rule: the Field Notes memo books ($12.95), the Exploratorium gyroscope ($10.99), the peanut lacrosse ball ($14), the Agate Coaster ($16), and the Monogrammed Mug ($13).

### Cheap gifts still have a place

Retiring a gift only because it is cheap is Dalia's call to make, because it thins results for $25 budgets. On 9/21 a reviewer flagged eight cheap gifts for retirement. She kept the Urban Map Whiskey Glass, Pantone: Box of Color, Live Aloe Vera Plant, and the Crate & Kids Baby Book, and rejected the coaster, bookmark, planter, and mug. What separates the two groups is a twist or a point of view.

### Appropriateness

- Dalia overruled a reviewer who wanted Coworker and Mentor/Teacher removed from a cannabis cookbook: "cookbook is fine for coworkers and mentors." Reviewer "appropriateness" suggestions are not automatically right.
- Legal-age rules are objective and fine to apply (see section 4).

---

## 2. Catalog balance rules

### Overlap cuts made on 10/3/26

Dalia asked to "deprioritize 1-2 of the no-name or less top tier brands" in crowded categories.

- **Headphones.** Retired the AKG N9 as a fourth premium noise-cancelling over-ear next to AirPods Max 2, Bose QuietComfort Ultra, and Sony WH-1000XM6. The rest each fill a different use: AirPods Pro 3 and Sennheiser Momentum True Wireless 5 (earbuds), Shokz OpenRun (sport), Audeze Maxwell 2 and HyperX Cloud III (gaming), Audio-Technica ATH-M40x (studio), Puro JuniorJams (kids). Koss KSC75 was rejected separately as dated.
- **Speakers.** "JBL speakers are actually great, so dont retire those as a blanket rule but rather the no name or lower quality medium sized ones, keep the jbl clip and kids versions." Then: "the partybox is unique - it has a microphone," and "keep soundbar bose and instead focus on jbl's advantage which is the smaller speakers." Result: JBL Bar 5.1 retired; Bose Smart Soundbar holds the soundbar slot; JBL keeps Clip 5, Charge 6, JR Pop (kids), and PartyBox On-The-Go. Sonos Roam 2, Sonos Era 100, and Bose SoundLink Flex stay.
- **Blankets and throws.** Retired the Pottery Barn Faux-Fur Pillow and Throw Set (Anthropologie's faux-fur throw stays) and the Paw Waterproof Throw (lesser-known brand). Both weighted blankets stay (Gravity and Bearaby), because both are top-tier brands.
- **Cameras.** "for polaroid and fujifilm we have both a camera and a set each. one can have a camera and one can have a set, whichever is most unique for that category." Fujifilm keeps the Instax Mini 13 camera; Polaroid keeps the Now Generation 3 Starter Set. The older Instax Mini 12 bundle was retired. Other cameras are different kinds and stay: Kodak Ektar H35N half-frame film camera, Camp Snap screen-free camera, LEGO retro camera, Fujifilm smartphone photo printer.

### Standing rules

- **Cut the lower tier first.** In a crowded category, retire the no-name or lower-tier entry first. Claude's first speaker pass retired two JBL speakers as a blanket rule, and Dalia reversed it.
- **Same brand and same product type is a duplicate.** Examples: a second Keurig, Coterie's second diaper subscription, a third Le Creuset Dutch oven (r631), Hatch's Rest and Rest+ (consolidated into one device). Same brand in a different size or use is fine (the four JBL speakers).
- **When two rows are the same product,** keep the newer verified row or the one with the specific product name (Ooni Koda 2, Switch 2, Kindle Paperwhite 16 GB).
- **Check close matches before adding.** /review shows a close-match count and the top five matches for every gift (section 6).
- **Every dead or sold-out gift gets a replacement** (Dalia 10/3): "whenever a gift is no longer available or sold out, we should find a similar or better quality alternative so that category isn't empty." Examples from 10/3:
  - Craighill Venn Puzzle sold out: set to `OOS`, replaced by the Naef Sphaera Cherry Wood Labyrinth Puzzle.
  - Olli Ella Kids Picnic Basket no longer sold: set to `Dead`, replaced by the Wonder & Wise Picnic Playset.
  - Hydro Flask 35 L Insulated Tote discontinued everywhere: set to `Dead`, replaced by the Hydro Flask Carryout Soft Cooler Tote 20 L.
  - Note both rows: the old one "OOS 10/3/26: ... | Replacement added 10/3/26: <new gift>," the new one "Added 10/3/26 to replace <old gift> (<reason>)."
- **Upgrade to the current model** when a newer one ships (her example: "if jbl4 released a jbl5"). Note it as "Model updated <date>: <old> to <new>." A clean upgrade with a verified page, price, and photo keeps Review status TRUE. Examples: Charge 5 to Charge 6, Instax Mini 12 to Mini 13, AirPods Pro to AirPods Pro 3, Switch to Switch 2.
- **Never retire an approved gift over a weak photo.** Flag the photo instead (section 5).

### Filling coverage gaps (10/5/26)

Dalia asked to map the most common quiz paths and fill the ones without enough good results. How it was done, so the next round can repeat it:

- **Measure, then source.** Run every single-interest quiz path (151,938 on 10/5) through `rankGifts` on the live, approved catalog. A path is short when it returns fewer than 8 gifts, and weak when fewer than 4 of its results score 80% or more (half the first page). Rank pairs of answers (recipient and interest, budget and interest, and so on) by how often they are weak, weighted toward the common choices (Birthday, Holiday, partners, parents, friends, the default budget), and source for the biggest ones.
- **Give each agent its own lane** (an interest and a price band), because parallel agents cannot see each other's picks. Even so, two agents both found Wingspan, two found the Audible membership, and three Scrabble editions came back. Before writing, check every batch against the sheet including the rows just written; keep one gift per slot, merge the tags of a duplicate into the row already there, and keep the better-rated edition when two editions are near duplicates.
- **A lane decides what to look for, not how to tag it.** The 10/5 grandparent lane tagged its finds Adult, Senior and Grandparent, Parent only, so Ticket to Ride, Qwirkle, Rummikub, a crochet kit, and a kalimba never showed for partners, friends, or younger adults. Tag every age, relation, and occasion the gift honestly fits, whatever the lane. Dalia's 10/5 review of that round found interests a little too generous and relations too narrow: 15 gifts lost a stretch interest (the Portapuzzle's Organization, the Moccamaster's Sustainability, the Canyon Ranch card's Fitness) and 18 gained recipients or ages.
- **Write batches one at a time** and diff the whole sheet after each.
- **Retags count too.** Seven gifts were tagged Grandparent without Senior, so they never showed for grandparents (Grandparent always means Senior, section 6); adding Senior fixed them. Senior-tagged gifts that suit grandparents got Grandparent.
- **Agents come back short rather than pad.** Round 2 asked for about 145 and got about 100; that is the right trade.
- **Re-run the map after Dalia approves** a round in /review; pending gifts do not count on the site.

---

## 3. Naming and data rules

### Sheet columns (since 10/3/26)

A ID, B Gift, C Brand, D Age, E Relation, F Type, G Primary interest, H Interests, I Occasion, J Gender, K Price, L PriceMax, M BillingPeriod, N Description, O PhotoAddress, P Link, Q AmazonAltLink, R Status, S Date updated, T Review status, U Feedback (ID added 10/3/26).

Dalia had Primary interest moved next to Interests and Gender moved after Occasion. The site, the edge cache, /review, and the Apps Script all read columns by header name, so column moves are safe for them. Scratch scripts and Name Box edits use letters and must be updated after any move.

### Gift names

- Product name only, without the brand (the brand has its own column). Exception: gift cards (below).
- Name the specific product or model. "The Point III" replaced a generic "Washable Shoes"; "Ooni Koda 2" won over a row named "Pizza Oven."
- If the price buys a set, say so in the name. The friendship lamps became "Long Distance Friendship Lamps (Set of 2)" because $170 is the pair.
- **Subscriptions say what is inside** (Dalia 10/3: "for gift subscriptions, you need more descriptive names. eg coffee gift subscription"). Renames made 10/3:

| Old name | New name |
|---|---|
| Gift Subscription (Atlas Coffee Club) | Coffee Gift Subscription |
| Explorer's Club (Murray's) | Cheese of the Month Club |
| Giftable Subscription (Coterie) | Diaper and Wipes Gift Subscription |
| Premium Gift Subscription (1 Year) (Calm) | Meditation and Sleep App Gift Subscription (1 Year) |
| Gift Membership (Book of the Month) | Book Club Gift Membership |
| JuneShine Subscription | Hard Kombucha Subscription |
| Meal Subscription (Farm Fresh To You) | Organic Produce Box Subscription |
| Fat Gold Olive Oil Annual Subscription | Olive Oil Subscription (1 Year) |
| MasterClass Gift Membership | Online Classes Gift Membership (1 Year) |
| One Membership (12 Months, Includes WHOOP 5.0) | Fitness Tracker Membership (12 Months, WHOOP 5.0 Included) |
| BarkBox One Month Gift Box | Dog Toy and Treat Gift Box (1 Month) |

- **Gift cards are "<Brand> Gift Card" with the real purchasable range.** Dalia (10/3) noticed Uber and Lululemon cards still said only "Gift Card" and asked for "the descriptor word before it." Current examples: Airbnb Gift Card ($10 to $500), Disney+ Digital Gift Card ($25 to $500), Hipcamp Gift Card ($25 to $500), Lululemon Gift Card ($50 to $200), Uber and Uber Eats Gift Card ($50 to $200). Hipcamp was first entered at Hipcamp's $75 default amount; Dalia asked "why didnt you do a range?" Hipcamp lets the buyer type any amount up to $2,000.

### Brand

The maker's name: "Geo F. Trumper" for a body wash that Maggard Razors sells. A retailer's name goes here only if it is also the maker. Keep official spelling and capitalization (lululemon, Compartés).

### Price, PriceMax, and BillingPeriod

- **Price**: a number, the lowest real price for the item as sold.
- **PriceMax**: a number only when the product genuinely has a range (sizes, set counts, gift card amounts); `open` when there is no upper limit (shows as "$X+"); otherwise empty.
- **BillingPeriod**: `one-time`, `monthly`, or `weekly`. The code treats anything else as one-time. Four live rows say `recurring` (r314, r338, r345, r362) and display as one-time prices; see section 9.
- A subscription is compared to the budget at its displayed rate: $49/mo counts as $49.
- Verify prices on the brand's own site. Amazon pages fetched from this machine may show prices in ILS.

### Links

- **Link**: the product page, ideally on the brand's own site. It must load, show the product in stock, and match the price.
- **AmazonAltLink**: only `https://www.amazon.com/dp/ASIN`, only for the identical product (same model, size, and count). Never amzn.to. The Associates tag is added at click time in `src/data/affiliate.ts`, so the sheet stores clean links.
- **Link and AmazonAltLink never hold the same URL or ASIN** (Dalia 10/3). If Amazon is the only seller, it goes in Link and AmazonAltLink stays empty. Seven rows broke this on 10/3 and were cleared: r63, r181, r246, r261, r378, r422, r693.

### Descriptions

20 to 40 words, plain and concrete: what it is and why it makes a good gift. No em-dashes, few en-dashes, Oxford comma, no hype words ("perfect," "amazing," "ultimate," "must-have," "elevate"), no "X, not Y" constructions, and no verbless fragment as a closing flourish ("Instructions included.").

### Status and Review status

| Status | Meaning |
|---|---|
| `Live` | On the site once Review status is TRUE (Dalia, 10/4: a gift shows only when it is both Live and approved). New rows go in as Live with Review status FALSE, so they stay hidden until she approves them in /review. |
| `Rejected` | Dalia's taste call (or a first-pass reject she let stand). Treat as permanent. |
| `Retired` | Removed by a curator: overlap, duplicate, quality, or the brand closed. |
| `Dead` | Link broken or product discontinued everywhere. |
| `OOS` | Sold out but expected back. Set to Live when it restocks. |
| `Draft` | Incomplete; never shown. |

Review status is TRUE once Dalia has approved (or rejected) the row. Clean model upgrades keep TRUE. Anything new, repaired, or uncertain is FALSE so it lands in her queue.

### Feedback notes

Start each note with a verb and a date, and append with " | " instead of overwriting. /review sorts notes by their first word:

- **Shown as "Already done"**: Added, Repaired prior suggestion, Retired, Auto-repaired, Model updated, Fixed, Kept.
- **Shown as "Suggested fix, not done yet"**: Needs fix.
- **Shown as "Your call: Approve keeps it, Reject removes it"**: Flagged, Check, User-submitted.

Examples: "Added 10/3/26 for user request #25"; "Fixed 10/3/26: renamed from "Gift Membership" so the name says what is inside."; "Retired 10/3/26: Dalia kept Bose's soundbar over this one; JBL's strength is its smaller speakers."

### Row ids and gift URLs

Every gift has a permanent ID in column A (Dalia approved 10/3/26), such as `r495`. Existing gifts kept the number they already had (their old row number), so no URL changed. Gift pages (`/gift/r495`), shared links, and /review all use the ID, so rows can now be sorted or moved, and non-live gifts could move to another tab. New rows get the next free ID automatically within 10 minutes (the catalog read fills blanks). Never type or copy an ID into a new row; if a copied ID appears twice, the later row is renumbered.

### Writing to the sheet: the Google Sheets connector first (10/5/26)

When the session has the Google Sheets connector, write through it instead of the browser. Writes started working on 10/5/26 once Dalia added the sheet to the connector's Google account; before that, reads worked and every `update_values` returned "Permission denied for document".

1. `get_values` the exact target range right before writing, and confirm it holds what you expect: the right gift name in column B and the old value for edits, blank cells for new rows.
2. `update_values` to that exact A1 range (for example `Gifts!E498` or `Gifts!A802:U830`).
3. Re-read the whole sheet from the public feed and diff it: only the intended cells may change.

There is no clipboard and no Name Box, so nothing Dalia copies can land in a cell. The connector parses input like the Sheets UI: send numbers as numbers and booleans as booleans, keep anything that looks like a number or date but must stay text behind a leading apostrophe, and never send a value that starts with `=`, `+`, `-`, or `@` unless it is meant to be a formula. If the connector is missing or denied, fall back to the browser method below.

### Writing to the sheet (for agents with browser access)

Sheet edits go straight into Dalia's sheet tab in Chrome; there is no edit queue (one was tried on 10/3 and removed the same day as more machinery than an every-few-weeks task needs). Every slip on 10/3 came from bending these rules:

- Use one sheet tab only, and never let a background agent use it. A second sheet tab replayed queued keystrokes later: "Gifts!N722" landed in A710, and a stray click opened Google Admin.
- The tab does not need to be visible, in front, or focused (confirmed 10/4 with the tab hidden: Name Box jumps and full-column pastes landed correctly). The 10/3 slips came from a second sheet tab and from focusing the Name Box with JavaScript, not from the tab being hidden. Avoid long setTimeout loops in a hidden tab; they are throttled and the tool times out. A hidden tab saves slowly: on 10/4 five column pastes sat at "Saving…" for about four minutes before the server had them, so poll the public feed until it matches before reporting (or before the next batch).
- The clipboard check lives in Bash, right before each paste: `LC_CTYPE=UTF-8 pbpaste | shasum -a 256` must match the file you copied (plain pbpaste mangles non-ASCII). `navigator.clipboard.readText()` returns nothing when Chrome is not the focused app.
- Click the Name Box with a real click (never focus it from JavaScript) and confirm `document.activeElement.id` is `t-name-box`; type the tab-qualified cell (`Gifts!D2`), Return, then confirm the Name Box shows that cell and the target cells hold the values you expect to replace before Cmd+V. A JS-focused Name Box sent a paste into U714.
- Never read the whole sheet repeatedly from inside the tab; it froze the tab once. Small gviz reads (one or two columns anchored on column A, for example `range=A2:U740&tq=select A, D`) are fine for the before-check, but gviz lags the server by minutes after an edit, so check the result through the public feed (`/exec?tab=Gifts`).
- Double-check every run (Dalia 10/4): after each batch, re-read the whole sheet from the public feed and diff it against what you intended, every column of every row. Zero unexpected differences, or fix it before moving on.
- Bulk changes go in as one guarded paste per column or row block, not cell-by-cell typing.
- The clipboard check runs on its own, BEFORE the paste, and must match exactly; never run it in parallel with the paste. If any time passes, check again. On 10/4 a check ran alongside the paste while Dalia had copied a gift name, which went into a cell editor at B760 and was undone with Cmd+Z.
- Order matters (10/4, after a link Dalia copied landed in I2 and was undone): jump to the cell and run every check FIRST, then copy and hash-check the clipboard, then paste in the very next step with nothing in between, then confirm the Name Box shows the whole range (for example I2:I801). A single cell in the Name Box after a column paste means the wrong clipboard was pasted: Cmd+Z at once.
- After the Name Box jump, press Escape and confirm the formula bar is empty (not in cell-edit mode) before Cmd+V; otherwise the paste lands as text inside one cell. A good paste leaves the Name Box showing the whole range (for example B780:U800).
- A screenshot of a hidden tab forces a frame and flushes a stuck "Saving…" (10/4: 19 rows sat unsaved for 20 minutes until two screenshots).
- Click coordinates follow the frame of the most recent screenshot, which changes with the window. Read the Name Box rectangle with JavaScript, take a screenshot, and scale: frame = CSS × frame width ÷ innerWidth.
- After a session restart the old tab handle is gone: open one new sheet tab and keep using only that one.

- Type a tab-qualified range in the Name Box (`Gifts!F2`) and confirm the URL ends in `#gid=0`. On 9/21 a paste meant for Gifts overwrote a Requests column.
- Load long pastes from a file with `LC_CTYPE=UTF-8 pbcopy < file`. Plain `pbcopy` corrupted "®" into "¬Æ" across 68 rows.
- Press Escape after the Name Box and before Cmd+V, or the paste can land as one multi-line cell.
- Dalia shares the Chrome clipboard. Check the clipboard contents (a hash works) before every paste; on 10/3 her copied Apps Script landed in A2:A290 and had to be undone.
- Never hand-copy a long column into a tool call. A transcribed 639-line column once lost 17 lines.
- Sheets silently drops pastes while it shows "Saving...". Write in small groups and verify through the API afterward.

---

## 4. Tagging rules

### The binding test

Add an interest tag only if a shopper who picked that interest would be glad, and not disappointed, to see this gift near the top of their results (Dalia 10/3). Her examples:

- The satin-lined beanie was tagged Self-Care & Beauty: "I feel like I would be pretty disappointed if it came up high ranking for self."
- The UPF sun hat is "more aligned to apparel and less so for outdoors."

Never add a tag to raise a score. Agents briefed on the scoring formula on 10/3 over-tagged to score well; the beanie's Self-Care & Beauty tag came from that batch. Older rows had the same problem: the Urban Map Whiskey Glass carried five interest tags (Cooking, Creativity, Decor, Food & Drinks, Rest & Relaxation), and an $18 glass became the top pick for $120 friend searches. It is now Food & Drinks, Home & Decor, Personalization.

### Limits and order

- At most three interest tags, plus Best Sellers when it applies.
- The Interests cell lists the primary first, then secondary tags, then Best Sellers last.
- Gaming means video games: consoles, video games, controllers and gaming gear, and video-game merchandise. Board, card, party, and tile games, puzzles, chess, and D&D are `Toys & Games`, never Gaming (Dalia 10/5: "Wavelength is a game, it's not gaming"). On 10/5 Gaming came off 33 tabletop games, and the 9 that had it as primary now lead with Toys & Games.
- Use only the 22 quiz labels plus Best Sellers. Labels the quiz does not offer (24 gifts had ones like Fragrance, Subscriptions & Memberships, Kids & Parenting) never matched anything and were removed on 10/3.
- An obviously seasonal gift (Christmas, Hanukkah, Advent, or other holiday-themed: advent calendars, ornaments, a menorah, panettone, lebkuchen, a gingerbread house pan) is tagged `Seasonal Gifts` only, as both primary and the whole Interests cell, with no Best Sellers (Dalia 10/5/26). A Christmas-themed game or food is Seasonal Gifts, not Toys & Games or Food & Drinks, so it never surfaces for those shoppers off-season. On 10/5 this trimmed 11 live gifts: the LEGO, Tea Forté, La Maison du Chocolat, and Bonne Maman advent calendars, the Michael Aram menorah, the Simon Pearce ornament, the Moravian star, the Christian Ulbricht pyramid, the Nordic Ware gingerbread pan, the Olivieri panettone, and the Leckerlee lebkuchen tin. A gift that only suits winter or the holidays loosely (the MarieBelle hot chocolate) keeps its normal tags.

### Primary interest (column G)

The one label that says what the gift is: the interest a shopper would pick if this gift is exactly what they hoped to find. Never Best Sellers, which is a popularity flag. When torn, pick the label that describes the object itself. A primary match earns full credit in the ranking; a secondary match earns half (section 6).

Examples:
- Chunky Knit Satin-Lined Beanie: Apparel & Accessories.
- Victoria UPF Sun Hat: Apparel & Accessories, with no other tags.
- Disney+ Digital Gift Card: Rest & Relaxation. It had been tagged Tech & Electronics and Learning.
- The Official Stardew Valley Cookbook: Gaming, with Cooking and Food & Drinks as secondary tags.
- It Takes Two (Nintendo Switch): Gaming, with Toys & Games.
- Long Distance Friendship Lamps: Home & Decor.

### The 10/3 tag-trim pass

Agents assigned a primary to all 534 live gifts and proposed trimming tags that fail the test. Dalia approved the trims as a list grouped by removed tag. 203 Interests cells changed, counting the reorder that puts each primary first. Within that, 112 gifts lost at least one weak tag, 24 gained a missing primary, and 24 lost non-quiz labels. The most-removed tags were Home & Decor (16 gifts), Rest & Relaxation (15), Creativity (14), Learning (12), Organization (9), and Travel (8). Typical trims: Le Creuset Dutch Oven lost Home & Decor; the Yoto Mini lost Rest & Relaxation and Travel; the Hydro Flask 40 oz bottle lost Food & Drinks; the Meta Quest 3S lost Learning; the Echo Dot lost Organization; Shokz OpenRun lost Nature & Outdoors.

Dalia's five exceptions, in her words, with the tags that resulted:

| Gift | Her note | Tags now |
|---|---|---|
| AeroGarden Harvest Indoor Garden | "does fit for home" | Cooking, Nature & Outdoors, Home & Decor |
| Hanging Basket Humming Bird Feeder | "could also be home" | Nature & Outdoors, Home & Decor |
| Mako Driver Kit (iFixit) | "is not sustainability" | Tech & Electronics |
| It Takes Two (Nintendo Switch) | "can be toys and games" | Gaming, Toys & Games |
| Glass Modern Bar 7-Piece Cocktail Mixologist Set | "can be cooking" | Food & Drinks, Cooking |

Read together, the exceptions say: an object people keep out on display at home earns Home & Decor (the countertop garden, the feeder); a repair tool earns no Sustainability tag for being a repair tool; a co-op game a family plays together can count as Toys & Games; mixing drinks counts as kitchen craft.

### Best Sellers

Reserved for proven, widely loved hits: AirPods, Kindle Paperwhite, Owala FreeSip, Slip silk pillowcase, lululemon Everywhere Belt Bag, Magna-Tiles, Jellycat. Never for pricey furniture, niche gamer gear, or generic baby items. On 9/21 it was removed from 13 rows, including the Pottery Barn Kids All-in-1 Play Kitchen, Smeg Mini Fridge, Peloton Cross Training Bike, Logitech G PRO X Superlight 2 mouse, and Crate & Kids Playhouse. On 10/3 it came off the Jade Leaf matcha before that row was pasted. A Best Sellers tag on the gift counts in full when the shopper picks Best Sellers, so it is a strong boost; apply it sparingly.

### Age

- **Alcohol and cannabis exclude Young Adult and younger.** Young Adult is 18 to 25, which includes people under 21. Hard Kombucha Subscription is Adult only; the virtual wine tasting is Adult and Senior. Barware without alcohol (cocktail glasses, a decanter) may include Young Adult.
- **Trendy beauty is teen-only** (Dalia 9/21): "beauty products like that are okay to gift to teens but not to adults." Summer Fridays Neapolitan Lip Trio, Dior Addict Lip Glow Oil, and both Sol de Janeiro sets are tagged Teenager only.
- Tag every age the gift honestly suits. When a shopper picks an age the gift is not tagged for, the gift is hidden entirely (section 6), so a missing age costs more than a missing interest.
- **Grandparent means Senior.** The quiz skips the age question for grandparents and treats them as Senior, so a gift tagged Grandparent without Senior never shows for them. On 10/5 the fondue pot, charcuterie board, stemware, Roku, Serenity spa box, wine-box truffles, and The Crew card game all had this gap.
- **The Child recipient reads Relation `Friend, Sibling`.** A `Child` value in Relation matches nothing; kids' gifts carry `Friend, Sibling`.
- **Kids (Dalia 10/4).** `Child` (3 to 12) goes only on gifts a kid that age would want; kids' gifts carry Relation `Friend, Sibling` by convention and add Teenager only if teens truly want them. Grown-up gifts lose Child: the Airbnb card, nostalgic chocolate bars, camping voucher, Hope Cards, felt letter board, and pocket projector did on 10/4. Dalia kept Child on the ice cream makers, the Belgian waffle maker, the scratch-off travel map, and PlantWave, which she called great kid gifts. Kid-first gifts lose adult ages, so they stop showing in adult searches: the MicroBrite microscope and Foldscope kit are Child and Teenager, the Alice pop-up book is Child only, and the kid-and-adult yoga mats are Child. Only about 70 gifts were kid-specific on 10/4, thin in gaming, tech, music, and creativity, so a batch of 21 was added.

### Relation, Type, and Occasion

- **Relation** is worth 25 points, the largest single factor. Tag only relationships where the gift makes sense. For "Treat myself" gifts include at least Friend, Sibling, and Partner, plus whatever else genuinely fits. Use `Mentor/Teacher` exactly as written.
- **Type** (Fun, Practical, Sentimental, Luxurious): tag what the gift feels like. Occasion rules read it: Anniversary rewards Sentimental or Luxurious; Just Because rewards Fun and docks Luxurious.
- **Sympathy (added 10/4).** The Sympathy occasion shows ONLY gifts tagged `Sympathy`, skips the vibe question, and is hidden for babies, little ones, and teens. A gift tagged Sympathy alone (a grief book, a memorial chime) never shows for any other occasion; a general comfort gift (a robe, a frame, a weighted blanket) can carry Sympathy alongside its usual occasions. Never Fun, never celebratory, no plants and no flowers (Dalia: plants aren't a good sympathy gift). Good directions: meals and practical help, comfort items, memorial keepsakes, respected grief books, pet-loss pieces, and charity gifts.
- **Occasion**: tag every occasion a thoughtful giver would choose it for. New Job was added on 10/3, and 52 existing gifts were tagged for it: things for the desk, the commute, or the work bag; coffee or tea at work; focus headphones; celebratory treats; learning memberships. Skip kids' toys, baby items, furniture, and wedding-type gifts for New Job.

### Gender (column I)

Tag `Men` or `Women` only when the item is obviously gendered (Dalia 9/21: "shavers, hair clips"). Kids' items stay neutral: "for kids, try not to gender too much where it may be neutral. like star realms could be boys or girls." Blank never excludes anything. Today 15 live gifts are Women and 1 is Men.

---

## 5. Photos

Binding since 10/3/26, for every new gift. Dalia rejected the Shuttle Art marker photo (a packaging collage with color charts) and the Speedball lino cutter photo (box plus loose parts), then said "make sure you do this as a rule for new gifts."

- **First choice:** a styled lifestyle photo of the product in use or in a real setting. The Shuttle Art row now shows someone coloring on a wooden desk.
- **Second choice:** a clean, well-lit shot of the product alone on a plain background. The lino cutter now uses one.
- **Never:** packaging, blister packs, boxes with printed text, infographic panels, collages, size charts, or marketing text over the image, unless the packaging itself is the beautiful part of the gift.
- **The photo shows what is sold.** A shopper could not tell what they were buying when the CB2 Stud Decanter photo showed seven pieces and the whiskey glass photo showed three glasses. Nine photos were swapped for single-item shots on 10/3 (decanter, whiskey glass, Barefoot Dreams ABC Blanket, Crate & Kids Toy Bin, Beverage Tub, Le Creuset round oven, Anthropologie mirror, Pottery Barn baby blanket). When the price really buys a set, rename the gift instead.
- **Browse the whole gallery,** and other reputable retailers selling the same product, before choosing. Aim for 700 to 1500 px. If no attractive photo exists anywhere, choose a different gift.
- **Look at every photo before it goes in the sheet.** Build a contact sheet (PIL is installed) and view it. On 9/21 an agent set the Williams Sonoma apron to a Halloween candy photo. Williams Sonoma sites block automation; Bing Images exposes their real `assets.wsimgs.com` files.
- **The photo host must load from outside.** On 10/5 jomalone.com returned 403 for every product image, including the one an agent picked, which also had flowers in it; the Jo Malone engraved cologne was held back until a photo from a host that loads turns up. Department stores blocked scripted checks too.
- **A weak photo is never a reason to drop a gift** (Dalia 10/4): look for a better photo first; only skip the gift if no usable photo exists anywhere.
- **The rule governs new gifts only.** On 10/3 the Boku-Undo marbling set was retired for having only box photos after Dalia had approved it. She said "i liked the marbling, keep," and it went back to Live with its box photo. For an approved gift with a weak photo, look for a better one or flag it; never retire it.

---

## 6. The algorithm today

Code: `src/data/gifts.ts` (scoring and ranking), `src/data/questions.ts` (quiz, occasions, aliases), `src/data/related.ts` ("More gifts like this"), `src/data/similarity.ts` (/review close matches). The live catalog is served from the Cloudflare edge at `/api/gifts` and refreshed from the sheet every 10 minutes, so sheet edits reach shoppers within about 10 minutes. Ranking 512 gifts takes about 3 ms on a laptop.

### The quiz

1. **Who's it for:** Partner, Parent, Grandparent, Child, Friend, Sibling, Coworker, Mentor/Teacher, Treat myself. Child covers any kid in the shopper's life (a niece, a friend's kid), and its results read "For the kid in your life, with love"; Treat myself reads "For you, with love."
2. **Age:** Baby (0 to 2), Little one (3 to 12), Teenager (13 to 17), Young adult (18 to 25), Adult (late 20s to 50s), Senior (60+). Grandparent skips this question. Baby and Little one are hidden for Partner, Parent, Coworker, Mentor, and Treat myself; Teenager for Parent, Coworker, and Mentor; Young adult for Parent; Young adult, Adult, and Senior for Child (17 or younger, 10/4). The Adjust panel on the results page uses the same rules.
3. **Occasion:** Birthday, Anniversary, Holiday, Wedding, Just because, New baby, Housewarming, Appreciation, Thank you, New job, Sympathy, Other (free text). For Baby and Little one, Housewarming, Wedding, New baby, Anniversary, New job, and Sympathy are hidden. Teenagers keep New job but not Sympathy.
4. **Interests:** up to 3 of the 22 labels plus Best Sellers.
5. **Vibe:** up to 2 of Fun, Practical, Sentimental, Luxurious. Skipped for Sympathy.
6. **Budget:** slider from $10 to $500 in $5 steps, default $120, with an optional floor handle. Presets: Under $25, $25 to $50, $50 to $100, $100 to $200, $200+. Each preset sets both handles; Under $25 sets no floor.

The results page can refine every answer and add For him or For her.

**Typed occasions.** A typed "Other" occasion that names a built-in one scores as it:
- Holiday: Christmas, Xmas, Hanukkah (and spellings), Kwanzaa, Diwali, Eid, Lunar New Year, holiday(s), Secret Santa.
- New Job: new job, first job, job, promotion, promoted, new role, new position.

Anything else gets no occasion scoring. Every typed occasion is still logged to Requests as "NEW: <their words>," because Dalia wants to see shoppers' own wording.

### Hard filters (the gift is dropped)

- Status is anything but `Live`, or Review status is not TRUE (Dalia 10/4; enforced in the edge cache and the direct fallback).
- Sympathy: when the shopper picks Sympathy, any gift not tagged Sympathy is dropped; for any other occasion, a gift tagged Sympathy alone is dropped.
- A gift whose Relation is only `Self` is dropped for every recipient except Treat myself.
- For him hides gifts tagged Women; For her hides gifts tagged Men. Blank never hides.
- Price is more than 10% over the budget (Price > budget × 1.10). Gift cards priced "Your choice" are exempt.
- With a floor set: the top of the gift's price (PriceMax, or Price when there is no range) is below floor ÷ 1.10. Open-ended prices and "Your choice" cards are exempt.
- Age, when the gift has age tags:
  - If the shopper picked an age, the gift must carry it (New baby also accepts Baby).
  - If no age was picked, the gift is dropped when every one of its age tags is impossible for the recipient: Grandparent allows only Senior; Parent excludes Baby through Young Adult; Partner and Treat myself exclude Baby and Child; Coworker and Mentor exclude Baby, Child, and Teenager; Child excludes Young Adult, Adult, and Senior.

### Score, 0 to 100

| Part | Points |
|---|---|
| Relation | 25 if the gift's Relation includes the recipient. "Treat myself" matches any gift with any Relation tag. |
| Age | 10 if the gift's Age includes the picked age (New baby also counts Baby). |
| Budget | Inside the range, by how much of the budget the gift uses (a range counts its top, capped at the budget): a third or more 10, a sixth to a third 7, less 4 (Dalia 10/3/26: bigger budgets should favor fuller gifts, and gifts that fall below the cutoff should drop out; the cutoffs were lowered from half and a quarter the same day after a $50 fondue pot ranked below a $110 fondue set on a $125 budget). 5 in either fuzz zone (up to 10% over the ceiling, or topping out just under the floor); 10 for "Your choice" gift cards and open-ended prices. |
| Interests | Up to 40: round(coverage × 40). |
| Vibe | Up to 10: round(matching vibes ÷ picked vibes × 10). One of two is 5. |
| Occasion | Bonus × coverage, minus any penalty (below). |

The total is clamped to 0 to 100.

**Interest coverage.** Each picked interest adds 1 if it matches the gift's Primary interest, 0.5 if it matches only a secondary tag, and 0 otherwise. A Best Sellers pick that matches the gift's Best Sellers tag adds a full 1. A gift with no primary yet counts every tag as 1. Coverage is that sum divided by the number of picks.

| Picks | Primary only | Primary + 1 secondary | Primary + 2 secondary | 1 secondary only |
|---|---|---|---|---|
| 1 | 40 | | | 20 |
| 2 | 20 | 30 | | 10 |
| 3 | 13 | 20 | 27 | 7 |

**Occasion adjustment.** Applies only when the gift's Occasion includes the shopper's occasion. Birthday, Holiday, and Just Because count as one family: a gift tagged for any of them qualifies for all three (10/3/26, after a personalized record cutting board without a Birthday tag ranked below cookbooks), while event occasions (Wedding, New Baby, Housewarming, Anniversary, Appreciation, Thank You, New Job) still need their own tag. The bonus is multiplied by coverage, so a gift that misses every picked interest gets no bonus; the penalty applies in full. With no interests picked, coverage counts as 1 here.

| Occasion | Bonus | Penalty |
|---|---|---|
| Anniversary | +10 if Type includes Sentimental or Luxurious | −10 if Type is only Practical and/or Fun |
| Holiday | +10 if the gift's Relation includes the recipient | none |
| Wedding | +10 if Interests include Home & Decor, Experiences, or Personalization | −15 if Interests include Gaming, Tech & Electronics, or Fitness |
| Just Because | +10 if Type includes Fun | −5 if Type includes Luxurious |
| New Baby | +10 | none |
| Birthday, Housewarming, Appreciation, Thank You, New Job | +10 | none |

Two of these rules (Just Because and New Baby) never fired before 10/3 because of label mismatches in the code. Housewarming, Appreciation, Thank You, and New Job earned nothing until the same fix.

### Which gifts show, and in what order

- If more than 5 gifts score 60 or higher, only those show. Otherwise every gift at 55 or higher shows. Nothing under 55 ever shows. Results load 8 at a time. Sympathy is the exception: its small hand-tagged set has no vibe points, so every tagged gift that passes the hard filters shows, best first.
- Spacing: among gifts with the same score only, no two of a kind (or near-duplicates) and no same brand back to back, so the match % never rises as you scroll (10/3).
- Ties break on: (1) weighted interest hits, (2) Best Sellers first, (3) price closest to the budget. Closeness is price ÷ budget at or under budget; a range uses its top up to the budget; open prices and "Your choice" count as 1; over budget it is budget ÷ price.

### A worked example

Search: Friend, Adult, Birthday; Cooking, Food & Drinks, Home & Decor; Fun and Sentimental; $120. Urban Map Whiskey Glass today (primary Food & Drinks; secondary Home & Decor, Personalization; Type Practical, Sentimental; tagged Birthday):

- Relation 25, Age 10, Budget 10.
- Interests: Food & Drinks is the primary (1), Home & Decor is secondary (0.5), Cooking is untagged (0). Coverage 1.5 ÷ 3 = 0.5, so 20 points.
- Vibe: Sentimental matches, Fun does not, so 5.
- Occasion: Birthday +10 × 0.5 = 5.
- Total 75.

Under its old five tags, the same glass matched all three picks for the full 40 interest points and the full occasion bonus, which is how it reached the top of $120 searches.

### What this means for curators

- Interests decide most of the ranking, and the primary decides how much an interest is worth. A gift whose primary is wrong loses half its credit for the shopper who wants it most.
- A missing Relation tag costs 25 points, and a missing age tag hides the gift from every shopper who picks that age. Tag them fully and honestly.
- Occasion tags only help gifts that already match the shopper's interests.
- The best new gift for a request genuinely spans two or three of its interests at once (a travel hammock is Travel, Nature & Outdoors, and Rest & Relaxation).

### "More gifts like this" (`related.ts`)

Under each gift page: live gifts that share an age tag, are not made for the other gender, and share at least one interest (Best Sellers ignored). Score = 3 per shared interest + 1 per shared vibe + 0.5 per shared relation + 2 when prices are within 2× (1 within 4×), minus 4 for the same product type and 1 for the same brand. One gift per brand, top 4.

### Close matches in /review (`similarity.ts`)

TF-IDF cosine similarity on the name (weight 0.7) and description (0.3), with brand words and filler ("set," "gift," "premium") removed. Adjustments: up to +0.1 for shared interests; +0.35 when both gifts are the same product type; −0.1 when the gift has a type and the candidate's type differs; −0.15 when prices differ by more than 3×. A score of 0.40 or more counts as a close match. Product types include drinkware, planters, coffee makers, kettles, headphones, speakers, instant cameras, photo printers, wearables, massage guns, yoga mats, blankets, candles, diffusers, jigsaws, e-readers, controllers, keyboards, sheet sets, slippers, sneakers, hoodies, digital frames, sleep clocks, indoor gardens, Dutch ovens, ice cream makers, coffee subscriptions, cheese, chocolate, VR headsets, online classes, sunglasses, and wallets. The drinkware type was added after Dalia noted the Rambler "is the same as the other water bottles" while the matcher scored it low.

### Shopper flags on the results page

"Don't like," "Out of stock," and "Link not working" cross out a gift and move it to the bottom. "Image broken" and "Other" leave it in place, at Dalia's request (9/21): a broken image says nothing about the gift itself.

---

## 7. Requests workflow

Shoppers reach the Requests tab two ways: "Request more like these" under results, and typed "Other" occasions (logged as "NEW: <text>"). Columns: at, type, recipient, age, occasion, interests, vibe, budget, clientId, then action (J) and email.

### 1. Separate signal from noise first

Dalia (10/3): "some people may be pushing buttons (or may be bots). we need to think about what's logical." Before acting on a row:

- Several requests from the same clientId within seconds or minutes is button-mashing. Count it once.
- No clientId, identical rows in bursts, or impossible combinations look automated or careless. Weigh them low.
- Dalia's own browsers post requests while she tests. Her registered devices are listed in the Apps Script property OWNER_CLIENT_IDS; ask her if unsure. On 10/3 three new requests (Partner, Just Because, Music + Cooking + Experiences) all came from her device, one carrying her opt-in test email.
- Real signal: the same combination or typed occasion from distinct clientIds, and searches whose results are genuinely thin.

### 2. Every credible request gets curated additions

Dalia (10/3): "any of the ones requested for more in the doc, even if it already has plenty, it may mean we need better curated additions that have a higher match rating. so if someone requests, please add." A request means the existing matches were not good enough.

- Open the same search on the site (results URLs take `r`, `a`, `o`, `o2`, `i`, `v`, `b`, `bmin`, `g`) and note the result count and the top picks.
- Source about 6 gifts per request (5 or more per interest combination was her 9/21 ask). Each should honestly span as many of the requested interests as possible and fit the vibe, recipient, age, and budget.
- An owner test can still reveal a real gap. Her 10/3 test (Adult, $25 to $50, Music + Cooking + Experiences) showed no gift under $50 covering two of those interests, so it got additions too.
- Follow sections 1 to 5 for every new row, and note it "Added <date> for user request #<row>."
- If the first batch misses, run a second pass guided by what Dalia kept and cut. The teen $15 request kept 3 of 8, and the second pass (Pilot Parallel calligraphy pen, Jacquard cyanotype set, DMC embroidery kit, Discraft disc, Zeekio juggling balls, Waboba ball) followed her picks: crafts with a result and fitness that feels like a game. She then cut the Discraft disc under the $20 rule (section 1), so a second pass still needs every item to clear that bar.

### 3. Log the action in the Requests tab (column J)

Format used on 10/3: "Done 10/03/2026: had 26 matches; added 6 better-fitting gifts." For the teen request: "Done 10/03/2026: had 7 matches; added 8 gifts (Dalia kept 3), then 6 more in a second pass." Rows in the Feedback tab get the same kind of note in their action column, for example "Done 10/03/2026: photo loads fine; link moved to thamesandkosmos.com."

### 4. Typed occasions

- Logged as "NEW: <text>" even when they map to a built-in occasion: "it's good to see things in their own wording too."
- A typed occasion that recurs across distinct shoppers can earn a quiz option (Dalia 10/3: "if there's a recurrence on occasions being requested, we can consider adding them"). Christmas came from two different shoppers and is now an alias for Holiday. New Job became a real occasion after "new job" and "becoming a purser" (a promotion) were typed in.

### 5. Email opt-in

After "Request more," shoppers can leave an email for one heads-up when gifts are added. It is written to the email column on their latest matching Requests row. Sending is not automated, and nothing goes out without Dalia's approval. An agent never sends email on her behalf.

---

## 8. Review tool and owner actions

`/review` is Dalia's password-gated review app. The password lives only in the Apps Script's Script Properties: never put it in code, docs, URLs, or chat, and never ask for it.

- **Queue.** Opens on "Needs review" (Review status FALSE), Live rows first in sheet order. When the queue is empty it switches to the full catalog with a notice. Filters cover approved, rejected, dead, retired, and all.
- **Actions** use plain-letter keys. Keys pressed with Cmd, Ctrl, or Alt, and held-down repeats, are ignored, because Cmd+R once rejected gifts by accident.
  - **Approve (A):** Review status TRUE; Status unchanged.
  - **Reject (R):** Status `Rejected` and Review status TRUE. Reject removes the gift from the site.
  - **Dead (D):** Status `Dead` and Review status TRUE, for broken links (added 10/3 at her request).
  - **Back (←), Skip (S), Undo (U).**
- **Each card shows** the Primary row above Interests, the Feedback note with its label (section 3), the close-match count, and up to five closest matches.
- **Owner "Don't like."** Any browser that unlocks /review is registered as Dalia's device. When one of those browsers marks a gift "Don't like" on the live site, the Apps Script rejects it (Status Rejected, Review status TRUE) and appends "Rejected <date>: owner marked Don't like on the site." It first checks that the row still holds that gift. First use: the Koss KSC75. Limits: a private window or cleared browser data creates a new ID, so she reopens /review to register again; anyone else using her browser counts as her.
- **How to ask for a decision.** Apply obvious, low-stakes fixes directly and mark them "Fixed <date>:" (tag corrections, typos, age or relation mismatches, verified price, photo, and link updates, naming a specific product). Dalia (9/21): "just do it if it's obvious and small stakes." Leave only genuine taste calls, start the note with "Flagged" or "Check," and tell her how to answer: Approve keeps it, Reject removes it.
- **Treat a Reject as final.** Before proposing a gift, read every row, including Rejected, Retired, and Dead. The public `/api/gifts` feed holds live rows only, so read the Apps Script feed (see "Current catalog" in the agent brief). Never re-propose a rejected gift or its near-twin; the Field Notes memo books were proposed and rejected twice.
- **Design work is separate.** For site design sweeps, bring critic findings as a list for her to pick from. She reverted a bulk-applied sweep on 9/21.

---

## 9. Open questions and future items

- **Amazon alternative links.** Dalia asked to be reminded to settle a strategy for finding AmazonAltLink matches. Points to weigh: Amazon prices fetched from this machine come in ILS, so checks need a US-locale fetch or the Product Advertising API; add an alt link only for the identical product; keep the brand's site as Link.
- **Affiliate coverage beyond Amazon.** An auto-affiliate network (Skimlinks or Sovrn) for the non-Amazon gifts is still open.
- **bestgiftideas.com.** Dalia's "future to do: use bestgiftideas.com somehow - maybe for blog." Confirm she owns it, then weigh a blog home that links into the quiz, a redirect to a giftpicker.io blog, or an SEO landing site. Related: the planned move of the Presently blog to giftpicker.io.
- **Sponsored placement.** /brands shows "$99 for 1 year" (Claude's suggested price; Dalia can change it in `PLACEMENTS` in `src/components/Brands.tsx`). Open: how to take payment. Before the first sponsored gift goes live, build a Sponsored column, a visible "Sponsored" label on cards, hero, modal, and gift pages, and a ranking rule that sponsorship only boosts a gift within results it already qualifies for.
- **Request triage in code.** Possible later: rate-limit request posts per clientId in the Apps Script, add a honeypot like /brands has, and log the result count with each request so thin results stand out.
- **Request notification emails.** The opt-in collects addresses, but sending is manual and needs Dalia's approval.
- **Permanent gift IDs.** Gift URLs depend on row position. A stable ID column was offered and not yet approved; until then, append only.
- **BillingPeriod cleanup.** r314 (Down Dog), r338 (HealthyMe snack box), r345 (Outside the Box art boxes), and r362 (MasterClass) say `recurring`, which the site shows as a one-time price. Each needs `monthly`, `weekly`, or `one-time` with a matching Price.
- **Rows from the 10/3 batches:** Dalia reviewed r682 to r694 on 10/3 and rejected the Discraft disc (r692) and the Pilot Parallel Calligraphy Pen (r689). Neso 1 Beach Shade (r682) is getting the original-versus-copycat check.
