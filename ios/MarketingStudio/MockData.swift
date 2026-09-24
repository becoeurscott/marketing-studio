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
        role: "Founder",
        avatarURL: avatar(12),
        plan: .creator
    )

    static let brandVoice = BrandVoice(
        tone: "Luxury",
        writingStyle: "Short sentences. Confident. Never overly formal.",
        keywords: ["glow", "clean", "everyday", "brightening", "ritual"],
        avoid: ["miracle", "anti-aging", "cheap", "clinical jargon"]
    )

    static let brand = Brand(
        id: "brand_luma",
        name: "Luma Skin",
        logoURL: image("luma-logo", w: 600, h: 600),
        iconURL: image("luma-icon", w: 300, h: 300),
        colors: ["#F4E9E1", "#1A1A1A", "#D9A66B", "#FFFFFF"],
        fonts: ["Inter", "Playfair Display"],
        website: "https://lumaskin.co",
        description: "Vitamin C brightening serum designed for everyday skincare routines.",
        industry: "Beauty",
        audience: "Women and men 20–35 who want simple, effective skincare.",
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
            ("proj_luma_summer", "Luma Skin Summer Launch", "Launch campaign for Luma Glow Serum across Instagram, TikTok and Facebook.", .active, 1),
            ("proj_summer_skincare", "Summer Skincare Campaign", "Seasonal skincare visuals with warm lighting and poolside sets.", .active, 3),
            ("proj_urban_coffee", "Urban Coffee Launch", "Street-style launch content for a cold brew line.", .active, 6),
            ("proj_fitness", "Nike-Inspired Fitness Campaign", "High-energy fitness visuals with bold typography.", .active, 9),
            ("proj_watch", "Luxury Watch Campaign", "Dark editorial product shots for a premium timepiece.", .active, 14),
            ("proj_ugc_ads", "New Product UGC Ads", "Creator-led UGC ads testing four hooks.", .active, 18),
            ("proj_gift_guide", "Holiday Gift Guide", "Carousel-first gift guide across three product lines.", .active, 25),
            ("proj_home_office", "Minimal Home Office Drop", "Calm lifestyle stills for a desk accessories brand.", .active, 31),
            ("proj_vegan_snack", "Vegan Snack Teaser", "Playful teaser reels for a plant-based snack launch.", .active, 40),
            ("proj_headphones", "Studio Headphones Reveal", "Tech reveal with neon lighting and macro details.", .archived, 62),
            ("proj_fragrance", "Spring Fragrance Story", "Story-format sequence for a niche fragrance house.", .archived, 88),
            ("proj_black_friday", "Black Friday Sprint", "Urgency-driven ads and countdown stories.", .active, 120),
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
            "Serum hero shot", "Serum on marble", "Golden hour bottle", "Poolside flatlay", "Bathroom shelf",
            "Macro dropper", "Model applying serum", "Ingredient splash", "Minimal white set", "Sunset lifestyle",
            "Cold brew can street", "Coffee pour macro", "Barista hands", "Watch on wrist", "Watch dark editorial",
            "Watch macro dial", "Sneaker motion blur", "Gym sprint", "Trail run wide", "Desk setup morning",
            "Notebook and lamp", "Snack bag playful", "Snack ingredients", "Headphones neon", "Headphones macro",
            "Fragrance bottle mist", "Gift box stack", "Carousel slide 1", "Carousel slide 2", "Carousel slide 3",
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
        let videoNames = ["UGC hook: Maya", "UGC hook: Jordan", "Slow zoom serum", "Orbit watch", "Coffee push-in", "Gym tracking shot", "Snack reveal", "Headphones unboxing", "Story: 3 steps", "Product demo 15s"]
        for (i, name) in videoNames.enumerated() {
            list.append(Asset(
                id: "asset_vid_\(i + 1)", name: name, kind: .video,
                imageURL: image("vid-\(i + 1)", w: 720, h: 1280), projectId: projectCycle[i % 6],
                favorite: i == 0 || i == 3, createdAt: .daysAgo(Double(i) * 2 + 0.5),
                tags: ["video"], width: 1080, height: 1920, durationSeconds: [15, 10, 5, 10, 5, 15, 10, 15, 15, 15][i]
            ))
        }
        let audioNames = ["Upbeat pop bed", "Soft piano loop", "Lo-fi ambient", "Voiceover: Maya take 2", "Whoosh pack"]
        for (i, name) in audioNames.enumerated() {
            list.append(Asset(
                id: "asset_aud_\(i + 1)", name: name, kind: .audio,
                imageURL: image("aud-\(i + 1)", w: 800, h: 800), projectId: nil,
                favorite: false, createdAt: .daysAgo(Double(i) * 4 + 3),
                tags: ["audio"], width: 0, height: 0, durationSeconds: [30, 60, 90, 12, 5][i]
            ))
        }
        list.append(Asset(id: "asset_logo_primary", name: "Luma primary logo", kind: .logo, imageURL: image("luma-logo", w: 600, h: 600), projectId: nil, favorite: true, createdAt: .daysAgo(200), tags: ["brand"], width: 2000, height: 2000, durationSeconds: nil))
        list.append(Asset(id: "asset_logo_icon", name: "Luma icon", kind: .logo, imageURL: image("luma-icon", w: 300, h: 300), projectId: nil, favorite: false, createdAt: .daysAgo(200), tags: ["brand"], width: 1024, height: 1024, durationSeconds: nil))
        list.append(Asset(id: "asset_logo_mono", name: "Luma mono logo", kind: .logo, imageURL: image("luma-mono", w: 600, h: 600), projectId: nil, favorite: false, createdAt: .daysAgo(199), tags: ["brand"], width: 2000, height: 2000, durationSeconds: nil))
        list.append(Asset(id: "asset_product_hero", name: "Luma Glow Serum packshot", kind: .brand, imageURL: image("luma-packshot"), projectId: nil, favorite: true, createdAt: .daysAgo(150), tags: ["brand", "product"], width: 2400, height: 3000, durationSeconds: nil))
        list.append(Asset(id: "asset_brand_palette", name: "Brand palette board", kind: .brand, imageURL: image("luma-palette", w: 800, h: 600), projectId: nil, favorite: false, createdAt: .daysAgo(150), tags: ["brand"], width: 1600, height: 1200, durationSeconds: nil))
        list.append(Asset(id: "asset_brand_type", name: "Typography sheet", kind: .brand, imageURL: image("luma-type", w: 800, h: 600), projectId: nil, favorite: false, createdAt: .daysAgo(149), tags: ["brand"], width: 1600, height: 1200, durationSeconds: nil))
        let exportNames = ["Summer launch pack (PNG)", "TikTok ads batch (MP4)", "Gift guide carousel (PDF)", "Watch editorial (JPG)", "Story set 9:16 (PNG)"]
        for (i, name) in exportNames.enumerated() {
            list.append(Asset(id: "asset_exp_\(i + 1)", name: name, kind: .export, imageURL: image("exp-\(i + 1)", w: 800, h: 800), projectId: projectCycle[i], favorite: false, createdAt: .daysAgo(Double(i) * 5 + 1), tags: ["export"], width: 0, height: 0, durationSeconds: nil))
        }
        return list
    }()

    // MARK: Templates (24)

    static let templates: [Template] = {
        let rows: [(String, TemplateCategory, [SocialPlatform], String, String, String)] = [
            ("Luxury Product Launch", .productAds, [.instagram, .facebook], "Image", "Luxury", "4:5"),
            ("15-Second UGC Ad", .ugc, [.tiktok, .instagram], "Video", "UGC", "9:16"),
            ("New Product Reel", .socialMedia, [.instagram], "Reel", "Lifestyle", "9:16"),
            ("Black Friday Campaign", .ecommerce, [.facebook, .instagram, .google], "Carousel", "Bold", "1:1"),
            ("Clean Beauty Story", .beauty, [.instagram], "Story", "Minimal", "9:16"),
            ("Skincare Before / After", .beauty, [.tiktok, .instagram], "Video", "UGC", "9:16"),
            ("Streetwear Drop", .fashion, [.instagram, .tiktok], "Image", "Street", "4:5"),
            ("Editorial Lookbook", .fashion, [.pinterest, .instagram], "Carousel", "Editorial", "4:5"),
            ("Menu Hero Shot", .food, [.instagram, .facebook], "Image", "Food", "1:1"),
            ("Recipe Short", .food, [.youtube, .tiktok], "Short", "Lifestyle", "9:16"),
            ("Gadget Unboxing", .technology, [.youtube, .tiktok], "Video", "Tech", "16:9"),
            ("Feature Spotlight", .technology, [.instagram, .google], "Image", "Studio", "1:1"),
            ("Open House Reel", .realEstate, [.instagram, .facebook], "Reel", "Cinematic", "9:16"),
            ("Listing Carousel", .realEstate, [.facebook, .instagram], "Carousel", "Editorial", "4:5"),
            ("30-Day Challenge Promo", .fitness, [.tiktok, .instagram], "Video", "Commercial", "9:16"),
            ("Gym Motivation Story", .fitness, [.instagram], "Story", "Cinematic", "9:16"),
            ("Testimonial Ad", .ugc, [.facebook, .youtube], "Video", "UGC", "1:1"),
            ("Founder Story", .ugc, [.tiktok, .instagram], "Video", "Authentic", "9:16"),
            ("Flash Sale Countdown", .ecommerce, [.instagram, .facebook], "Story", "Urgent", "9:16"),
            ("Bundle Offer Ad", .ecommerce, [.google, .facebook], "Image", "Studio", "1:1"),
            ("Product on Marble", .productAds, [.instagram, .pinterest], "Image", "Product Photography", "4:5"),
            ("Ingredient Macro", .productAds, [.instagram], "Image", "Editorial", "1:1"),
            ("Weekly Tips Carousel", .socialMedia, [.instagram], "Carousel", "Minimal", "1:1"),
            ("Behind the Scenes", .socialMedia, [.tiktok, .youtube], "Short", "Authentic", "9:16"),
        ]
        return rows.enumerated().map { i, r in
            Template(
                id: "tpl_\(i + 1)", title: r.0,
                description: "A ready-to-run \(r.3.lowercased()) template for \(r.1.title.lowercased()) brands. Swap the product, adjust the copy and generate in seconds.",
                category: r.1, platforms: r.2, format: r.3,
                thumbnailURL: image("tpl-\(i + 1)"),
                prompt: "Create a \(r.4.lowercased()) \(r.3.lowercased()) for a premium product with clean lighting and a clear focal point.",
                style: r.4, ratio: r.5
            )
        }
    }()

    // MARK: Creators (16)

    static let creators: [Creator] = {
        let rows: [(String, String, String, Int, String, [String], Int)] = [
            ("Maya", "Female", "20–26", 24, "Lifestyle", ["English", "Spanish"], 5),
            ("Jordan", "Male", "26–32", 29, "Fitness", ["English"], 11),
            ("Sofia", "Female", "24–30", 27, "Beauty", ["English", "Italian"], 9),
            ("Marcus", "Male", "28–34", 31, "Tech", ["English", "German"], 14),
            ("Priya", "Female", "24–30", 26, "Wellness", ["English", "Hindi"], 20),
            ("Leo", "Male", "20–26", 23, "Streetwear", ["English", "French"], 15),
            ("Hana", "Female", "28–34", 30, "Home & Decor", ["English", "Japanese"], 25),
            ("Diego", "Male", "30–36", 33, "Food", ["Spanish", "English"], 17),
            ("Amara", "Female", "22–28", 25, "Fashion", ["English"], 26),
            ("Ethan", "Male", "24–30", 27, "Gaming", ["English"], 18),
            ("Chloe", "Female", "26–32", 28, "Parenting", ["English", "French"], 32),
            ("Noah", "Male", "34–40", 36, "Finance", ["English"], 53),
            ("Isabella", "Female", "20–26", 22, "Beauty", ["English", "Portuguese"], 44),
            ("Kai", "Male", "22–28", 24, "Travel", ["English", "Korean"], 59),
            ("Zara", "Female", "30–36", 32, "Luxury", ["English", "Arabic"], 45),
            ("Tomas", "Male", "26–32", 29, "Outdoor", ["English", "Czech"], 60),
        ]
        return rows.map { r in
            Creator(
                id: "creator_\(r.0.lowercased())", name: r.0, gender: r.1, ageRange: r.2, age: r.3,
                style: r.4, languages: r.5, avatarURL: avatar(r.6),
                bio: "\(r.0) is a fictional AI creator specialising in \(r.4.lowercased()) content with a natural, camera-friendly delivery."
            )
        }
    }()

    // MARK: Generations (32)

    static let generations: [Generation] = {
        let prompts: [(GenerationKind, String, GenerationStatus)] = [
            (.image, "Luma Glow Serum on wet marble, golden hour, soft shadows", .completed),
            (.image, "Serum bottle floating with citrus slices, studio lighting", .completed),
            (.video, "Slow zoom on serum with light rays, 10s, cinematic", .completed),
            (.copy, "Instagram caption for summer launch, luxury tone", .completed),
            (.ad, "TikTok ad: Premium serum, women 20–35, 20% launch discount", .completed),
            (.image, "Cold brew can on rainy street at night, neon reflections", .completed),
            (.image, "Watch on wrist, dark editorial, single spotlight", .completed),
            (.video, "UGC: Maya explains her 3-step morning routine", .completed),
            (.copy, "Product description for Luma Glow Serum", .completed),
            (.image, "Sneaker mid-air on concrete, motion blur, bold", .completed),
            (.ad, "Instagram carousel: Holiday gift guide, three tiers", .completed),
            (.image, "Desk setup with morning light, minimal, warm", .completed),
            (.video, "Orbit shot around headphones, neon rim light, 5s", .completed),
            (.copy, "10 hooks for skincare UGC ads", .completed),
            (.image, "Vegan snack bag with confetti, playful, bright", .completed),
            (.image, "Fragrance bottle with mist, moody, macro", .completed),
            (.video, "Push-in on coffee pour, handheld, 5s", .processing),
            (.image, "Serum in luxury bathroom, softbox lighting, close-up", .completed),
            (.ad, "Facebook ad: Bundle offer, CTA Shop Now", .completed),
            (.copy, "Email for Black Friday sprint, urgent tone", .completed),
            (.image, "Gift boxes stacked, festive, studio", .completed),
            (.video, "Story: three steps to glow, 15s, UGC", .queued),
            (.image, "Serum macro dropper with vitamin C droplets", .completed),
            (.image, "Coffee pour macro with crema, food style", .completed),
            (.copy, "TikTok caption for gym challenge reel", .completed),
            (.ad, "Google display: Luxury watch, men 25–40", .completed),
            (.image, "Model applying serum, natural light, lifestyle", .completed),
            (.video, "Tracking shot: trail run at dawn, 15s", .completed),
            (.image, "Headphones macro on velvet, dramatic lighting", .failed),
            (.copy, "Landing page copy for fragrance story", .completed),
            (.image, "Poolside flatlay with serum and sunglasses", .completed),
            (.ad, "Pinterest pin: Ingredient macro, minimal", .completed),
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
                resultText: p.0 == .copy ? "Meet your everyday glow. Luma Glow Serum brightens, smooths and protects — in one step. Clean formula. Real results." : nil
            )
        }
    }()

    // MARK: Campaigns (10)

    static let campaigns: [Campaign] = {
        let rows: [(String, String, String?, CampaignObjective, String, [SocialPlatform], [ContentFormat], CampaignStatus, Double)] = [
            ("camp_luma_summer", "Luma Glow Summer Launch", "proj_luma_summer", .sales, "Women and men 20–35, skincare-curious", [.instagram, .tiktok, .facebook], [.productPhotos, .ugc, .videoAds, .stories, .carousels], .ready, 1),
            ("camp_skincare_seasonal", "Summer Skincare Push", "proj_summer_skincare", .awareness, "Women 25–40", [.instagram, .facebook], [.productPhotos, .stories], .live, 4),
            ("camp_coffee", "Urban Coffee Cold Brew", "proj_urban_coffee", .engagement, "City commuters 22–35", [.tiktok, .instagram], [.ugc, .videoAds], .draft, 7),
            ("camp_fitness", "30-Day Sprint Challenge", "proj_fitness", .leads, "Fitness beginners 20–30", [.instagram, .youtube, .tiktok], [.videoAds, .stories], .scheduled, 10),
            ("camp_watch", "Timepiece Editorial", "proj_watch", .sales, "Men 25–40, premium buyers", [.instagram, .facebook, .google], [.productPhotos, .carousels], .live, 15),
            ("camp_ugc", "UGC Hook Test", "proj_ugc_ads", .sales, "Broad, lookalike buyers", [.tiktok, .facebook], [.ugc], .completed, 20),
            ("camp_gift", "Holiday Gift Guide", "proj_gift_guide", .sales, "Gift shoppers 25–45", [.instagram, .facebook, .pinterest], [.carousels, .stories], .draft, 26),
            ("camp_office", "Calm Desk Collection", "proj_home_office", .awareness, "Remote workers 25–40", [.instagram, .pinterest], [.productPhotos], .scheduled, 32),
            ("camp_snack", "Snack Teaser Week", "proj_vegan_snack", .engagement, "Gen Z snackers", [.tiktok], [.ugc, .videoAds], .completed, 41),
            ("camp_black_friday", "Black Friday Sprint", "proj_black_friday", .sales, "Past customers + cart abandoners", [.facebook, .instagram, .google], [.videoAds, .stories, .carousels], .completed, 121),
        ]
        return rows.enumerated().map { i, r in
            let assetIds = assets.filter { $0.projectId == r.2 && ($0.kind == .image || $0.kind == .video) }.map { $0.id }
            let items: [CalendarItem] = (0..<6).map { d in
                CalendarItem(
                    id: "cal_\(i)_\(d)", title: ["Launch teaser", "Hero post", "UGC hook", "Story sequence", "Carousel", "Retarget ad"][d],
                    date: .daysFromNow(Double(d * 2 - 3)),
                    platform: r.5[d % r.5.count], format: ["Reel", "Image", "Video", "Story", "Carousel", "Video"][d],
                    status: d < 2 ? .published : (d < 4 ? .scheduled : .draft),
                    assetId: assetIds.indices.contains(d) ? assetIds[d] : nil
                )
            }
            let variations: [AdVariation] = ["A", "B", "C", "D"].enumerated().map { vi, letter in
                AdVariation(
                    id: "var_\(i)_\(letter)", label: "Creative \(letter)",
                    visualURL: image("var-\(i)-\(letter)"),
                    headline: ["Glow starts here.", "Your skin, upgraded.", "One drop. Real results.", "Meet the everyday serum."][vi],
                    primaryText: ["Vitamin C brightening serum for every routine. Clean, light, effective.", "Brighter skin in 14 days or your money back. Try Luma Glow.", "Skip the 10-step routine. One serum does the work.", "Trusted by 40,000+ people who wanted simpler skincare."][vi],
                    cta: ["Shop Now", "Learn More", "Get 20% Off", "Try It"][vi],
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
            (.generationComplete, "Generation complete", "4 product shots for Luma Glow Serum are ready.", 0.02, false),
            (.campaignReady, "Campaign ready", "Luma Glow Summer Launch has 12 assets and 4 ad variations.", 0.1, false),
            (.exportComplete, "Export complete", "Summer launch pack (PNG) is ready to download.", 0.3, false),
            (.creditsLow, "Credits running low", "You have 1,250 credits left. Top up before your next video batch.", 0.6, true),
            (.newTemplate, "New template", "Skincare Before / After was added to Beauty.", 1, true),
            (.projectShared, "Project shared", "Sarah shared Urban Coffee Launch with you.", 1.4, true),
            (.generationComplete, "Video rendered", "Slow zoom on serum (10s) finished rendering.", 2, true),
            (.generationComplete, "Copy ready", "Instagram caption for summer launch is ready.", 2.3, true),
            (.campaignReady, "Campaign scheduled", "30-Day Sprint Challenge is scheduled for next week.", 3, true),
            (.exportComplete, "Export complete", "TikTok ads batch (MP4) is ready.", 3.5, true),
            (.newTemplate, "New template", "Founder Story added to UGC.", 4, true),
            (.projectShared, "Project shared", "Michael shared Holiday Gift Guide with you.", 5, true),
            (.generationComplete, "Generation complete", "Cold brew street shots are ready.", 6, true),
            (.creditsLow, "Credits refilled", "Your Creator plan added 1,500 credits.", 7, true),
            (.generationComplete, "Generation failed", "Headphones macro failed. Tap to retry.", 8, true),
            (.campaignReady, "Campaign completed", "UGC Hook Test wrapped with 4 winning hooks.", 9, true),
            (.exportComplete, "Export complete", "Gift guide carousel (PDF) is ready.", 11, true),
            (.newTemplate, "New template", "Open House Reel added to Real Estate.", 12, true),
            (.generationComplete, "Generation complete", "Watch editorial set is ready.", 14, true),
            (.projectShared, "Access changed", "Michael is now an Editor on Marketing Studio.", 16, true),
            (.generationComplete, "Generation complete", "Desk setup lifestyle set is ready.", 20, true),
            (.campaignReady, "Campaign ready", "Calm Desk Collection assets are ready to review.", 24, true),
        ]
        return rows.enumerated().map { i, r in
            AppNotification(id: "notif_\(i + 1)", kind: r.0, title: r.1, message: r.2, createdAt: .daysAgo(r.3), read: r.4, routeHint: nil)
        }
    }()

    // MARK: Credits

    static let startingCredits = 1_250

    static let transactions: [CreditTransaction] = [
        CreditTransaction(id: "tx_1", amount: 1500, reason: "Creator plan monthly credits", createdAt: .daysAgo(7)),
        CreditTransaction(id: "tx_2", amount: -40, reason: "Image generation × 4", createdAt: .daysAgo(6)),
        CreditTransaction(id: "tx_3", amount: -50, reason: "Video generation (10s)", createdAt: .daysAgo(5.5)),
        CreditTransaction(id: "tx_4", amount: -15, reason: "Upscale", createdAt: .daysAgo(5)),
        CreditTransaction(id: "tx_5", amount: -20, reason: "Ad variations × 4", createdAt: .daysAgo(4)),
        CreditTransaction(id: "tx_6", amount: -40, reason: "Product shoot × 4", createdAt: .daysAgo(3)),
        CreditTransaction(id: "tx_7", amount: -50, reason: "UGC video", createdAt: .daysAgo(2.2)),
        CreditTransaction(id: "tx_8", amount: -10, reason: "Image generation", createdAt: .daysAgo(1.5)),
        CreditTransaction(id: "tx_9", amount: -15, reason: "Upscale", createdAt: .daysAgo(1)),
        CreditTransaction(id: "tx_10", amount: -10, reason: "Copywriter × 5", createdAt: .daysAgo(0.5)),
    ]

    // MARK: Copy / Hooks

    static let hookLibrary: [String] = [
        "Nobody tells you this about vitamin C serums...",
        "You've been using this wrong your whole life.",
        "POV: you finally found the serum that actually works.",
        "Stop scrolling if your skin looks dull by 3pm.",
        "I replaced my 10-step routine with this one bottle.",
        "The $48 serum dermatologists keep quiet about.",
        "This is your sign to fix your skincare in 14 days.",
        "Three drops. That's it. That's the routine.",
        "Why does everyone suddenly have glass skin?",
        "I tested it for 30 days so you don't have to.",
        "Wait for the before and after...",
        "If you only buy one skincare product this year...",
    ]

    static let assistantReplies: [String] = [
        "I can build that. Want me to start with product shots, a UGC script, or the full campaign?",
        "Based on your brand voice (luxury, short sentences), here's a direction: minimal set, golden hour light, one hero angle.",
        "I'd recommend 4:5 for Instagram feed and 9:16 for Stories and TikTok. Want both?",
        "Drafted. I've saved it to your project — you can refine it in the editor.",
    ]

    static let trendingFormats: [(title: String, subtitle: String, icon: String)] = [
        ("UGC hook video", "9:16 · 15s", "person.wave.2"),
        ("Product reel", "9:16 · 10s", "play.rectangle"),
        ("Carousel", "4:5 · 5 slides", "rectangle.stack"),
        ("Story sequence", "9:16 · 3 frames", "rectangle.portrait.on.rectangle.portrait"),
        ("Before / After", "1:1 · image", "arrow.left.arrow.right"),
    ]
}
