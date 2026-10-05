# GiftPicker catalog brief (for gift-sourcing agents)

GiftPicker (giftpicker.io) is a gift quiz backed by a hand-curated Google Sheet owned by Dalia. You research gifts and write rows for that sheet as a TSV file plus a photo contact sheet. You never touch the sheet, the repo, or git yourself, and you never send messages or emails.

This brief is self-contained. The full reasoning, with examples and history, is in [curation-playbook.md](curation-playbook.md) in the same folder. Last updated 2026-10-03.

---

## 1. Current catalog: read it all before proposing anything

- **Live rows:** `curl -s https://giftpicker.io/api/gifts` returns `{"data":[...]}` with every field for the gifts shoppers can see.
- **Every row, including Rejected, Retired, and Dead:** `curl -sL "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec?tab=Gifts"`. It fails about 1 in 3 calls with an HTML page instead of JSON; retry until you get JSON. The Feedback field often records why a row was rejected or retired; rows Dalia rejected in /review may carry only their original "Added" note.

Before proposing a gift, check both:

- Do not duplicate a live gift or a near-twin: the same product type from the same brand, or the same product from another seller.
- **Never re-propose a gift with Status `Rejected`, or its near-twin.** A Reject is Dalia's final taste call. Field Notes memo books were proposed twice and rejected twice.
- Read the Retired notes for the category you are working in. They record which brand won an overlap and why.

---

## 2. What the owner wants (binding)

Her standard: gifts that are "meaningful, unique, and wow" and high quality. Never "a stocking stuffer," "a chachka," or "a cheap plastic toy that will break and get thrown out immediately." If the item is interchangeable with a store-brand version of itself, skip it.

### She approves

- Experiences and memberships (Hipcamp Gift Card, National Parks Annual Pass, a pottery class).
- Subscriptions with clear contents (coffee, cheese of the month, Storyworth).
- Personalized and sentimental gifts (custom LED neon sign, family recipe cutting board).
- Name-brand tech and kitchen gear with a reason to exist (AirPods Pro 3, Kindle Paperwhite, KitchenAid stand mixer, Ember Mug 3).
- Kids' learning toys (Lovevery, Magna-Tiles, Yoto).
- Cheap items with a twist or a point of view (city-map whiskey glass, Pantone color box, pocket microscope, SKLZ Reaction Ball).
- Hobby kits with a satisfying result (Speedball lino cutter kit, suminagashi marbling set, DMC embroidery kit).
- Premium indulgences at high budgets (white truffle and slicer bundle, Smythson journal, Arcade1Up machine).
- Honest crossovers when a request spans odd interests (the Official Stardew Valley Cookbook for Gaming plus Cooking).
- Functional or iconic apparel and accessories (lululemon Everywhere Belt Bag, UGG Fluff Yeah Slippers, OOFOS recovery slide, a UPF sun hat).

### She rejects (with real rejected examples)

1. **Plain basics:** a single coaster, a monogrammed mug, a bookmark, a single planter, a candle holder, a picture frame, a single kitchen utensil (ice cream scoop, zester), a mousepad, a clip-on book light, a basic body wash, a plain desk.
2. **Apparel basics:** beanies ("I don't think a beanie is a good gift idea"), hoodies, plain sneakers (Veja Campo, Nike Air Force 1), running shoes, fleece jackets, compression socks, plain robes ("not special, just white"), simple flats ("too simple"), hair clips ("stocking stuffer").
3. **Plain stationery and single writing tools:** memo books, a plain notebook, fountain pens and rollerballs (Kaweco, LAMY), a mechanical pencil, a pen case, page markers. Stationery that passed has a format or system behind it: a Smythson journal, the Leuchtturm1917 Learning Journal, the Ugmonk Analog Starter Kit.
4. **Pantry staples that read as groceries:** matcha stick packs, mānuka honey, a dried pasta sampler, a chocolate pretzel assortment. Food that passed has a presentation, a tool, an occasion, or small-batch character: Sugarfina Champagne Bears, the Golde Superwhisk and turmeric kit, Runamok maple syrup, the Diaspora Co. spice sampler.
5. **Plain fitness and recovery tools:** a lacrosse massage ball, finger-extension bands, a basic speed rope. Fitness that passed feels like a game or a real upgrade: SKLZ Reaction Ball, Crossrope weighted rope set, Theragun.
6. **Cheap science desk trinkets:** a gyroscope, a color-mixing cube.
7. **A second gift in a slot already filled:** a tumbler when water bottles exist ("the tumbler is the same as the other water bottles"), another travel mug, a second single-serve coffee maker.
8. **Dated or uncool tech:** Koss KSC75 ear-clip headphones ("an outdated uncool gift").
9. **Not right for a gift catalog:** sex toys ("it doesn't feel right").
10. **Low-quality sources:** dropship or generic personalized goods, keyword-stuffed titles, spam-style brand names, generic designs sold under many house brands, vague listings ("Live Plant" with no plant named), kitschy gags, sellers with records of non-delivery.

### Gifts at $20 or under need a higher bar (Dalia 10/3/26)

At this price the recipient could easily have bought it themselves. The gift must be something they would not have thought to buy:

- a kit that starts a hobby (her example: the DMC Learning Embroidery Kit, "cute and a nice hobby to gift");
- a specialty or artisan version of an everyday thing;
- a clever design object;
- a curated sampler.

Commodity items fail. Her example: a Discraft ultimate disc, "if someone wants a frisbee they'd have already bought one."

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
- **Self only** (Relation is exactly `Self`, so the gift never shows for anyone else): things people buy for themselves, including tactical sports gear. Her picks: Leatherman Wave Plus, Bala Bangles, lululemon Everywhere Belt Bag, Synapse 140 sport kite, MSR Evo snowshoes, Opinel mushroom knife. A "treat myself" gift that also suits others is different: it keeps its other recipients.
- **No flowers.** Venus et Fleur preserved roses were rejected on 10/4. The LEGO flower kits stay in the catalog, but flowers, real or LEGO, never appear in marketing images.
- **Kids:** see Age in section 4. Recipient Child means 17 or younger, and `Child` age goes only on gifts a 3 to 12 year old would want.
- **Some gifts read as for seniors only:** the Kitchen Linens Bundle and the Classic Personalized Apron are tagged Senior only.
- **Tags must survive a shopper's eye:** celebrity cookbooks are Cooking, not Music (they outranked real music gifts); a wind chime is Home & Decor, not Music; astronomy binoculars are Nature & Outdoors, not Learning; the Tivoli radio is Home & Decor first, Music second.

### Ratings and seller reputation (binding, Dalia 10/3/26)

Nothing poorly rated, and no seller with a bad reputation:
- **Product rating:** at least 4.3 stars from at least 50 ratings on the brand site, Amazon, or a major retailer. If the product has fewer ratings, it needs at least 4.5 stars or must come from an established, well-reviewed brand. Experiences and gift cards skip this check, but the seller check still applies.
- **Seller reputation:** no pattern of complaints about orders never arriving, damaged or dead deliveries, counterfeits, no-shows, or refused refunds (Page 1 Books, Insect Lore, Cozymeal, and Hand & Stone were removed for this). A BBB "F" alone is not disqualifying, because many direct-to-consumer brands get one for unanswered complaints; it fails a gift only when the complaints show one of those patterns or a safety problem. Trustpilot counts only for small or direct-to-consumer sellers with meaningful volume (3.5 or higher); ignore it for big brands and major retailers (Target, Barnes & Noble, KitchenAid), whose Trustpilot pages skew negative.
- **Write it down:** record what you found in the Feedback note, for example `Rating: 4.7 from 2,300 (Amazon); seller: Trustpilot 4.4, BBB A+`. If you can't find ratings at all, say so, and the gift must have another strong reason to be trusted (a respected maker, or a major retailer as the seller).

### Prefer the original over a copycat (Dalia 10/3/26)

Before proposing a product, search whether it copies an original brand that created the category or the design (her example: she believes Otentik is the original of the sandbag-anchored stretch beach shade that Neso sells). Prefer the original. A copycat is acceptable only if it is genuinely better (quality, reviews, or value), is separately very popular in its own right, or is meaningfully easier for US shoppers to get (Neso over Otentik). When you propose a copycat, say which applies in the Feedback note (format in section 5).

### Batches at low budgets

On 10/3, a $15 teen batch kept 3 of 8 gifts, while a $500 batch kept 6 of 6. Low budgets pull sourcing toward commodity items. Return fewer gifts rather than padding a batch with weak ones, and say in your report what you dropped and why.

---

## 3. Catalog balance

- **Crowded categories:** headphones, speakers, blankets and throws, instant cameras, drinkware, yoga mats, candles, and planters already have several entries. Add one only if it fills a use the others do not, from a top-tier brand.
- **Overlap calls already made:** three premium noise-cancelling over-ear headphones (Apple, Bose, Sony); Bose holds the soundbar slot; JBL keeps its smaller speakers (Clip 5, Charge 6, JR Pop for kids, PartyBox On-The-Go for its microphone); Fujifilm holds the instant camera and Polaroid the starter set; Anthropologie holds the faux-fur throw.
- **Cut by tier:** when trimming a category, the no-name or lower-tier entry goes first. Never retire a strong brand as a blanket rule.
- **Same brand and same product type is a duplicate.** Same brand in a different size or use is fine.
- **Replacements:** when a task asks you to replace a dead or sold-out gift, find a similar or better-quality gift in the same category so the slot never goes empty.
- **Current models only:** if a newer model of a product exists, propose the newer one.

---

## 4. Tagging (binding)

### The test

Add an interest tag only if a shopper who picked that interest would be glad, and not disappointed, to see this gift near the top of their results. Do not add any tag, relation, vibe, or occasion to raise a score. The ranking formula is left out of this brief on purpose: agents who were given it on 10/3 over-tagged to score well. It is documented in the playbook for people maintaining the site. Over-tagging gets rows rejected: a satin-lined beanie tagged Self-Care & Beauty and a sun hat tagged Nature & Outdoors were both called out, and a city-map whiskey glass with five interest tags reached the top of $120 searches it did not belong in.

### Interests and Primary interest

- **At most three interest tags**, plus `Best Sellers` when it truly applies.
- **Primary interest** is the ONE label that says what the gift is: the interest a shopper would pick if this gift is exactly what they hoped to find. Never Best Sellers. When torn, pick the label that describes the object itself. The site gives a primary match full credit and a secondary match half credit, so a wrong primary hurts the shoppers who want the gift most.
- The Interests value lists the primary first, then secondary tags, then Best Sellers last.
- Examples: a beanie is Apparel & Accessories only; a sun hat is Apparel & Accessories only; a streaming gift card is Rest & Relaxation; the Stardew Valley cookbook is Gaming, then Cooking and Food & Drinks; a countertop indoor garden can carry Home & Decor because it sits on display; a repair tool kit is Tech & Electronics with no Sustainability tag.
- **Best Sellers** is only for proven, widely loved hits (AirPods, Kindle, Owala FreeSip, Slip pillowcase, lululemon belt bag, Magna-Tiles, Jellycat). Never for pricey furniture, niche gamer gear, generic baby items, or a brand that is merely popular in a niche.

### Age

- Tag every age the gift honestly suits; a missing age hides the gift from shoppers who pick that age.
- **Alcohol and cannabis exclude Young Adult and younger** (Young Adult is 18 to 25). Barware without alcohol may include Young Adult.
- **Trendy beauty is teen-only** (Summer Fridays, Dior lip oil, Sol de Janeiro and the like): tag Teenager only.
- **Kids' gifts** are Age `Child` (3 to 12), plus Teenager only when teens truly want them, never Young Adult, Adult, or Senior. Never put `Child` on a grown-up gift.
- **Sympathy gifts** carry Occasion `Sympathy`; never Fun, never celebratory occasions on a memorial piece, no plants or flowers.

### Relation, Type, Occasion

- Grandparent always means Senior: the quiz skips the age question for grandparents, so a gift tagged Grandparent must also carry Senior in Age, or it never shows for them.
- Kids' gifts carry Relation `Friend, Sibling`; the Child recipient reads those two, and a `Child` value in Relation matches nothing.
- Tactical sports and hobby gear (a sport kite, snowshoes, a fly rod outfit, a climbing chalk bag, a garden knife) is Relation `Self` only.

- **Relation:** only relationships where the gift makes sense; it is the heaviest single factor in ranking. For "treat myself" requests include at least `Friend, Sibling, Partner`, plus whatever else genuinely fits, unless the gift is something people only buy for themselves, which is `Self` alone (see the 10/4 rulings). Kids' gifts are `Friend, Sibling`. A cookbook is fine for coworkers and mentors; Dalia overruled a reviewer on that.
- **Type:** what the gift feels like (Fun, Practical, Sentimental, Luxurious).
- **Occasion:** every occasion a thoughtful giver would choose it for. New Job covers desk, commute, and work-bag items, coffee or tea at work, focus headphones, celebratory treats, and learning memberships. Leave it off kids' toys, baby items, furniture, and wedding-type gifts.

### Gender

Empty unless the item is obviously only for men or only for women (`Men` / `Women`), like a shaving kit. Kids' items stay neutral.

---

## 5. Output row format

TSV, no header, exactly 20 columns per row, no tabs or newlines inside fields. **This is the order your file uses.** The sheet itself is ordered differently (A ID, B Gift, C Brand, D Age, E Relation, F Type, G Primary interest, H Interests, I Occasion, J Gender, K Price, L PriceMax, M BillingPeriod, N Description, O PhotoAddress, P Link, Q AmazonAltLink, R Status, S Date updated, T Review status, U Feedback); whoever pastes your file maps it by column name. Never write an ID: new rows get one automatically.

1. **Gift:** the product name without the brand. Name the specific model ("Instax Mini 13," "Ooni Koda 2"). If the price buys a set, say so ("Long Distance Friendship Lamps (Set of 2)"). Subscriptions say what is inside ("Coffee Gift Subscription," "Cheese of the Month Club," "Book Club Gift Membership"); a bare "Gift Subscription" was renamed for that reason. Gift cards are the one place the brand leads: "<Brand> Gift Card" ("Hipcamp Gift Card," "Lululemon Gift Card").
2. **Brand:** the maker, in its official spelling. A retailer's name goes here only if it is also the maker.
3. **Age:** comma-separated from `Baby, Child, Teenager, Young Adult, Adult, Senior`.
4. **Relation:** comma-separated from `Partner, Parent, Grandparent, Friend, Sibling, Coworker, Mentor/Teacher`.
5. **Type:** comma-separated from `Fun, Practical, Sentimental, Luxurious`.
6. **Interests:** comma-separated, exact labels, primary first, at most three plus `Best Sellers` last. Labels: `Best Sellers, Apparel & Accessories, Cooking, Creativity, Experiences, Fitness, Food & Drinks, Gaming, Health & Wellness, Home & Decor, Learning, Music, Nature & Outdoors, Organization, Personalization, Pets, Rest & Relaxation, Seasonal Gifts, Self-Care & Beauty, Sustainability, Tech & Electronics, Toys & Games, Travel`.
7. **Occasion:** comma-separated from `Birthday, Anniversary, Holiday, Wedding, Just Because, New Baby, Housewarming, Appreciation, Thank You, New Job`.
8. **Price:** number only (64.99), the lowest real price for the item as sold.
9. **PriceMax:** a number when the product genuinely has a range (sizes, set counts, gift card amounts), else empty. Gift cards use a real purchasable range; do not copy the seller's default amount (Hipcamp is listed at 25 to 500, in line with the other gift cards, because the buyer can type any amount).
10. **BillingPeriod:** exactly `one-time`, `monthly`, or `weekly`. No other values.
11. **Description:** 20 to 40 words, plain and concrete: what it is and why it makes a good gift.
12. **PhotoAddress:** a direct image URL you verified (section 6).
13. **Link:** a direct product page you verified: it loads, the product is in stock, and the price matches. Prefer the brand's own site.
14. **AmazonAltLink:** `https://www.amazon.com/dp/ASIN` only if the identical product (same model, size, and count) sells there, else empty. Never amzn.to. **Never the same URL or ASIN as Link.** If Amazon is the only seller, put it in Link and leave this empty.
15. **Status:** `Live`.
16. **Date updated:** today's date as `YYYY-MM-DD`.
17. **Review status:** `FALSE`.
18. **Feedback:** the note your task gives you; it must start with the word `Added` and a date (for example `Added 10/3/26 for user request #25`). If the gift is a copycat of an original brand, append ` | Copycat of <original brand>: kept because <genuinely better: reason>` or `... because <popular in its own right: reason>`. If it replaces a dead or sold-out gift, use `Added <date> to replace <old gift> (<reason>)`.
19. **Gender:** empty unless the item is obviously gendered (`Men` / `Women`).
20. **Primary interest:** the ONE label that says what the gift is. Best Sellers can never be the primary. It must also appear first in column 6.

---

## 6. Verification and photos

- Fetch every product page and photo yourself. If you cannot verify the price, stock, or photo, drop the item and find another. A fabricated URL or price is much worse than a shorter list.
- Amazon pages fetched from this machine may price in ILS; take prices from the brand's own site.
- **Photo aesthetics (binding since 10/3/26).** Every new gift's photo must look good on a warm, editorial gift site. Prefer, in order: (1) a styled lifestyle photo of the product in use or in a real setting; (2) a clean, well-lit shot of the product alone on a plain background. Never packaging, blister packs, boxes with printed text, infographic panels, collages, size charts, or marketing text over the image, unless the packaging itself is the beautiful part of the gift. Dalia rejected a marker-set packaging collage and a lino cutter shown as a box with loose parts.
- **The photo shows exactly what is sold.** One glass if one glass is sold. A seven-piece barware photo on a single decanter confused shoppers. If the listing really is a set, name it as a set.
- Browse the seller's whole gallery and other reputable retailers selling the same product to find the best image. Aim for 700 to 1500 px. If no attractive photo exists anywhere, pick a different gift.
- The photo URL must load for an outside visitor (a plain GET returns 200 and an image type). Some brand hosts, such as jomalone.com, return 403; pick a host that loads or a different gift.
- Other agents may be sourcing in parallel. Stay in the interests and price band you were given, and check the live catalog and any rows the task lists as just added.
- Before writing your file, build a contact sheet of your chosen photos (PIL is installed) and look at it with your image-reading tool to confirm each photo shows the right product and is attractive. A past agent set a Williams Sonoma apron to a Halloween candy photo. Williams Sonoma sites block automation; Bing Images results expose their real `assets.wsimgs.com` image URLs.

---

## 7. Sourcing for shopper requests

- A request means the existing matches were not good enough, even when the search already returns many results. Find gifts that honestly span as many of the requested interests as possible at once (a travel hammock is Travel, Nature & Outdoors, and Rest & Relaxation), fit the vibe, suit the recipient and age, and cost at or under the budget.
- Do not force fake combinations. Tag only the interests a gift truly covers, even when that means two of the three requested.
- If your task includes Dalia's decisions on an earlier batch, treat them as the strongest guide you have: match what she kept and avoid every type she cut.

---

## 8. Writing rules

No em-dashes anywhere. Minimize en-dashes; write "to" for ranges. Use the Oxford comma. No hype words ("perfect," "amazing," "ultimate," "must-have," "elevate"). No verbless sentence fragments as a final flourish ("Instructions included."). No "X, not Y" constructions. No aphoristic or slogan-like lines. Plain, specific sentences.
