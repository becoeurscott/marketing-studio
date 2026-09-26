import Foundation

// MARK: - Parameter types

struct ImageGenParams {
    var prompt: String
    var style: String = "Product Photography"
    var ratio: String = "4:5"
    var background: String = "Studio"
    var lighting: String = "Softbox"
    var camera: String = "Medium"
    var composition: String = "Centered"
    var productAssetId: String? = nil
    var projectId: String? = nil
}

struct VideoGenParams {
    var prompt: String
    var sourceAssetId: String? = nil
    var duration: Int = 10
    var ratio: String = "9:16"
    var camera: String = "Slow zoom"
    var style: String = "Commercial"
    var projectId: String? = nil
}

struct UGCParams {
    var productAssetId: String?
    var creatorId: String
    var script: String
    var location: String = "Bathroom"
    var tone: String = "Authentic"
    var duration: Int = 15
    var projectId: String? = nil
}

struct ProductShootParams {
    var productAssetId: String?
    var environment: String = "Studio"
    var lighting: String = "Natural"
    var camera: String = "Medium"
    var count: Int = 4
    var projectId: String? = nil
}

struct AdParams {
    var platform: SocialPlatform = .instagram
    var format: String = "Image"
    var product: String
    var offer: String
    var audience: String
    var cta: String = "Shop Now"
    var projectId: String? = nil
}

struct CopyParams {
    var tool: String = "Ad Copy"
    var product: String
    var audience: String
    var tone: String = "Professional"
    var goal: String = "Sales"
}

struct CampaignParams {
    var name: String
    var objective: CampaignObjective
    var audience: String
    var platforms: [SocialPlatform]
    var formats: [ContentFormat]
    var projectId: String? = nil
}

enum ExportFormat: String, CaseIterable, Identifiable {
    case png = "PNG", jpg = "JPG", mp4 = "MP4", pdf = "PDF"
    var id: String { rawValue }
}
enum ExportQuality: String, CaseIterable, Identifiable {
    case standard = "Standard", high = "High", maximum = "Maximum"
    var id: String { rawValue }
    var label: String {
        switch self {
        case .standard: return "Standard"
        case .high: return "Haute"
        case .maximum: return "Maximale"
        }
    }
}

struct GeneratedImage: Identifiable, Hashable {
    let id: String
    let url: String
    let generationId: String
}

struct GeneratedVideo: Identifiable, Hashable {
    let id: String
    let posterURL: String
    let duration: Int
    let generationId: String
}

enum MockAPIError: LocalizedError {
    case insufficientCredits(needed: Int)
    case failed(String)
    var errorDescription: String? {
        switch self {
        case .insufficientCredits(let n): return "Il vous faut \(n) crédits pour cette action. Rechargez pour continuer."
        case .failed(let m): return m
        }
    }
}

// MARK: - Mock API

/// Simulated backend. Every call waits 0.6–2.5s, charges credits through the store,
/// records a Generation and returns fake results. Replace bodies with real calls later.
@MainActor
enum MockAPI {

    static let videoSteps = ["Préparation des ressources", "Création de la scène 1...", "Ajout du mouvement...", "Rendu...", "Finalisation..."]
    static let exportSteps = ["Collecte des ressources", "Rendu des fichiers", "Empaquetage", "Terminé"]

    private static func wait(_ seconds: Double) async {
        try? await Task.sleep(for: .seconds(seconds))
    }

    private static func delay(_ min: Double = 0.6, _ max: Double = 2.5) async {
        await wait(Double.random(in: min...max))
    }

    private static func charge(_ store: AppStore, _ amount: Int, _ reason: String) throws {
        guard store.spendCredits(amount, reason: reason) else {
            throw MockAPIError.insufficientCredits(needed: amount)
        }
    }

    private static func slug() -> String { String(UUID().uuidString.prefix(8)).lowercased() }

    // MARK: Image

    static func generateImage(_ p: ImageGenParams, store: AppStore) async throws -> [GeneratedImage] {
        let cost = GenerationKind.image.creditCost * 4
        try charge(store, cost, "Génération d'images × 4")
        await delay(1.2, 2.5)
        let s = slug()
        let urls = (1...4).map { MockData.image("img-\(s)-\($0)") }
        let g = store.addGeneration(kind: .image, prompt: p.prompt, thumbnails: urls, projectId: p.projectId, credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Génération terminée", message: "4 images sont prêtes pour « \(p.prompt.prefix(40)) ».")
        return urls.map { GeneratedImage(id: IDGen.make("out"), url: $0, generationId: g.id) }
    }

    static func upscaleImage(url: String, store: AppStore) async throws -> GeneratedImage {
        try charge(store, 15, "Agrandissement")
        await delay(0.8, 1.6)
        let g = store.addGeneration(kind: .image, prompt: "Agrandissement 2×", thumbnails: [url], credits: 15)
        return GeneratedImage(id: IDGen.make("out"), url: url, generationId: g.id)
    }

    // MARK: Video

    static func generateVideo(_ p: VideoGenParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> GeneratedVideo {
        let cost = GenerationKind.video.creditCost
        try charge(store, cost, "Génération vidéo (\(p.duration) s)")
        for step in videoSteps {
            progress(step)
            await wait(Double.random(in: 0.5...0.9))
        }
        let poster = MockData.image("vid-\(slug())", w: 720, h: 1280)
        let g = store.addGeneration(kind: .video, prompt: p.prompt, thumbnails: [poster], projectId: p.projectId, model: "Motion v1", credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Vidéo générée", message: "Votre vidéo « \(p.style.lowercased()) » de \(p.duration) s est prête.")
        return GeneratedVideo(id: IDGen.make("out"), posterURL: poster, duration: p.duration, generationId: g.id)
    }

    static func generateUGC(_ p: UGCParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> GeneratedVideo {
        let cost = GenerationKind.video.creditCost
        try charge(store, cost, "Vidéo UGC")
        let creatorName = store.creator(p.creatorId)?.name ?? "Créateur"
        for step in ["Casting de \(creatorName)", "Lecture du script...", "Création de la scène 1...", "Ajout du mouvement...", "Rendu...", "Finalisation..."] {
            progress(step)
            await wait(Double.random(in: 0.4...0.8))
        }
        let poster = MockData.image("ugc-\(slug())", w: 720, h: 1280)
        let g = store.addGeneration(kind: .video, prompt: "UGC · \(creatorName) · \(p.tone): \(p.script)", thumbnails: [poster], projectId: p.projectId, model: "UGC v2", credits: cost)
        return GeneratedVideo(id: IDGen.make("out"), posterURL: poster, duration: p.duration, generationId: g.id)
    }

    // MARK: Product shoot

    static func generateProductShoot(_ p: ProductShootParams, store: AppStore) async throws -> [GeneratedImage] {
        let cost = GenerationKind.image.creditCost * p.count
        try charge(store, cost, "Shooting produit × \(p.count)")
        await delay(1.4, 2.5)
        let s = slug()
        let urls = (1...p.count).map { MockData.image("shoot-\(s)-\($0)") }
        let g = store.addGeneration(kind: .image, prompt: "Shooting produit · \(p.environment) · \(p.lighting) · \(p.camera)", thumbnails: urls, projectId: p.projectId, credits: cost)
        return urls.map { GeneratedImage(id: IDGen.make("out"), url: $0, generationId: g.id) }
    }

    // MARK: Ads

    static func generateAds(_ p: AdParams, store: AppStore) async throws -> [AdVariation] {
        let cost = GenerationKind.ad.creditCost
        try charge(store, cost, "Variantes de pub × 4")
        await delay(1.0, 2.2)
        let s = slug()
        let headlines = ["\(p.product): \(p.offer)", "Pensé pour \(p.audience.lowercased())", "L'amélioration que vous attendiez", "\(p.offer). Aujourd'hui seulement."]
        let bodies = [
            "Qualité premium, prix honnête. \(p.offer) pour une durée limitée.",
            "Conçu pour \(p.audience.lowercased()) qui en veulent plus au quotidien.",
            "Des milliers de personnes ont déjà changé. Découvrez pourquoi \(p.product) est différent.",
            "N'attendez pas — \(p.offer.lowercased()) se termine bientôt. Touchez pour en profiter.",
        ]
        let vars = ["A", "B", "C", "D"].enumerated().map { i, l in
            AdVariation(id: IDGen.make("var"), label: "Création \(l)", visualURL: MockData.image("ad-\(s)-\(l)"), headline: headlines[i], primaryText: bodies[i], cta: p.cta, platform: p.platform)
        }
        store.addGeneration(kind: .ad, prompt: "Pub \(p.platform.title) \(p.format) · \(p.product) · \(p.audience) · \(p.offer)", thumbnails: vars.map { $0.visualURL }, projectId: p.projectId, model: "Ads v1", credits: cost)
        return vars
    }

    // MARK: Copy

    static func generateCopy(_ p: CopyParams, store: AppStore) async throws -> CopyResult {
        let cost = GenerationKind.copy.creditCost
        try charge(store, cost, "Rédaction · \(p.tool)")
        await delay(0.6, 1.6)
        let voice = store.brand.voice
        let text: String
        switch p.tool {
        case "Instagram Caption":
            text = "Découvrez votre éclat au quotidien. \(p.product) fait le travail pour que votre routine n'ait pas à le faire. Formule clean, vrais résultats. ✨ #\(p.product.replacingOccurrences(of: " ", with: "").lowercased())"
        case "TikTok Caption":
            text = "POV : votre peau a enfin compris 💧 \(p.product), c'est le bon. #skincare #glow #fyp"
        case "Email":
            text = "Objet : Votre éclat, livré.\n\nBonjour,\n\n\(p.product) est arrivé. Pensé pour \(p.audience.lowercased()), conçu pour tous les jours. \(voice.writingStyle)\n\nTouchez ci-dessous pour \(p.goal.lowercased() == "sales" ? "découvrir le lancement" : "en savoir plus").\n\n— L'équipe Luma"
        case "Headline":
            text = "\(p.product). L'éclat, en toute simplicité."
        case "Hook":
            text = MockData.hookLibrary.randomElement() ?? "Personne ne vous dit ça sur..."
        case "CTA":
            text = "Révélez votre éclat — Achetez maintenant"
        case "UGC Script":
            text = "[Accroche] Bon, il faut que je vous parle de \(p.product).\n[Problème] J'ai tout essayé contre le teint terne.\n[Produit] Puis j'ai trouvé ça. Trois gouttes, chaque matin.\n[Preuve] Deux semaines après, on me demande ce qui a changé.\n[CTA] Le lien est en dessous — faites-moi confiance."
        case "Landing Page Copy":
            text = "# \(p.product)\n\nUne peau plus lumineuse, une routine plus simple.\n\nUn sérum à la vitamine C conçu pour un usage quotidien. Léger, clean et pensé pour \(p.audience.lowercased()).\n\n**Acheter maintenant** · Livraison offerte dès 40 €"
        case "Product Description":
            text = "\(p.product) est un sérum éclat à la vitamine C conçu pour les routines de soin quotidiennes. Léger et rapidement absorbé, il unifie le teint et apporte de l'éclat sans effet lourd. Pensé pour \(p.audience.lowercased())."
        default:
            text = "\(p.product) — le choix \(p.tone.lowercased()) pour \(p.audience.lowercased()). \(voice.writingStyle) Achetez dès aujourd'hui."
        }
        store.addGeneration(kind: .copy, prompt: "\(p.tool) · \(p.product) · \(p.tone)", thumbnails: [], model: "Writer v3", credits: cost, resultText: text)
        store.addCopyResult(tool: p.tool, tone: p.tone, text: text)
        return CopyResult(id: IDGen.make("copy"), tool: p.tool, tone: p.tone, text: text, createdAt: Date())
    }

    static func generateHooks(product: String, audience: String, store: AppStore) async throws -> [HookResult] {
        let cost = GenerationKind.copy.creditCost * 2
        try charge(store, cost, "Générateur d'accroches × 10")
        await delay(0.8, 1.8)
        let cats = ["Curiosité", "À contre-courant", "POV", "Rupture", "Histoire", "Autorité", "Urgence", "Simplicité", "Tendance", "Preuve"]
        let hooks = Array(MockData.hookLibrary.shuffled().prefix(10)).enumerated().map { i, t in
            HookResult(id: IDGen.make("hook"), text: t.replacingOccurrences(of: "vitamin C serums", with: product.lowercased()), category: cats[i % cats.count])
        }
        store.addGeneration(kind: .copy, prompt: "10 accroches · \(product) · \(audience)", thumbnails: [], model: "Writer v3", credits: cost, resultText: hooks.map { $0.text }.joined(separator: "\n"))
        return hooks
    }

    // MARK: Campaign

    static func createCampaign(_ p: CampaignParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> Campaign {
        let cost = 60
        try charge(store, cost, "Génération de campagne")
        for step in ["Analyse de l'objectif", "Sélection des formats", "Génération des visuels", "Rédaction des textes", "Création du calendrier"] {
            progress(step)
            await wait(Double.random(in: 0.4...0.7))
        }
        let s = slug()
        let assetIds = (1...6).map { i in
            store.addAsset(name: "\(p.name) visuel \(i)", kind: i % 3 == 0 ? .video : .image, imageURL: MockData.image("camp-\(s)-\(i)"), projectId: p.projectId, tags: ["campaign"], durationSeconds: i % 3 == 0 ? 10 : nil).id
        }
        let vars = try await generateAds(AdParams(platform: p.platforms.first ?? .instagram, format: "Image", product: store.brand.name, offer: "Offre de lancement", audience: p.audience, projectId: p.projectId), store: store)
        var c = store.createCampaign(name: p.name, objective: p.objective, audience: p.audience, platforms: p.platforms, formats: p.formats, projectId: p.projectId, assetIds: assetIds, variations: vars)
        c.status = .ready
        c.calendarItems = (0..<5).map { d in
            CalendarItem(id: IDGen.make("cal"), title: ["Teaser", "Post phare", "Accroche UGC", "Story", "Reciblage"][d], date: .daysFromNow(Double(d * 2 + 1)), platform: p.platforms[d % max(p.platforms.count, 1)], format: ["Reel", "Image", "Video", "Story", "Carousel"][d], status: .draft, assetId: assetIds.indices.contains(d) ? assetIds[d] : nil)
        }
        store.updateCampaign(c)
        store.pushNotification(kind: .campaignReady, title: "Campagne prête", message: "\(p.name) contient \(assetIds.count) ressources et \(vars.count) variantes de pub.")
        return c
    }

    // MARK: Export / upload

    static func exportAssets(ids: [String], format: ExportFormat, quality: ExportQuality, store: AppStore, progress: @escaping (Double, String) -> Void) async throws -> Asset {
        for (i, step) in exportSteps.enumerated() {
            progress(Double(i) / Double(exportSteps.count - 1), step)
            await wait(Double.random(in: 0.4...0.8))
        }
        let a = store.addAsset(name: "Export de \(ids.count) élément\(ids.count == 1 ? "" : "s") (\(format.rawValue), \(quality.label))", kind: .export, imageURL: MockData.image("exp-\(slug())", w: 800, h: 800), projectId: store.currentProjectId, tags: ["export"])
        store.pushNotification(kind: .exportComplete, title: "Export terminé", message: "\(a.name) est prêt à être téléchargé.")
        return a
    }

    static func uploadProduct(name: String, store: AppStore, progress: @escaping (Double) -> Void) async throws -> Asset {
        for i in 1...5 {
            progress(Double(i) / 5)
            await wait(0.2)
        }
        return store.addAsset(name: name, kind: .image, imageURL: MockData.image("upload-\(slug())"), projectId: store.currentProjectId, tags: ["upload", "product"])
    }

    // MARK: Assistant

    static func assistantReply(to message: String, store: AppStore) async -> String {
        await delay(0.6, 1.4)
        return MockData.assistantReplies.randomElement() ?? "C'est fait."
    }
}
