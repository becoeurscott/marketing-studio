import Foundation

/// Centralized fictional seed data. Every count meets or exceeds the SPEC minimums.
/// Images come from picsum (seeded, deterministic) and avatars from pravatar.
enum MockData {

    static func image(_ slug: String, w: Int = 800, h: Int = 1000) -> String {
        "https://picsum.photos/seed/\(slug)/\(w)/\(h)"
    }
    static func avatar(_ n: Int) -> String { "https://i.pravatar.cc/300?img=\(n)" }

    // MARK: User / Brand / Workspace

    static let user = User(
        id: "user_alex",
        name: "Alex Carter",
        email: "alex@northstarcreative.co",
        company: "Northstar Creative",
        role: "Fondateur",
        avatarURL: avatar(12),
        plan: .creator
    )

    static let brandVoice = BrandVoice(
        tone: "Luxury",
        writingStyle: "Phrases courtes. Confiant. Jamais trop formel.",
        keywords: ["éclat", "clean", "quotidien", "illuminateur", "rituel"],
        avoid: ["miracle", "anti-âge", "bon marché", "jargon clinique"]
    )

    static let brand = Brand(
        id: "brand_luma",
        name: "Luma Skin",
        logoURL: image("luma-logo", w: 600, h: 600),
        iconURL: image("luma-icon", w: 300, h: 300),
        colors: ["#F4E9E1", "#1A1A1A", "#D9A66B", "#FFFFFF"],
        fonts: ["Inter", "Playfair Display"],
        website: "https://lumaskin.co",
        description: "Sérum éclat à la vitamine C conçu pour les routines de soin quotidiennes.",
        industry: "Beauté",
        audience: "Femmes et hommes de 20 à 35 ans qui veulent des soins simples et efficaces.",
        voice: brandVoice,
        assetIds: ["asset_logo_primary", "asset_logo_icon", "asset_product_hero"]
    )

    static let members: [WorkspaceMember] = [
        WorkspaceMember(id: "mem_alex", name: "Alex Carter", email: "alex@northstarcreative.co", role: .owner, avatarURL: avatar(12), joinedAt: .daysAgo(240)),
        WorkspaceMember(id: "mem_sarah", name: "Sarah Nguyen", email: "sarah@northstarcreative.co", role: .admin, avatarURL: avatar(47), joinedAt: .daysAgo(180)),
        WorkspaceMember(id: "mem_michael", name: "Michael Okafor", email: "michael@northstarcreative.co", role: .editor, avatarURL: avatar(33), joinedAt: .daysAgo(90)),
    ]

    // MARK: Projects (12)

    static let projects: [Project] = {
        let rows: [(String, String, String, ProjectStatus, Double)] = [
            ("proj_luma_summer", "Lancement d'été Luma Skin", "Campagne de lancement du sérum Luma Glow sur Instagram, TikTok et Facebook.", .active, 1),
            ("proj_summer_skincare", "Campagne soins d'été", "Visuels de soins saisonniers avec lumière chaude et décors au bord de la piscine.", .active, 3),
            ("proj_urban_coffee", "Lancement Urban Coffee", "Contenus de lancement style street pour une gamme de cold brew.", .active, 6),
            ("proj_fitness", "Campagne fitness inspirée de Nike", "Visuels fitness pleins d'énergie avec une typographie audacieuse.", .active, 9),
            ("proj_watch", "Campagne montre de luxe", "Photos produit éditoriales sombres pour une montre haut de gamme.", .active, 14),
            ("proj_ugc_ads", "Pubs UGC nouveau produit", "Pubs UGC portées par des créateurs pour tester quatre accroches.", .active, 18),
            ("proj_gift_guide", "Guide cadeaux des fêtes", "Guide cadeaux en carrousels sur trois gammes de produits.", .active, 25),
            ("proj_home_office", "Collection bureau minimaliste", "Visuels lifestyle apaisants pour une marque d'accessoires de bureau.", .active, 31),
            ("proj_vegan_snack", "Teaser snack vegan", "Reels teasers ludiques pour le lancement d'un snack végétal.", .active, 40),
            ("proj_headphones", "Révélation casque studio", "Révélation tech avec éclairage néon et détails en macro.", .archived, 62),
            ("proj_fragrance", "Histoire parfum de printemps", "Séquence au format story pour une maison de parfum de niche.", .archived, 88),
            ("proj_black_friday", "Sprint Black Friday", "Pubs axées sur l'urgence et stories avec compte à rebours.", .active, 120),
        ]
        return rows.map { id, name, desc, status, days in
            Project(
                id: id, name: name, description: desc, brandId: "brand_luma",
                thumbnailURL: image(id, w: 800, h: 600), status: status,
                createdAt: .daysAgo(days + 2), updatedAt: .daysAgo(days)
            )
        }
    }()

    // MARK: Assets (56)

    static let assets: [Asset] = {
        var list: [Asset] = []
        let imageNames = [
            "Sérum photo principale", "Sérum sur marbre", "Flacon à l'heure dorée", "Flatlay bord de piscine", "Étagère de salle de bain",
            "Pipette en macro", "Mannequin appliquant le sérum", "Éclaboussure d'ingrédients", "Décor blanc minimaliste", "Lifestyle au coucher du soleil",
            "Canette cold brew dans la rue", "Café versé en macro", "Mains de barista", "Montre au poignet", "Montre éditorial sombre",
            "Cadran de montre en macro", "Sneaker flou de mouvement", "Sprint en salle", "Trail plan large", "Bureau le matin",
            "Carnet et lampe", "Sachet de snack ludique", "Ingrédients du snack", "Casque néon", "Casque en macro",
            "Flacon de parfum brume", "Pile de coffrets cadeaux", "Carrousel diapo 1", "Carrousel diapo 2", "Carrousel diapo 3",
        ]
        let projectCycle = projects.map { $0.id }
        for (i, name) in imageNames.enumerated() {
            let pid = i < 10 ? "proj_luma_summer" : projectCycle[i % projectCycle.count]
            list.append(Asset(
                id: "asset_img_\(i + 1)", name: name, kind: .image,
                imageURL: image("img-\(i + 1)"), projectId: pid,
                favorite: [0, 2, 5, 13, 23].contains(i), createdAt: .daysAgo(Double(i) * 1.3),
                tags: i < 10 ? ["serum", "beauty"] : ["lifestyle"], width: 1600, height: 2000, durationSeconds: nil
            ))
        }
        let videoNames = ["Accroche UGC : Maya", "Accroche UGC : Jordan", "Zoom lent sérum", "Orbite montre", "Travelling avant café", "Travelling salle de sport", "Révélation snack", "Déballage casque", "Story : 3 étapes", "Démo produit 15 s"]
        for (i, name) in videoNames.enumerated() {
            list.append(Asset(
                id: "asset_vid_\(i + 1)", name: name, kind: .video,
                imageURL: image("vid-\(i + 1)", w: 720, h: 1280), projectId: projectCycle[i % 6],
                favorite: i == 0 || i == 3, createdAt: .daysAgo(Double(i) * 2 + 0.5),
                tags: ["video"], width: 1080, height: 1920, durationSeconds: [15, 10, 5, 10, 5, 15, 10, 15, 15, 15][i]
            ))
        }
        let audioNames = ["Fond pop entraînant", "Boucle de piano douce", "Ambiance lo-fi", "Voix off : Maya prise 2", "Pack de whoosh"]
        for (i, name) in audioNames.enumerated() {
            list.append(Asset(
                id: "asset_aud_\(i + 1)", name: name, kind: .audio,
                imageURL: image("aud-\(i + 1)", w: 800, h: 800), projectId: nil,
                favorite: false, createdAt: .daysAgo(Double(i) * 4 + 3),
                tags: ["audio"], width: 0, height: 0, durationSeconds: [30, 60, 90, 12, 5][i]
            ))
        }
        list.append(Asset(id: "asset_logo_primary", name: "Logo principal Luma", kind: .logo, imageURL: image("luma-logo", w: 600, h: 600), projectId: nil, favorite: true, createdAt: .daysAgo(200), tags: ["brand"], width: 2000, height: 2000, durationSeconds: nil))
        list.append(Asset(id: "asset_logo_icon", name: "Icône Luma", kind: .logo, imageURL: image("luma-icon", w: 300, h: 300), projectId: nil, favorite: false, createdAt: .daysAgo(200), tags: ["brand"], width: 1024, height: 1024, durationSeconds: nil))
        list.append(Asset(id: "asset_logo_mono", name: "Logo mono Luma", kind: .logo, imageURL: image("luma-mono", w: 600, h: 600), projectId: nil, favorite: false, createdAt: .daysAgo(199), tags: ["brand"], width: 2000, height: 2000, durationSeconds: nil))
        list.append(Asset(id: "asset_product_hero", name: "Packshot sérum Luma Glow", kind: .brand, imageURL: image("luma-packshot"), projectId: nil, favorite: true, createdAt: .daysAgo(150), tags: ["brand", "product"], width: 2400, height: 3000, durationSeconds: nil))
        list.append(Asset(id: "asset_brand_palette", name: "Planche palette de marque", kind: .brand, imageURL: image("luma-palette", w: 800, h: 600), projectId: nil, favorite: false, createdAt: .daysAgo(150), tags: ["brand"], width: 1600, height: 1200, durationSeconds: nil))
        list.append(Asset(id: "asset_brand_type", name: "Fiche typographique", kind: .brand, imageURL: image("luma-type", w: 800, h: 600), projectId: nil, favorite: false, createdAt: .daysAgo(149), tags: ["brand"], width: 1600, height: 1200, durationSeconds: nil))
        let exportNames = ["Pack lancement d'été (PNG)", "Lot de pubs TikTok (MP4)", "Carrousel guide cadeaux (PDF)", "Éditorial montre (JPG)", "Série de stories 9:16 (PNG)"]
        for (i, name) in exportNames.enumerated() {
            list.append(Asset(id: "asset_exp_\(i + 1)", name: name, kind: .export, imageURL: image("exp-\(i + 1)", w: 800, h: 800), projectId: projectCycle[i], favorite: false, createdAt: .daysAgo(Double(i) * 5 + 1), tags: ["export"], width: 0, height: 0, durationSeconds: nil))
        }
        return list
    }()

    // MARK: Templates (24)

    static let templates: [Template] = {
        let rows: [(String, TemplateCategory, [SocialPlatform], String, String, String)] = [
            ("Lancement produit de luxe", .productAds, [.instagram, .facebook], "Image", "Luxury", "4:5"),
            ("Pub UGC de 15 secondes", .ugc, [.tiktok, .instagram], "Video", "UGC", "9:16"),
            ("Reel nouveau produit", .socialMedia, [.instagram], "Reel", "Lifestyle", "9:16"),
            ("Campagne Black Friday", .ecommerce, [.facebook, .instagram, .google], "Carousel", "Bold", "1:1"),
            ("Story beauté clean", .beauty, [.instagram], "Story", "Minimal", "9:16"),
            ("Soin avant / après", .beauty, [.tiktok, .instagram], "Video", "UGC", "9:16"),
            ("Sortie streetwear", .fashion, [.instagram, .tiktok], "Image", "Street", "4:5"),
            ("Lookbook éditorial", .fashion, [.pinterest, .instagram], "Carousel", "Editorial", "4:5"),
            ("Photo phare du menu", .food, [.instagram, .facebook], "Image", "Food", "1:1"),
            ("Short recette", .food, [.youtube, .tiktok], "Short", "Lifestyle", "9:16"),
            ("Déballage de gadget", .technology, [.youtube, .tiktok], "Video", "Tech", "16:9"),
            ("Focus fonctionnalité", .technology, [.instagram, .google], "Image", "Studio", "1:1"),
            ("Reel portes ouvertes", .realEstate, [.instagram, .facebook], "Reel", "Cinematic", "9:16"),
            ("Carrousel d'annonce", .realEstate, [.facebook, .instagram], "Carousel", "Editorial", "4:5"),
            ("Promo défi 30 jours", .fitness, [.tiktok, .instagram], "Video", "Commercial", "9:16"),
            ("Story motivation sport", .fitness, [.instagram], "Story", "Cinematic", "9:16"),
            ("Pub témoignage", .ugc, [.facebook, .youtube], "Video", "UGC", "1:1"),
            ("Histoire du fondateur", .ugc, [.tiktok, .instagram], "Video", "Authentic", "9:16"),
            ("Compte à rebours vente flash", .ecommerce, [.instagram, .facebook], "Story", "Urgent", "9:16"),
            ("Pub offre groupée", .ecommerce, [.google, .facebook], "Image", "Studio", "1:1"),
            ("Produit sur marbre", .productAds, [.instagram, .pinterest], "Image", "Product Photography", "4:5"),
            ("Ingrédient en macro", .productAds, [.instagram], "Image", "Editorial", "1:1"),
            ("Carrousel conseils de la semaine", .socialMedia, [.instagram], "Carousel", "Minimal", "1:1"),
            ("Coulisses", .socialMedia, [.tiktok, .youtube], "Short", "Authentic", "9:16"),
        ]
        return rows.enumerated().map { i, r in
            Template(
                id: "tpl_\(i + 1)", title: r.0,
                description: "Un modèle \(r.3.lowercased()) prêt à l'emploi pour les marques de la catégorie \(r.1.title.lowercased()). Changez le produit, ajustez le texte et générez en quelques secondes.",
                category: r.1, platforms: r.2, format: r.3,
                thumbnailURL: image("tpl-\(i + 1)"),
                prompt: "Créez un visuel \(r.3.lowercased()) de style \(r.4.lowercased()) pour un produit premium, avec un éclairage net et un point focal clair.",
                style: r.4, ratio: r.5
            )
        }
    }()

    // MARK: Creators (16)

    static let creators: [Creator] = {
        let rows: [(String, String, String, Int, String, [String], Int)] = [
            ("Maya", "Femme", "20–26", 24, "Lifestyle", ["Anglais", "Espagnol"], 5),
            ("Jordan", "Homme", "26–32", 29, "Fitness", ["Anglais"], 11),
            ("Sofia", "Femme", "24–30", 27, "Beauté", ["Anglais", "Italien"], 9),
            ("Marcus", "Homme", "28–34", 31, "Tech", ["Anglais", "Allemand"], 14),
            ("Priya", "Femme", "24–30", 26, "Bien-être", ["Anglais", "Hindi"], 20),
            ("Leo", "Homme", "20–26", 23, "Streetwear", ["Anglais", "Français"], 15),
            ("Hana", "Femme", "28–34", 30, "Maison & déco", ["Anglais", "Japonais"], 25),
            ("Diego", "Homme", "30–36", 33, "Cuisine", ["Espagnol", "Anglais"], 17),
            ("Amara", "Femme", "22–28", 25, "Mode", ["Anglais"], 26),
            ("Ethan", "Homme", "24–30", 27, "Jeux vidéo", ["Anglais"], 18),
            ("Chloe", "Femme", "26–32", 28, "Parentalité", ["Anglais", "Français"], 32),
            ("Noah", "Homme", "34–40", 36, "Finance", ["Anglais"], 53),
            ("Isabella", "Femme", "20–26", 22, "Beauté", ["Anglais", "Portugais"], 44),
            ("Kai", "Homme", "22–28", 24, "Voyage", ["Anglais", "Coréen"], 59),
            ("Zara", "Femme", "30–36", 32, "Luxe", ["Anglais", "Arabe"], 45),
            ("Tomas", "Homme", "26–32", 29, "Plein air", ["Anglais", "Tchèque"], 60),
        ]
        return rows.map { r in
            Creator(
                id: "creator_\(r.0.lowercased())", name: r.0, gender: r.1, ageRange: r.2, age: r.3,
                style: r.4, languages: r.5, avatarURL: avatar(r.6),
                bio: "\(r.0) est \(r.1 == "Femme" ? "une créatrice IA fictive spécialisée" : "un créateur IA fictif spécialisé") dans les contenus \(r.4.lowercased()), avec un jeu naturel et à l'aise face caméra."
            )
        }
    }()

    // MARK: Generations (32)

    static let generations: [Generation] = {
        let prompts: [(GenerationKind, String, GenerationStatus)] = [
            (.image, "Sérum Luma Glow sur marbre mouillé, heure dorée, ombres douces", .completed),
            (.image, "Flacon de sérum flottant avec des tranches d'agrumes, éclairage studio", .completed),
            (.video, "Zoom lent sur le sérum avec rayons de lumière, 10 s, cinématique", .completed),
            (.copy, "Légende Instagram pour le lancement d'été, ton luxe", .completed),
            (.ad, "Pub TikTok : sérum premium, femmes 20–35 ans, -20 % au lancement", .completed),
            (.image, "Canette de cold brew dans une rue pluvieuse la nuit, reflets néon", .completed),
            (.image, "Montre au poignet, éditorial sombre, projecteur unique", .completed),
            (.video, "UGC : Maya explique sa routine matinale en 3 étapes", .completed),
            (.copy, "Description produit du sérum Luma Glow", .completed),
            (.image, "Sneaker en l'air sur béton, flou de mouvement, audacieux", .completed),
            (.ad, "Carrousel Instagram : guide cadeaux des fêtes, trois gammes", .completed),
            (.image, "Bureau à la lumière du matin, minimaliste, chaleureux", .completed),
            (.video, "Plan en orbite autour du casque, contre-jour néon, 5 s", .completed),
            (.copy, "10 accroches pour des pubs UGC de soins", .completed),
            (.image, "Sachet de snack vegan avec confettis, ludique, lumineux", .completed),
            (.image, "Flacon de parfum avec brume, ambiance sombre, macro", .completed),
            (.video, "Travelling avant sur café versé, caméra à l'épaule, 5 s", .processing),
            (.image, "Sérum dans une salle de bain luxueuse, éclairage softbox, gros plan", .completed),
            (.ad, "Pub Facebook : offre groupée, CTA Acheter", .completed),
            (.copy, "E-mail pour le sprint Black Friday, ton urgent", .completed),
            (.image, "Coffrets cadeaux empilés, festif, studio", .completed),
            (.video, "Story : trois étapes vers l'éclat, 15 s, UGC", .queued),
            (.image, "Pipette de sérum en macro avec gouttes de vitamine C", .completed),
            (.image, "Café versé en macro avec crema, style culinaire", .completed),
            (.copy, "Légende TikTok pour un reel défi sportif", .completed),
            (.ad, "Display Google : montre de luxe, hommes 25–40 ans", .completed),
            (.image, "Mannequin appliquant le sérum, lumière naturelle, lifestyle", .completed),
            (.video, "Travelling : trail à l'aube, 15 s", .completed),
            (.image, "Casque en macro sur velours, éclairage dramatique", .failed),
            (.copy, "Texte de landing page pour l'histoire du parfum", .completed),
            (.image, "Flatlay bord de piscine avec sérum et lunettes de soleil", .completed),
            (.ad, "Épingle Pinterest : ingrédient en macro, minimaliste", .completed),
        ]
        let projectCycle = projects.map { $0.id }
        return prompts.enumerated().map { i, p in
            let thumbs: [String]
            switch p.0 {
            case .image, .ad: thumbs = (1...4).map { image("gen-\(i + 1)-\($0)") }
            case .video: thumbs = [image("gen-\(i + 1)-v", w: 720, h: 1280)]
            case .copy: thumbs = []
            }
            return Generation(
                id: "gen_\(i + 1)", kind: p.0, prompt: p.1, status: p.2, thumbnails: thumbs,
                projectId: i < 6 ? "proj_luma_summer" : projectCycle[i % projectCycle.count],
                model: p.0 == .video ? "Motion v1" : (p.0 == .copy ? "Writer v3" : "Studio v2"),
                creditsSpent: p.0.creditCost, createdAt: .daysAgo(Double(i) * 0.8),
                resultText: p.0 == .copy ? "Découvrez votre éclat au quotidien. Le sérum Luma Glow illumine, lisse et protège — en une seule étape. Formule clean. Vrais résultats." : nil
            )
        }
    }()

    // MARK: Campaigns (10)

    static let campaigns: [Campaign] = {
        let rows: [(String, String, String?, CampaignObjective, String, [SocialPlatform], [ContentFormat], CampaignStatus, Double)] = [
            ("camp_luma_summer", "Lancement d'été Luma Glow", "proj_luma_summer", .sales, "Femmes et hommes 20–35 ans, curieux de soins", [.instagram, .tiktok, .facebook], [.productPhotos, .ugc, .videoAds, .stories, .carousels], .ready, 1),
            ("camp_skincare_seasonal", "Offensive soins d'été", "proj_summer_skincare", .awareness, "Femmes 25–40 ans", [.instagram, .facebook], [.productPhotos, .stories], .live, 4),
            ("camp_coffee", "Urban Coffee Cold Brew", "proj_urban_coffee", .engagement, "Citadins pendulaires 22–35 ans", [.tiktok, .instagram], [.ugc, .videoAds], .draft, 7),
            ("camp_fitness", "Défi sprint 30 jours", "proj_fitness", .leads, "Débutants en fitness 20–30 ans", [.instagram, .youtube, .tiktok], [.videoAds, .stories], .scheduled, 10),
            ("camp_watch", "Éditorial horlogerie", "proj_watch", .sales, "Hommes 25–40 ans, acheteurs premium", [.instagram, .facebook, .google], [.productPhotos, .carousels], .live, 15),
            ("camp_ugc", "Test d'accroches UGC", "proj_ugc_ads", .sales, "Large, acheteurs similaires", [.tiktok, .facebook], [.ugc], .completed, 20),
            ("camp_gift", "Guide cadeaux des fêtes", "proj_gift_guide", .sales, "Acheteurs de cadeaux 25–45 ans", [.instagram, .facebook, .pinterest], [.carousels, .stories], .draft, 26),
            ("camp_office", "Collection bureau zen", "proj_home_office", .awareness, "Télétravailleurs 25–40 ans", [.instagram, .pinterest], [.productPhotos], .scheduled, 32),
            ("camp_snack", "Semaine teaser snack", "proj_vegan_snack", .engagement, "Grignoteurs de la génération Z", [.tiktok], [.ugc, .videoAds], .completed, 41),
            ("camp_black_friday", "Sprint Black Friday", "proj_black_friday", .sales, "Anciens clients + paniers abandonnés", [.facebook, .instagram, .google], [.videoAds, .stories, .carousels], .completed, 121),
        ]
        return rows.enumerated().map { i, r in
            let assetIds = assets.filter { $0.projectId == r.2 && ($0.kind == .image || $0.kind == .video) }.map { $0.id }
            let items: [CalendarItem] = (0..<6).map { d in
                CalendarItem(
                    id: "cal_\(i)_\(d)", title: ["Teaser de lancement", "Post phare", "Accroche UGC", "Séquence story", "Carrousel", "Pub de reciblage"][d],
                    date: .daysFromNow(Double(d * 2 - 3)),
                    platform: r.5[d % r.5.count], format: ["Reel", "Image", "Video", "Story", "Carousel", "Video"][d],
                    status: d < 2 ? .published : (d < 4 ? .scheduled : .draft),
                    assetId: assetIds.indices.contains(d) ? assetIds[d] : nil
                )
            }
            let variations: [AdVariation] = ["A", "B", "C", "D"].enumerated().map { vi, letter in
                AdVariation(
                    id: "var_\(i)_\(letter)", label: "Création \(letter)",
                    visualURL: image("var-\(i)-\(letter)"),
                    headline: ["L'éclat commence ici.", "Votre peau, sublimée.", "Une goutte. De vrais résultats.", "Découvrez le sérum du quotidien."][vi],
                    primaryText: ["Sérum éclat à la vitamine C pour toutes les routines. Clean, léger, efficace.", "Une peau plus lumineuse en 14 jours ou remboursé. Essayez Luma Glow.", "Oubliez la routine en 10 étapes. Un seul sérum fait tout.", "Adopté par plus de 40 000 personnes qui voulaient des soins plus simples."][vi],
                    cta: ["Acheter", "En savoir plus", "Profiter de -20 %", "Essayer"][vi],
                    platform: r.5[vi % r.5.count]
                )
            }
            return Campaign(
                id: r.0, name: r.1, projectId: r.2, objective: r.3, audience: r.4,
                platforms: r.5, formats: r.6, status: r.7,
                assetIds: assetIds, calendarItems: items, variations: variations,
                createdAt: .daysAgo(r.8)
            )
        }
    }()

    // MARK: Notifications (22)

    static let notifications: [AppNotification] = {
        let rows: [(NotificationKind, String, String, Double, Bool)] = [
            (.generationComplete, "Génération terminée", "4 photos produit du sérum Luma Glow sont prêtes.", 0.02, false),
            (.campaignReady, "Campagne prête", "Lancement d'été Luma Glow contient 12 ressources et 4 variantes de pub.", 0.1, false),
            (.exportComplete, "Export terminé", "Pack lancement d'été (PNG) est prêt à être téléchargé.", 0.3, false),
            (.creditsLow, "Crédits bientôt épuisés", "Il vous reste 1 250 crédits. Rechargez avant votre prochain lot de vidéos.", 0.6, true),
            (.newTemplate, "Nouveau modèle", "Soin avant / après a été ajouté à Beauté.", 1, true),
            (.projectShared, "Projet partagé", "Sarah a partagé Lancement Urban Coffee avec vous.", 1.4, true),
            (.generationComplete, "Vidéo générée", "Le rendu de Zoom lent sur le sérum (10 s) est terminé.", 2, true),
            (.generationComplete, "Texte prêt", "La légende Instagram du lancement d'été est prête.", 2.3, true),
            (.campaignReady, "Campagne programmée", "Défi sprint 30 jours est programmé pour la semaine prochaine.", 3, true),
            (.exportComplete, "Export terminé", "Lot de pubs TikTok (MP4) est prêt.", 3.5, true),
            (.newTemplate, "Nouveau modèle", "Histoire du fondateur ajouté à UGC.", 4, true),
            (.projectShared, "Projet partagé", "Michael a partagé Guide cadeaux des fêtes avec vous.", 5, true),
            (.generationComplete, "Génération terminée", "Les photos de rue cold brew sont prêtes.", 6, true),
            (.creditsLow, "Crédits rechargés", "Votre forfait Créateur a ajouté 1 500 crédits.", 7, true),
            (.generationComplete, "Échec de la génération", "Casque en macro a échoué. Touchez pour réessayer.", 8, true),
            (.campaignReady, "Campagne terminée", "Test d'accroches UGC s'est terminé avec 4 accroches gagnantes.", 9, true),
            (.exportComplete, "Export terminé", "Carrousel guide cadeaux (PDF) est prêt.", 11, true),
            (.newTemplate, "Nouveau modèle", "Reel portes ouvertes ajouté à Immobilier.", 12, true),
            (.generationComplete, "Génération terminée", "La série éditoriale montre est prête.", 14, true),
            (.projectShared, "Accès modifié", "Michael est désormais Éditeur sur Sokozia.", 16, true),
            (.generationComplete, "Génération terminée", "La série lifestyle bureau est prête.", 20, true),
            (.campaignReady, "Campagne prête", "Les ressources de Collection bureau zen sont prêtes à être vérifiées.", 24, true),
        ]
        return rows.enumerated().map { i, r in
            AppNotification(id: "notif_\(i + 1)", kind: r.0, title: r.1, message: r.2, createdAt: .daysAgo(r.3), read: r.4, routeHint: nil)
        }
    }()

    // MARK: Credits

    static let startingCredits = 1_250

    static let transactions: [CreditTransaction] = [
        CreditTransaction(id: "tx_1", amount: 1500, reason: "Crédits mensuels du forfait Créateur", createdAt: .daysAgo(7)),
        CreditTransaction(id: "tx_2", amount: -40, reason: "Génération d'images × 4", createdAt: .daysAgo(6)),
        CreditTransaction(id: "tx_3", amount: -50, reason: "Génération vidéo (10 s)", createdAt: .daysAgo(5.5)),
        CreditTransaction(id: "tx_4", amount: -15, reason: "Agrandissement", createdAt: .daysAgo(5)),
        CreditTransaction(id: "tx_5", amount: -20, reason: "Variantes de pub × 4", createdAt: .daysAgo(4)),
        CreditTransaction(id: "tx_6", amount: -40, reason: "Shooting produit × 4", createdAt: .daysAgo(3)),
        CreditTransaction(id: "tx_7", amount: -50, reason: "Vidéo UGC", createdAt: .daysAgo(2.2)),
        CreditTransaction(id: "tx_8", amount: -10, reason: "Génération d'image", createdAt: .daysAgo(1.5)),
        CreditTransaction(id: "tx_9", amount: -15, reason: "Agrandissement", createdAt: .daysAgo(1)),
        CreditTransaction(id: "tx_10", amount: -10, reason: "Rédaction × 5", createdAt: .daysAgo(0.5)),
    ]

    // MARK: Copy / Hooks

    static let hookLibrary: [String] = [
        "Personne ne vous dit ça sur les sérums à la vitamine C...",
        "Vous l'utilisez mal depuis toujours.",
        "POV : vous avez enfin trouvé le sérum qui marche vraiment.",
        "Arrêtez de scroller si votre teint est terne dès 15 h.",
        "J'ai remplacé ma routine en 10 étapes par ce seul flacon.",
        "Le sérum à 48 € dont les dermatologues ne parlent pas.",
        "C'est le signe qu'il vous faut pour corriger vos soins en 14 jours.",
        "Trois gouttes. C'est tout. C'est ça, la routine.",
        "Pourquoi tout le monde a soudain une peau de verre ?",
        "Je l'ai testé pendant 30 jours pour que vous n'ayez pas à le faire.",
        "Attendez de voir l'avant/après...",
        "Si vous n'achetez qu'un seul soin cette année...",
    ]

    static let assistantReplies: [String] = [
        "Je peux le créer. Voulez-vous commencer par des photos produit, un script UGC ou la campagne complète ?",
        "D'après votre voix de marque (luxe, phrases courtes), voici une piste : décor minimaliste, lumière d'heure dorée, un seul angle phare.",
        "Je recommande le 4:5 pour le fil Instagram et le 9:16 pour les Stories et TikTok. Vous voulez les deux ?",
        "Brouillon prêt. Je l'ai enregistré dans votre projet — vous pouvez l'affiner dans l'éditeur.",
    ]

    static let trendingFormats: [(title: String, subtitle: String, icon: String)] = [
        ("Vidéo accroche UGC", "9:16 · 15 s", "person.wave.2"),
        ("Reel produit", "9:16 · 10 s", "play.rectangle"),
        ("Carrousel", "4:5 · 5 diapos", "rectangle.stack"),
        ("Séquence story", "9:16 · 3 images", "rectangle.portrait.on.rectangle.portrait"),
        ("Avant / Après", "1:1 · image", "arrow.left.arrow.right"),
    ]
}
