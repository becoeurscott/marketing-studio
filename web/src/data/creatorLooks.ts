/**
 * Fixed appearance of each AI creator. Used to generate their portrait and character sheet, and
 * repeated in every video prompt (with the sheet as reference image) so the person stays the same.
 * Keys are the creator ids from data/creators.ts.
 */
export const CREATOR_LOOKS: Record<string, string> = {
  creator_maya:
    "Aïcha, 24-year-old Ivorian woman, warm deep-brown skin with a natural glow, round face, full cheeks, bright wide smile, shoulder-length box braids with a few gold cuffs, small gold hoop earrings, wearing a mustard-yellow wrap top, soft natural makeup",
  creator_jordan:
    "Kofi, 29-year-old Ivorian man, dark brown skin, short fade haircut with a sharp line-up, neat short beard, rectangular black glasses, slim build, wearing a navy polo shirt with an orange collar trim, silver wristwatch",
  creator_sofia:
    "Fatou, 27-year-old Senegalese woman, very dark ebony skin, tall and slender, elegant oval face, high cheekbones, wearing a colorful red-and-blue wax print head wrap (tied high), matching wax print dress, gold statement earrings",
  creator_marcus:
    "Moussa, 31-year-old Malian man, dark brown skin, bald head, full rounded beard, big expressive smile, sturdy build, wearing a light blue embroidered short-sleeve boubou shirt (bazin), cream kufi cap in his hand or on his head",
  creator_priya:
    "Nneka, 26-year-old Nigerian woman, medium brown skin, heart-shaped face, long knotless braids dyed burgundy, small nose ring, bold winged eyeliner, wearing a black crop top and denim jacket",
  creator_leo:
    "Chinedu, 23-year-old Nigerian man, medium-dark brown skin, playful face, short curly high-top afro, thin mustache, gap-toothed grin, wearing a bright green oversized t-shirt and a white bucket hat",
  creator_hana:
    "Mariam, 30-year-old Malian woman, deep brown skin, soft round face, calm kind eyes, wearing a patterned indigo bogolan (mud cloth) head scarf and a matching loose kaftan, small silver earrings",
  creator_diego:
    "Yao, 34-year-old Ivorian man, dark skin, athletic build, short twists hairstyle, trimmed goatee, wearing a bright orange delivery-style jacket over a white t-shirt, crossbody bag",
  creator_amara:
    "Grâce, 28-year-old Congolese woman, rich dark brown skin, oval face, short natural afro (TWA) with defined curls, freckle-free glowing skin, wearing a sage-green linen shirt, wooden bead necklace",
  creator_ethan:
    "Émeka, 25-year-old Nigerian man, medium brown skin, lean build, short dreadlocks tied up in a small bun, clean-shaven, wearing a black hoodie with purple gaming headphones around his neck",
  creator_chloe:
    "Khady, 22-year-old Senegalese woman, dark skin, youthful round face, big curious eyes, high puff natural hair with a yellow scrunchie, wearing an oversized light-grey university sweatshirt, small backpack",
  creator_noah:
    "Ibrahima, 36-year-old Senegalese man, dark ebony skin, tall, short cropped hair with a little grey at the temples, short neat beard, warm fatherly smile, wearing a beige kaftan (grand boubou top) with subtle embroidery",
  creator_yuki:
    "Adjoa, 27-year-old Ivorian woman, light-brown skin, angular face, short platinum-blonde buzz cut, bold geometric earrings, colorful kente-pattern jacket over a black top, creative artist look",
  creator_isabella:
    "Tshiala, 33-year-old Congolese woman, deep brown skin, gentle smile, shoulder-length straight black wig with bangs, wearing a coral-pink blouse and a patterned apron in the kitchen",
  creator_samuel:
    "Amina, 40-year-old Cameroonian businesswoman, dark brown skin, confident mature face, short sleek bob haircut, pearl earrings, wearing a tailored emerald-green blazer over a patterned ndop-inspired top",
  creator_zara:
    "Wanjiru, 29-year-old Kenyan woman, rich brown skin, long elegant neck, sharp cheekbones, sleek low bun with a middle part, minimal gold jewelry, wearing a champagne satin slip dress with a cream tailored blazer",
  creator_coumba:
    "Coumba, 26-year-old Senegalese woman, dark ebony skin, elegant oval face with defined cheekbones, warm genuine smile, waist-length goddess locs (bohemian locs with soft curly ends) swept over one shoulder with thin gold cuffs, gold drop earrings, wearing a champagne-gold lace tailored midi dress with a high neckline and delicate embroidery, gold strappy heels",
  creator_nadege:
    "Nadège, 27-year-old Cameroonian woman, medium-deep brown skin, athletic toned build, defined jawline, bright confident smile, sleek high braided ponytail (one long braid down her back) with laid edges, small gold stud earrings, wearing a lilac zip-up training jacket with a white stripe, matching lilac leggings and white sneakers",
  creator_binta:
    "Binta, 25-year-old Guinean woman, deep dark-brown skin, heart-shaped face with high cheekbones, playful closed-lip smile, short tapered natural coils dyed honey blonde, oversized gold hoop earrings and layered gold chain necklaces, bold berry lipstick, wearing a fuchsia-pink satin puff-sleeve blouse tucked into high-waisted black wide-leg trousers, gold strappy sandals",
  creator_ange:
    "Ange, 23-year-old Ivorian woman, warm medium-brown skin, soft oval face, sweet open smile, long silky jet-black straight hair with a middle part falling past her chest, small gold huggie earrings, long almond nails in glossy baby pink, soft glam makeup with glossy pink lips, wearing a baby-pink ribbed knit sweater with a matching baby-pink knit midi skirt and white sneakers",
  creator_rokhaya:
    "Rokhaya, 31-year-old Senegalese woman, dark brown skin, serene round-oval face, gentle motherly smile, traditional Fulani braids with a center braid, long braids decorated with small amber beads, cowrie shells and silver rings, small silver earrings, wearing a flowing full-length white cotton boubou with rich gold embroidery at the neckline, white trousers and gold flat sandals",
  creator_esther:
    "Esther, 24-year-old Congolese woman from Kinshasa, rich dark-brown skin, expressive lively face with defined cheekbones, big joyful laughing smile, large voluminous round natural afro with a wide orange satin headband, chunky gold hoop earrings, wearing a bright orange ribbed crop top under an open blue-orange-yellow wax-print shirt, high-waisted wide-leg trousers in the same wax print and white sneakers",
  creator_laetitia:
    "Laetitia, 29-year-old Gabonese woman, deep brown skin with cool undertones, elegant long face with sculpted cheekbones, soft sophisticated half-smile, chin-length bouncy curly bob with glossy defined ringlets and a deep side part, pearl drop earrings, thin gold chain, dark berry lipstick and subtle smoky eyes, wearing a burgundy silk slip midi dress with nude strappy heels",
  creator_sali:
    "Sali, 32-year-old Burkinabè woman, dark brown skin, calm oval face with mature features, warm relaxed smile, neat straight-back cornrows woven with thin gold thread gathered into a low chignon bun, small round wooden earrings, a stack of carved wooden bangles on one wrist, natural minimal makeup, wearing a terracotta-orange linen jumpsuit with a wide collar and tan leather flat sandals",
  creator_maimouna:
    "Maïmouna, 28-year-old Malian woman, medium-dark brown skin, oval face with high cheekbones, adventurous bright smile, two long jumbo feed-in braids falling over both shoulders down to her waist, small gold hoop earrings, light natural makeup, wearing a knee-length belted khaki safari shirt dress with rolled sleeves, a colorful bogolan-pattern scarf loosely tied around her neck and brown leather ankle boots",
  creator_princesse:
    "Princesse, 22-year-old Togolese woman, dark brown skin, defined cheekbones and a pointed chin, cool confident smirk, long passion twists dyed copper-ginger falling past her shoulders with a few gold cuffs, gold nameplate necklace and small gold hoops, wearing an oversized cropped light-wash denim jacket over a white ribbed tank top, beige cargo pants and chunky white sneakers",
  creator_serge:
    "Serge, 33-year-old Cameroonian man, dark brown skin, strong square jaw, broad shoulders, confident easy smile, short 360 waves haircut with a sharp line-up, full well-groomed short beard, steel chain-link bracelet, wearing a black leather biker jacket over a charcoal crew-neck t-shirt, dark jeans and black leather boots",
  creator_abdoulaye:
    "Abdoulaye, 28-year-old Senegalese man, very dark ebony skin, sculpted cheekbones and a defined jaw, calm charming smile, high-top fade with a crisp razor part and sharp line-up, thin beard outlining the jaw, small silver stud earring, wearing a crisp white short-sleeve barber tunic over a black t-shirt, black trousers and black sneakers",
  creator_kwame:
    "Kwame, 30-year-old Ghanaian man, deep brown skin, elegant long face with high cheekbones, refined subtle smile, short neat twists on top with tapered sides, clean-shaven, thin gold-rim round glasses, wearing a tailored mustard-yellow double-breasted blazer over a black turtleneck with a kente-pattern pocket square, slim black trousers and brown leather loafers",
  creator_ousmane:
    "Ousmane, 38-year-old Guinean man, dark brown sun-kissed skin, weathered strong face with smile lines, warm proud grin, short cropped hair, salt-and-pepper short beard, wearing a woven straw hat tilted back, a faded denim work shirt with rolled sleeves over a white undershirt, khaki work trousers and brown rubber boots",
  creator_patrick:
    "Patrick, 35-year-old Ivorian man, medium-dark brown skin, round friendly face, reassuring wide smile, low-cut short hair, neat moustache, silver wristwatch, wearing a light-blue button-down oxford shirt with rolled sleeves under a navy knit vest, beige chinos and brown leather shoes",
  creator_junior:
    "Junior, 24-year-old Congolese man from Kinshasa, rich dark-brown skin, athletic lean build, defined jaw, big energetic smile, short bleached-blonde curly top with a low fade, clean-shaven, black wrist sweatband, wearing a blue and red striped football jersey without logos, black football shorts, white socks and black football boots",
  creator_idrissa:
    "Idrissa, 41-year-old Nigerien man, dark brown skin, sturdy build, strong mature face, calm capable smile, closely shaved head, thick black moustache and short goatee, carpenter pencil behind his ear, wearing a rust-orange canvas work jacket over a grey henley shirt, dark work trousers and tan work boots",
  creator_desire:
    "Désiré, 32-year-old Beninese man, medium brown skin, oval face with a defined jaw, trustworthy confident smile, neat short afro tapered on the sides, trimmed short beard, thin black rectangular glasses, wearing a slim-fit navy suit with a white open-collar shirt and no tie, brown leather shoes",
  creator_hamidou:
    "Hamidou, 29-year-old Burkinabè man, dark brown skin, warm round-oval face, huge hearty laugh, short starter locs under a red bandana headwrap, short scruffy beard, wearing a black chef apron over a white t-shirt with a white kitchen towel over one shoulder, black trousers and black sneakers",
  creator_thierry:
    "Thierry, 27-year-old Togolese man, medium-dark brown skin, slim build, sharp angular face, curious bright smile, neat coily high-top with a temple fade, light stubble, wearing a high-visibility yellow safety vest over a navy polo shirt, grey cargo work trousers and black safety boots, white hard hat in hand",
};
