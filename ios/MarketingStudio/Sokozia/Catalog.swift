import Foundation

/// Sokozia catalog: the AI creators, sector templates, art-direction styles and models offered in
/// the app. Same content as the web app (sokozia.com); every image and clip is a real generated
/// file hosted on sokozia.com.
enum Catalog {

    /// Absolute URL of a file published with the web app (public/…).
    static func media(_ path: String) -> String { SokoziaConfig.siteURL.appendingPathComponent(path).absoluteString }

    // MARK: Creators (16)

    private static func c(_ id: String, _ name: String, _ gender: String, _ age: Int, _ style: String, _ languages: [String], _ country: String, _ bio: String, _ featured: Bool, look: String) -> Creator {
        Creator(
            id: id, name: name, gender: gender,
            ageRange: age < 25 ? "18–24" : age < 30 ? "25–29" : age < 35 ? "30–34" : "35+",
            age: age, style: style, languages: languages, country: country,
            avatarURL: media("creators/\(id)/portrait.jpg"),
            sheetURL: media("creators/\(id)/sheet.jpg"),
            introURL: media("creators/\(id)/intro.mp4"),
            look: look, bio: bio, featured: featured
        )
    }

    static let creators: [Creator] = [
        c("creator_maya", "Aïcha", "Femme", 24, "Beauté", ["Français",  "Dioula"], "Côte d'Ivoire", "Routines karité, soins naturels et conseils peau. Ton chaleureux de grande sœur.", true,
          look: "Aïcha, 24-year-old Ivorian woman, warm deep-brown skin with a natural glow, round face, full cheeks, bright wide smile, shoulder-length box braids with a few gold cuffs, small gold hoop earrings, wearing a mustard-yellow wrap top, soft natural makeup"),
        c("creator_jordan", "Kofi", "Homme", 29, "Tech & téléphones", ["Français",  "Anglais"], "Côte d'Ivoire", "Déballages de téléphones et tests honnêtes, du marché d'Adjamé à la boutique.", true,
          look: "Kofi, 29-year-old Ivorian man, dark brown skin, short fade haircut with a sharp line-up, neat short beard, rectangular black glasses, slim build, wearing a navy polo shirt with an orange collar trim, silver wristwatch"),
        c("creator_sofia", "Fatou", "Femme", 27, "Mode wax", ["Français",  "Wolof"], "Sénégal", "Tenues wax, essayages et transitions pour cérémonies et bureau.", true,
          look: "Fatou, 27-year-old Senegalese woman, very dark ebony skin, tall and slender, elegant oval face, high cheekbones, wearing a colorful red-and-blue wax print head wrap (tied high), matching wax print dress, gold statement earrings"),
        c("creator_marcus", "Moussa", "Homme", 31, "Marché & bons plans", ["Français",  "Bambara"], "Mali", "Comparaisons de prix et bons plans du marché, avec beaucoup d'humour.", true,
          look: "Moussa, 31-year-old Malian man, dark brown skin, bald head, full rounded beard, big expressive smile, sturdy build, wearing a light blue embroidered short-sleeve boubou shirt (bazin), cream kufi cap in his hand or on his head"),
        c("creator_priya", "Nneka", "Femme", 26, "Coiffure", ["Anglais",  "Pidgin"], "Nigeria", "Tresses, perruques et soins des cheveux crépus. Démos pas à pas.", false,
          look: "Nneka, 26-year-old Nigerian woman, medium brown skin, heart-shaped face, long knotless braids dyed burgundy, small nose ring, bold winged eyeliner, wearing a black crop top and denim jacket"),
        c("creator_leo", "Chinedu", "Homme", 23, "Humour", ["Anglais",  "Pidgin"], "Nigeria", "Sketchs courts où le produit arrive au bon moment. Ça fait vraiment rire.", false,
          look: "Chinedu, 23-year-old Nigerian man, medium-dark brown skin, playful face, short curly high-top afro, thin mustache, gap-toothed grin, wearing a bright green oversized t-shirt and a white bucket hat"),
        c("creator_hana", "Mariam", "Femme", 30, "Cuisine", ["Français",  "Bambara"], "Mali", "Recettes du quotidien vues du dessus, voix posée et astuces de maman.", false,
          look: "Mariam, 30-year-old Malian woman, deep brown skin, soft round face, calm kind eyes, wearing a patterned indigo bogolan (mud cloth) head scarf and a matching loose kaftan, small silver earrings"),
        c("creator_diego", "Yao", "Homme", 34, "Livraison & quartier", ["Français",  "Dioula"], "Côte d'Ivoire", "Vidéos en extérieur dans les rues d'Abidjan, produits en situation réelle.", false,
          look: "Yao, 34-year-old Ivorian man, dark skin, athletic build, short twists hairstyle, trimmed goatee, wearing a bright orange delivery-style jacket over a white t-shirt, crossbody bag"),
        c("creator_amara", "Grâce", "Femme", 28, "Bien-être", ["Français",  "Lingala"], "RD Congo", "Explications simples sur les ingrédients naturels et les bonnes habitudes.", false,
          look: "Grâce, 28-year-old Congolese woman, rich dark brown skin, oval face, short natural afro (TWA) with defined curls, freckle-free glowing skin, wearing a sage-green linen shirt, wooden bead necklace"),
        c("creator_ethan", "Émeka", "Homme", 25, "Gaming & tech", ["Anglais",  "Pidgin"], "Nigeria", "Tests d'accessoires, montages rythmés et avis sans détour.", false,
          look: "Émeka, 25-year-old Nigerian man, medium brown skin, lean build, short dreadlocks tied up in a small bun, clean-shaven, wearing a black hoodie with purple gaming headphones around his neck"),
        c("creator_chloe", "Khady", "Femme", 22, "Vie étudiante", ["Français",  "Wolof"], "Sénégal", "Angle petit budget et vie de campus à Dakar, très authentique.", false,
          look: "Khady, 22-year-old Senegalese woman, dark skin, youthful round face, big curious eyes, high puff natural hair with a yellow scrunchie, wearing an oversized light-grey university sweatshirt, small backpack"),
        c("creator_noah", "Ibrahima", "Homme", 36, "Vie de famille", ["Français",  "Wolof"], "Sénégal", "Démos pratiques à la maison avec les enfants, une touche d'humour.", false,
          look: "Ibrahima, 36-year-old Senegalese man, dark ebony skin, tall, short cropped hair with a little grey at the temples, short neat beard, warm fatherly smile, wearing a beige kaftan (grand boubou top) with subtle embroidery"),
        c("creator_yuki", "Adjoa", "Femme", 27, "Art & design", ["Français",  "Anglais"], "Côte d'Ivoire", "Mises en scène produit colorées, pagnes et boucles en stop-motion.", false,
          look: "Adjoa, 27-year-old Ivorian woman, light-brown skin, angular face, short platinum-blonde buzz cut, bold geometric earrings, colorful kente-pattern jacket over a black top, creative artist look"),
        c("creator_isabella", "Tshiala", "Femme", 33, "Maison", ["Français",  "Lingala"], "RD Congo", "Produits mis en scène dans la cuisine et la salle de bain, ton rassurant.", false,
          look: "Tshiala, 33-year-old Congolese woman, deep brown skin, gentle smile, shoulder-length straight black wig with bangs, wearing a coral-pink blouse and a patterned apron in the kitchen"),
        c("creator_samuel", "Amina", "Femme", 40, "Commerce & business", ["Français",  "Anglais"], "Cameroun", "Conseils aux commerçantes et avis francs sur le rapport qualité-prix.", false,
          look: "Amina, 40-year-old Cameroonian businesswoman, dark brown skin, confident mature face, short sleek bob haircut, pearl earrings, wearing a tailored emerald-green blazer over a patterned ndop-inspired top"),
        c("creator_zara", "Wanjiru", "Femme", 29, "Luxe & élégance", ["Anglais",  "Swahili"], "Kenya", "Finition éditoriale, révélations lentes et cadrages élégants.", false,
          look: "Wanjiru, 29-year-old Kenyan woman, rich brown skin, long elegant neck, sharp cheekbones, sleek low bun with a middle part, minimal gold jewelry, wearing a champagne satin slip dress with a cream tailored blazer"),
    ]

    // MARK: Templates (24)

    private static func t(_ n: Int, _ title: String, _ description: String, _ category: TemplateCategory, _ platform: SocialPlatform, _ format: String, mode: TemplateMode, style: String, ratio: String, prompt: String, duration: Int?, popular: Bool, uses: Int) -> Template {
        Template(
            id: "tpl_\(n)", title: title, description: description, category: category, platforms: [platform],
            format: format, thumbnailURL: media("templates/tpl_\(n).jpg"), prompt: prompt,
            style: style.isEmpty ? "Product Photography" : style, ratio: ratio, mode: mode,
            durationSec: duration, popular: popular, uses: uses
        )
    }

    static let templates: [Template] = [
        t(1, "Boubou de Tabaski", "Tenue de fête portée par un mannequin, fond cour familiale, lumière de fin d'après-midi.", .waxCouture, .whatsapp, "Statut", mode: .image, style: "Fashion", ratio: "9:16", prompt: "Model wearing an embroidered bazin boubou, festive family courtyard, warm late afternoon light", duration: nil, popular: true, uses: 4210),
        t(2, "Nouvel arrivage de perruques", "Vidéo UGC d'une créatrice qui essaie trois perruques et donne le prix.", .hair, .tiktok, "Vidéo", mode: .ugc, style: "", ratio: "9:16", prompt: "Vidéo UGC d'une créatrice qui essaie trois perruques et donne le prix.", duration: 15, popular: true, uses: 3980),
        t(3, "Rentrée : téléphones et tablettes", "Reel produit rythmé avec prix et facilités de paiement à l'écran.", .electronics, .facebook, "Reel", mode: .video, style: "", ratio: "9:16", prompt: "Reel produit rythmé avec prix et facilités de paiement à l'écran.", duration: 10, popular: true, uses: 3120),
        t(4, "Fiche catalogue pagne wax", "Photo produit nette sur fond clair, prête pour le catalogue WhatsApp Business.", .waxCouture, .whatsapp, "Catalogue", mode: .productShoot, style: "Studio", ratio: "1:1", prompt: "Photo produit nette sur fond clair, prête pour le catalogue WhatsApp Business.", duration: nil, popular: true, uses: 2870),
        t(5, "Beurre de karité naturel", "Packshot doux sur bois et noix de karité, lumière naturelle.", .cosmetics, .instagram, "Image", mode: .productShoot, style: "Studio", ratio: "1:1", prompt: "Packshot doux sur bois et noix de karité, lumière naturelle.", duration: nil, popular: true, uses: 2650),
        t(6, "Menu du maquis", "Plat vu du dessus, poisson braisé et attiéké, vapeur et lumière chaude.", .restaurant, .whatsapp, "Statut", mode: .image, style: "Food", ratio: "9:16", prompt: "Top-down braised fish with attieke and chili, warm maquis lighting, steam", duration: nil, popular: true, uses: 2540),
        t(7, "Coffret fête des mères", "Visuel cadeau avec ruban et message, pour cosmétiques et bijoux.", .cosmetics, .facebook, "Image", mode: .image, style: "Lifestyle", ratio: "4:5", prompt: "Visuel cadeau avec ruban et message, pour cosmétiques et bijoux.", duration: nil, popular: false, uses: 1890),
        t(8, "Boutique de téléphones", "Vitrine de smartphones avec prix en FCFA et bouton Commander sur WhatsApp.", .electronics, .whatsapp, "Statut", mode: .ads, style: "", ratio: "4:5", prompt: "Vitrine de smartphones avec prix en FCFA et bouton Commander sur WhatsApp.", duration: nil, popular: false, uses: 1820),
        t(9, "Promo Tabaski : électroménager", "Carrousel promo pour congélateurs, ventilateurs et télés.", .promo, .facebook, "Carrousel", mode: .ads, style: "", ratio: "4:5", prompt: "Carrousel promo pour congélateurs, ventilateurs et télés.", duration: nil, popular: true, uses: 2230),
        t(10, "Affiche promo de fin d'année", "Affiche A4 imprimable pour la vitrine ou l'étal au marché.", .print, .facebook, "Flyer", mode: .ads, style: "", ratio: "4:5", prompt: "Affiche A4 imprimable pour la vitrine ou l'étal au marché.", duration: nil, popular: false, uses: 1540),
        t(11, "Dattes et jus du Ramadan", "Visuel chaleureux pour la rupture du jeûne : dattes, bissap, gingembre.", .grocery, .whatsapp, "Statut", mode: .image, style: "Food", ratio: "9:16", prompt: "Visuel chaleureux pour la rupture du jeûne : dattes, bissap, gingembre.", duration: nil, popular: false, uses: 1760),
        t(12, "Tresses et coiffures de fête", "Avant/après en carrousel pour un salon de coiffure.", .hair, .instagram, "Carrousel", mode: .ads, style: "", ratio: "4:5", prompt: "Avant/après en carrousel pour un salon de coiffure.", duration: nil, popular: false, uses: 1670),
        t(13, "Note vocale promo", "Message vocal de 20 secondes à transférer dans vos groupes WhatsApp.", .whatsapp, .whatsapp, "Statut", mode: .copy, style: "", ratio: "4:5", prompt: "Message vocal de 20 secondes à transférer dans vos groupes WhatsApp.", duration: nil, popular: true, uses: 2100),
        t(14, "Lookbook tailleur sur mesure", "Série de tenues en pagne portées en extérieur, style street.", .waxCouture, .instagram, "Image", mode: .image, style: "Street", ratio: "4:5", prompt: "Série de tenues en pagne portées en extérieur, style street.", duration: nil, popular: false, uses: 980),
        t(15, "Savon et huiles naturelles", "Vidéo UGC : routine peau avec des produits locaux.", .cosmetics, .tiktok, "Vidéo", mode: .ugc, style: "", ratio: "9:16", prompt: "Vidéo UGC : routine peau avec des produits locaux.", duration: 15, popular: false, uses: 1440),
        t(16, "Plat du jour en vidéo", "Reel court du plat en préparation, prix et adresse à la fin.", .restaurant, .tiktok, "Reel", mode: .video, style: "", ratio: "9:16", prompt: "Reel court du plat en préparation, prix et adresse à la fin.", duration: 10, popular: false, uses: 1130),
        t(17, "Flyer ouverture de boutique", "Flyer A5 à distribuer dans le quartier, avec plan et numéro WhatsApp.", .print, .facebook, "Flyer", mode: .ads, style: "", ratio: "4:5", prompt: "Flyer A5 à distribuer dans le quartier, avec plan et numéro WhatsApp.", duration: nil, popular: false, uses: 720),
        t(18, "Sacs de riz et huile en gros", "Visuel prix de gros pour commerçants et revendeurs.", .grocery, .facebook, "Image", mode: .image, style: "Product Photography", ratio: "1:1", prompt: "Visuel prix de gros pour commerçants et revendeurs.", duration: nil, popular: false, uses: 560),
        t(19, "Témoignage cliente", "Une cliente raconte son achat, façon vidéo UGC, en français ou en langue locale.", .ugc, .facebook, "Vidéo", mode: .ugc, style: "", ratio: "9:16", prompt: "Une cliente raconte son achat, façon vidéo UGC, en français ou en langue locale.", duration: 15, popular: false, uses: 940),
        t(20, "Textes de statut WhatsApp", "Cinq messages courts pour vos statuts de la semaine.", .whatsapp, .whatsapp, "Statut", mode: .copy, style: "", ratio: "4:5", prompt: "Cinq messages courts pour vos statuts de la semaine.", duration: nil, popular: false, uses: 1310),
        t(21, "Accessoires téléphone", "Film produit sur écouteurs, chargeurs et coques, révélation en travelling.", .electronics, .tiktok, "Vidéo", mode: .video, style: "", ratio: "9:16", prompt: "Film produit sur écouteurs, chargeurs et coques, révélation en travelling.", duration: 10, popular: false, uses: 1040),
        t(22, "Démo UGC cosmétique", "Créatrice qui applique le produit et montre le résultat.", .cosmetics, .tiktok, "Vidéo", mode: .ugc, style: "", ratio: "9:16", prompt: "Créatrice qui applique le produit et montre le résultat.", duration: 15, popular: true, uses: 2580),
        t(23, "Livraison de repas", "Story promo livraison avec numéro WhatsApp et zones desservies.", .restaurant, .instagram, "Story", mode: .ads, style: "", ratio: "4:5", prompt: "Story promo livraison avec numéro WhatsApp et zones desservies.", duration: nil, popular: false, uses: 690),
        t(24, "Tenues de Korité", "Visuel d'annonce pour les commandes de tenues avant la fête.", .promo, .whatsapp, "Statut", mode: .image, style: "Fashion", ratio: "9:16", prompt: "Visuel d'annonce pour les commandes de tenues avant la fête.", duration: nil, popular: false, uses: 1480),
    ]

    // MARK: Styles (10)

    static let styles: [SokoziaStyle] = [
        SokoziaStyle(id: "marche-africain", name: "Marché africain", description: "Sur un étal coloré, lumière du jour, ambiance de marché.", product: "Épices", ratio: "4:5", withModel: false, direction: "Place the product on a colorful African market stall, wax fabrics and baskets softly blurred in the background, bright natural daylight, authentic and vibrant."),
        SokoziaStyle(id: "statut-whatsapp", name: "Statut WhatsApp", description: "Vertical, fond vif orange et jaune, place pour le prix.", product: "Smartphone", ratio: "9:16", withModel: false, direction: "Vertical promotional visual: the product centered on a bold orange and yellow gradient background, clean space at the top for a price and at the bottom for a call to action, punchy and modern."),
        SokoziaStyle(id: "studio-ocre", name: "Studio ocre", description: "Packshot propre sur fond ocre, ombres douces.", product: "Parfum", ratio: "1:1", withModel: false, direction: "Clean studio packshot on a warm ochre seamless background, soft shadow, premium commercial lighting, sharp product details."),
        SokoziaStyle(id: "luxe-dore", name: "Luxe doré", description: "Fond sombre, reflets or, rendu haut de gamme.", product: "Bijoux en or", ratio: "4:5", withModel: false, direction: "Luxury product shot on a dark background with golden accents and reflections, dramatic rim light, elegant and premium."),
        SokoziaStyle(id: "pagne-wax", name: "Pagne wax", description: "Vue du dessus sur un pagne wax aux motifs vifs.", product: "Sac en cuir et wax", ratio: "1:1", withModel: false, direction: "Top-down flatlay of the product on a vivid African wax print fabric, soft natural light, colorful and joyful."),
        SokoziaStyle(id: "nature-tropicale", name: "Nature tropicale", description: "Feuilles, soleil, matières naturelles.", product: "Jus de bissap", ratio: "4:5", withModel: false, direction: "Product among tropical leaves, raw wood and natural textures, warm sunlight with leaf shadows, fresh and natural."),
        SokoziaStyle(id: "maison-lifestyle", name: "Maison lifestyle", description: "Dans un intérieur africain moderne et chaleureux.", product: "Perruque", ratio: "4:5", withModel: false, direction: "Lifestyle shot of the product in a modern, warm West African home interior, woven decor and plants, cozy natural light."),
        SokoziaStyle(id: "porte-mannequin", name: "Porté par une créatrice", description: "Une créatrice africaine présente le produit.", product: "Pagnes wax", ratio: "4:5", withModel: true, direction: "A smiling young West African woman holds the product near her face and presents it to the camera, natural light, authentic UGC advertising photo."),
        SokoziaStyle(id: "flyer-promo", name: "Flyer promo", description: "Affiche promo avec espace pour le texte et le prix.", product: "Plat du maquis", ratio: "4:5", withModel: false, direction: "Promotional flyer layout: product large on the right, bold colorful shapes in orange, yellow and green, generous empty space on the left for headline and price, print-ready look."),
        SokoziaStyle(id: "catalogue", name: "Catalogue", description: "Fond blanc, idéal pour WhatsApp Business et marketplaces.", product: "Baskets", ratio: "1:1", withModel: false, direction: "E-commerce catalog photo: product on a pure white background, centered, evenly lit, no props, marketplace ready."),
    ]

    static func style(_ id: String?) -> SokoziaStyle? { styles.first { $0.id == id } }

    // MARK: Sample products (real packshots, usable as a product photo)

    static let sampleProducts: [(name: String, url: String)] = [
        ("Pagne wax", media("products/wax.jpg")), ("Parfum", media("products/parfum.jpg")),
        ("Smartphone", media("products/telephone.jpg")), ("Garba", media("products/garba.jpg")),
        ("Perruque", media("products/perruque.jpg")), ("Baskets", media("products/baskets.jpg")),
        ("Bijoux en or", media("products/bijoux.jpg")), ("Jus de bissap", media("products/bissap.jpg")),
        ("Sac en cuir", media("products/sac.jpg")), ("Épices", media("products/epices.jpg")),
    ]

    // MARK: Copy helpers

    static let hookLibrary: [String] = [
        "Arrêtez de payer ce prix au marché…",
        "Ma cliente m'a envoyé cette photo…",
        "Personne ne vous dit ça avant d'acheter…",
        "POV : tu as enfin trouvé le bon produit, au bon prix.",
        "Le vendeur ne voulait pas que je montre ça.",
        "J'ai testé pendant 7 jours. Voici le résultat.",
        "Si tu es à Abidjan, regarde ça avant ce soir.",
        "3 erreurs que tout le monde fait en achetant ça.",
        "Le produit à 5 000 FCFA qui a remplacé trois autres chez moi.",
        "On m'a posé la question 50 fois dans mes DM, je réponds ici.",
        "Attends de voir la fin.",
        "Livraison aujourd'hui, paiement à la réception. Oui, vraiment.",
    ]

    static let trendingFormats: [(title: String, subtitle: String, icon: String)] = [
        ("Statut WhatsApp", "9:16 · image ou vidéo", "message"),
        ("Vidéo UGC", "9:16 · 15 s", "person.wave.2"),
        ("Fiche catalogue", "1:1 · fond blanc", "square.grid.2x2"),
        ("Flyer promo", "A4 · imprimable", "doc.richtext"),
        ("Reel produit", "9:16 · 10 s", "play.rectangle"),
    ]
}

/// Art direction built on Marketing Studio (keeps the merchant's product identical).
/// Each has a reference image shown on a different product.
struct SokoziaStyle: Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    /// Product shown in the reference image.
    let product: String
    let ratio: String
    let withModel: Bool
    /// Art direction appended to the prompt.
    let direction: String
    var imageURL: String { Catalog.media("styles/\(id).jpg") }
}
