import Foundation
import UIKit

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
    /// Image model id or label ("Marketing Studio", "Soul 2").
    var model: String = "marketing-studio"
    var count: Int = 2
}

struct VideoGenParams {
    var prompt: String
    var sourceAssetId: String? = nil
    var duration: Int = 10
    var ratio: String = "9:16"
    var camera: String = "Slow zoom"
    var style: String = "Commercial"
    /// Video model id ("seedance-2.5", "kling-3.0"…).
    var model: String = AIModels.defaultVideo
    var projectId: String? = nil
}

struct UGCParams {
    var productAssetId: String?
    var creatorId: String
    var script: String
    var location: String = "Boutique"
    var tone: String = "Authentic"
    /// Voice-over language id (Market.languages).
    var language: String = "fr"
    var duration: Int = 15
    var projectId: String? = nil
}

struct ProductShootParams {
    var productAssetId: String?
    var environment: String = "Studio"
    var lighting: String = "Natural"
    var camera: String = "Medium"
    /// Sokozia style (Catalog.styles); its art direction replaces the generic setting.
    var styleId: String? = nil
    var count: Int = 3
    var projectId: String? = nil
}

struct AdParams {
    var platform: SocialPlatform = .whatsapp
    var format: String = "Image"
    var product: String
    var offer: String
    var audience: String
    var cta: String = "Commander sur WhatsApp"
    /// Price shown on the visual, already formatted ("7 500 FCFA").
    var price: String? = nil
    var productAssetId: String? = nil
    var projectId: String? = nil
}

struct CopyParams {
    var tool: String = "Ad Copy"
    var product: String
    var audience: String
    var tone: String = "Professional"
    var goal: String = "Sales"
    var language: String = "fr"
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
    case light = "Light", standard = "Standard", high = "High", maximum = "Maximum"
    var id: String { rawValue }
    var label: String {
        switch self {
        case .light: return "Légère (WhatsApp)"
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
    let videoURL: String
    let duration: Int
    let generationId: String
}

// MARK: - API

/// Real generation through sokozia.com (Higgsfield models). Credits are debited and refunded on the
/// server per job; the app pre-checks the balance it knows and reloads it after every job.
/// Text tools use built-in templates, so they are free (same as the web app).
@MainActor
enum API {

    static let videoSteps = ["Préparation des ressources", "Construction de la scène 1…", "Ajout du mouvement…", "Rendu en cours…", "Finalisation…"]
    static let exportSteps = ["Collecte des fichiers", "Préparation", "Prêt"]

    // MARK: Credits

    /// Instant "not enough credits" check before calling the server (which enforces it anyway).
    private static func precheck(_ store: AppStore, _ cost: Int) throws {
        guard cost <= store.credits else {
            throw APIError.insufficientCredits("Il vous faut \(cost) crédits pour cette action. Vous en avez \(store.credits).")
        }
    }

    /// Reloads balance + credit history from the server.
    static func refreshAccount(_ store: AppStore) async {
        if let summary = try? await APIClient.account() { store.applyAccount(summary) }
    }

    private static func charged<T>(_ store: AppStore, cost: Int, _ work: () async throws -> T) async throws -> T {
        try precheck(store, cost)
        defer { Task { await refreshAccount(store) } }
        return try await work()
    }

    /// Public URL of an uploaded or generated asset (the models must be able to download it).
    private static func remoteURL(_ store: AppStore, _ assetId: String?) -> String? {
        guard let assetId, let a = store.asset(assetId), a.imageURL.hasPrefix("https://") else { return nil }
        return a.imageURL
    }

    /// Marketing Studio supports these ratios; the app's 4:5 maps to the closest one.
    private static func imageRatio(_ r: String?) -> String {
        guard let r else { return "auto" }
        return r == "4:5" ? "3:4" : r
    }

    private static func images(_ prompt: String, count: Int, ratio: String?, imageUrls: [String]? = nil, model: String? = nil, upscale: Bool = false) async throws -> [String] {
        try await withThrowingTaskGroup(of: [String].self) { group in
            for _ in 0..<count {
                group.addTask {
                    try await APIClient.run(GenerationRequest(kind: .image, model: model, prompt: prompt, imageUrls: imageUrls, aspectRatio: imageRatio(ratio), upscale: upscale ? true : nil)).images
                }
            }
            var out: [String] = []
            for try await urls in group { out += urls }
            return out
        }
    }

    /// Maps job states onto the progress steps (queued → rendering → done).
    private static func stepper(_ progress: @escaping (String) -> Void) -> (String) -> Void {
        { status in
            let i = min(videoSteps.count - 1, status == "queued" ? 1 : status == "in_progress" ? 3 : 4)
            progress(videoSteps[i])
        }
    }

    // MARK: Image

    static func generateImage(_ p: ImageGenParams, store: AppStore) async throws -> [GeneratedImage] {
        let model = AIModels.imageModel(p.model)
        let count = min(max(p.count, 1), 4)
        let product = remoteURL(store, p.productAssetId)
        let details = ["style \(p.style)", "décor : \(p.background)", "lumière : \(p.lighting)", "cadrage : \(p.camera)", "composition : \(p.composition)"].joined(separator: ", ")
        let prompt = "\(p.prompt). \(details)\(product != nil ? ". Garde le produit de la photo fournie exactement identique (forme, couleurs, étiquette)." : "")"
        // Soul 2 can't use a product photo: it renders from the text only.
        let refs = product != nil && model.acceptsImages ? [product!] : nil
        let cost = model.credits * count
        let urls = try await charged(store, cost: cost) {
            try await images(prompt, count: count, ratio: p.ratio, imageUrls: refs, model: model.id)
        }
        let g = store.addGeneration(kind: .image, prompt: p.prompt, thumbnails: urls, projectId: p.projectId, model: model.label, credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Génération terminée", message: "\(urls.count) image\(urls.count > 1 ? "s sont prêtes" : " est prête") pour « \(p.prompt.prefix(40)) ».")
        return urls.map { GeneratedImage(id: IDGen.make("out"), url: $0, generationId: g.id) }
    }

    /// Same image re-rendered in very high definition.
    static func upscaleImage(url: String, store: AppStore) async throws -> GeneratedImage {
        guard url.hasPrefix("https://") else { throw APIError.failed("Cette image ne peut pas être agrandie : générez-la ou importez-la d’abord.") }
        let cost = AIModels.imageModel(nil).credits + AIModels.upscaleExtra
        let urls = try await charged(store, cost: cost) {
            try await images("Même image, identique, en très haute définition : détails plus nets, sans rien changer.", count: 1, ratio: nil, imageUrls: [url], upscale: true)
        }
        let g = store.addGeneration(kind: .image, prompt: "Agrandissement HD", thumbnails: urls, model: "Marketing Studio", credits: cost)
        return GeneratedImage(id: IDGen.make("out"), url: urls[0], generationId: g.id)
    }

    /// Real edit of an existing image (Marketing Studio edit mode).
    static func editImage(url: String, tool: String, instruction: String? = nil, ratio: String = "4:5", store: AppStore) async throws -> GeneratedImage {
        guard url.hasPrefix("https://") else { throw APIError.failed("Cette image ne peut pas être modifiée : générez-la ou importez-la d’abord.") }
        let base = editInstructions[tool] ?? "Modifie l’image"
        let prompt = "\(base)\(instruction.map { " : \($0)" } ?? "."). Garde le produit identique."
        let cost = AIModels.imageModel(nil).credits
        let urls = try await charged(store, cost: cost) { try await images(prompt, count: 1, ratio: ratio, imageUrls: [url]) }
        let g = store.addGeneration(kind: .image, prompt: "Retouche · \(StudioOptions.label(tool))", thumbnails: urls, model: "Marketing Studio", credits: cost)
        return GeneratedImage(id: IDGen.make("out"), url: urls[0], generationId: g.id)
    }

    private static let editInstructions: [String: String] = [
        "Crop": "Recadre l’image sur le sujet principal",
        "Resize": "Adapte l’image au nouveau format sans déformer le sujet",
        "Remove Background": "Supprime l’arrière-plan : produit détouré sur fond blanc uni",
        "Replace Background": "Remplace l’arrière-plan",
        "Relight": "Refais l’éclairage de la scène",
        "Retouch": "Retouche l’image : nettoie les défauts, améliore la netteté et les couleurs",
        "Add Text": "Ajoute ce texte de façon lisible et soignée",
        "Add Logo": "Ajoute un emplacement de logo discret",
        "Expand Image": "Agrandis la scène autour du sujet en gardant le même style",
    ]

    // MARK: Video

    static func generateVideo(_ p: VideoGenParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> GeneratedVideo {
        progress(videoSteps[0])
        let source = remoteURL(store, p.sourceAssetId)
        let prompt = [p.prompt, "mouvement de caméra : \(p.camera)", "style \(p.style)"].joined(separator: ". ")
        let cost = AIModels.videoCredits(p.model, seconds: p.duration, withPhoto: source != nil)
        let ratio = p.ratio == "4:5" ? "3:4" : p.ratio
        let job = try await charged(store, cost: cost) {
            try await APIClient.run(GenerationRequest(kind: .video, model: p.model, prompt: prompt, imageUrls: source.map { [$0] }, aspectRatio: ratio, durationSec: p.duration, light: store.preferences.lightVideos), onStatus: stepper(progress))
        }
        let poster = source ?? ""
        let g = store.addGeneration(kind: .video, prompt: p.prompt, thumbnails: poster.isEmpty ? [] : [poster], projectId: p.projectId, model: AIModels.videoModel(p.model).label, credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Vidéo générée", message: "Votre vidéo de \(p.duration) s est prête.")
        return GeneratedVideo(id: IDGen.make("out"), posterURL: poster, videoURL: job.videoUrl ?? "", duration: p.duration, generationId: g.id)
    }

    /// One Seedance 2.5 reference-to-video job: the creator's character sheet (+ the product photo)
    /// keeps the same face, hair and outfit in every video; the prompt repeats the creator's look.
    static func generateUGC(_ p: UGCParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> GeneratedVideo {
        guard let creator = store.creator(p.creatorId) else { throw APIError.failed("Choisissez un créateur.") }
        let product = remoteURL(store, p.productAssetId)
        let lang = Market.languageLabel(p.language)
        let cost = AIModels.ugcCredits(seconds: p.duration)
        let references = [creator.sheetURL] + (product.map { [$0] } ?? [])
        let place = " Setting: \(StudioOptions.label(p.location))."
        let prompt = "Vertical selfie-style UGC video. The person is exactly the one in the character sheet: \(creator.look).\(product != nil ? " She/he holds and shows the product from the product photo, keeping it identical." : "")\(place) Talking naturally to the camera in \(lang), tone \(p.tone.lowercased()), says: « \(p.script) »"
        progress("Choix de \(creator.name)")
        let job = try await charged(store, cost: cost) {
            try await APIClient.run(GenerationRequest(kind: .video, prompt: prompt, aspectRatio: "9:16", durationSec: p.duration, light: store.preferences.lightVideos, references: references), onStatus: stepper(progress))
        }
        let poster = product ?? creator.avatarURL
        let g = store.addGeneration(kind: .video, prompt: "UGC · \(creator.name) · \(p.script)", thumbnails: [poster], projectId: p.projectId, model: "Seedance 2.5", credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Vidéo UGC prête", message: "\(creator.name) présente votre produit en \(lang).")
        return GeneratedVideo(id: IDGen.make("out"), posterURL: poster, videoURL: job.videoUrl ?? "", duration: p.duration, generationId: g.id)
    }

    // MARK: Product shoot

    static func generateProductShoot(_ p: ProductShootParams, store: AppStore) async throws -> [GeneratedImage] {
        guard let product = remoteURL(store, p.productAssetId) else { throw APIError.failed("Importez d’abord une photo de votre produit.") }
        let count = min(max(p.count, 1), 4)
        let style = Catalog.style(p.styleId)
        let scene = style?.direction ?? "Place the product in this setting: \(p.environment)."
        let prompt = "\(scene) Lighting: \(p.lighting). Framing: \(p.camera). Keep the product from the photo exactly identical (shape, label, colors). Sharp, realistic advertising photo."
        let cost = AIModels.imageModel(nil).credits * count
        let urls = try await charged(store, cost: cost) {
            try await images(prompt, count: count, ratio: style?.ratio ?? "4:5", imageUrls: [product])
        }
        let g = store.addGeneration(kind: .image, prompt: "Shooting produit · \(style?.name ?? p.environment) · \(p.lighting) · \(p.camera)", thumbnails: urls, projectId: p.projectId, model: "Marketing Studio", credits: cost)
        return urls.map { GeneratedImage(id: IDGen.make("out"), url: $0, generationId: g.id) }
    }

    // MARK: Ads

    private static func adRatio(_ platform: SocialPlatform, _ format: String) -> String {
        let f = format.lowercased()
        if ["story", "reel", "short", "statut", "status"].contains(where: f.contains) || platform == .tiktok || platform == .whatsapp { return "9:16" }
        if f.contains("catalog") { return "1:1" }
        if platform == .youtube || platform == .google { return "16:9" }
        return "4:5"
    }

    static func generateAds(_ p: AdParams, store: AppStore) async throws -> [AdVariation] {
        let headlines = ["\(p.product) : \(p.offer)", "Découvrez \(p.product)", "\(p.offer) — cette semaine seulement", "Pourquoi \(p.audience) adore \(p.product)"]
        let priceLine = p.price.map { " Prix : \($0)." } ?? ""
        let texts = [
            "\(p.product) a été pensé pour \(p.audience). \(p.offer).\(priceLine) \(p.cta) dès aujourd’hui.",
            "Ne vous contentez plus de moins. \(p.product) fait le travail à votre place. \(p.offer).",
            "Offre limitée : \(p.offer) sur \(p.product).\(priceLine) Idéal pour \(p.audience).",
            "De vrais résultats, de vraies personnes. Découvrez pourquoi \(p.product) cartonne auprès de \(p.audience).",
        ]
        let ctas = [p.cta, p.platform == .whatsapp ? "Commander sur WhatsApp" : "En savoir plus", "Profiter de l’offre", p.cta]
        let product = remoteURL(store, p.productAssetId)
        let flyer = p.format.lowercased().contains("flyer")
        let prompt = "Visuel publicitaire \(flyer ? "de flyer imprimable" : "pour \(p.platform.title)") : \(p.product). \(p.offer). Pour \(p.audience). Laisse de l’espace libre pour le texte et le prix, style marketing africain moderne, couleurs vives.\(product != nil ? " Garde le produit de la photo identique." : "")"
        // Two visuals shared by the four copy variants (A/C, B/D) to halve generation cost.
        let cost = AIModels.imageModel(nil).credits * 2
        let visuals = try await charged(store, cost: cost) {
            try await images(prompt, count: 2, ratio: adRatio(p.platform, p.format), imageUrls: product.map { [$0] })
        }
        let vars = ["A", "B", "C", "D"].enumerated().map { i, l in
            AdVariation(id: IDGen.make("var"), label: "Création \(l)", visualURL: visuals[i % visuals.count], headline: headlines[i], primaryText: texts[i], cta: ctas[i], platform: p.platform)
        }
        store.addGeneration(kind: .ad, prompt: "Pub \(p.platform.title) \(p.format) · \(p.product) · \(p.audience) · \(p.offer)", thumbnails: visuals, projectId: p.projectId, model: "Marketing Studio", credits: cost)
        return vars
    }

    // MARK: Copy (built-in templates, free)

    static func generateCopy(_ p: CopyParams, store: AppStore) async throws -> CopyResult {
        try? await Task.sleep(for: .milliseconds(Int.random(in: 500...1000)))
        let body = buildCopy(p)
        let text = p.language == "fr" ? body : "[\(Market.languageLabel(p.language))]\n\(body)"
        store.addGeneration(kind: .copy, prompt: "\(p.tool) · \(p.product) · \(p.tone)", thumbnails: [], model: "Modèles Sokozia", credits: 0, resultText: text)
        store.addCopyResult(tool: p.tool, tone: p.tone, text: text)
        return CopyResult(id: IDGen.make("copy"), tool: p.tool, tone: p.tone, text: text, createdAt: Date())
    }

    static func generateHooks(product: String, audience: String, store: AppStore) async throws -> [HookResult] {
        try? await Task.sleep(for: .milliseconds(Int.random(in: 400...900)))
        let cats = ["Curiosité", "À contre-courant", "POV", "Preuve", "Histoire", "Prix", "Urgence", "Simplicité", "Tendance", "Local"]
        let hooks = Array(Catalog.hookLibrary.shuffled().prefix(10)).enumerated().map { i, t in
            HookResult(id: IDGen.make("hook"), text: t, category: cats[i % cats.count])
        }
        store.addGeneration(kind: .copy, prompt: "10 accroches · \(product) · \(audience)", thumbnails: [], model: "Modèles Sokozia", credits: 0, resultText: hooks.map(\.text).joined(separator: "\n"))
        return hooks
    }

    private static func buildCopy(_ p: CopyParams) -> String {
        let tone = p.tone.lowercased()
        let opener = tone == "luxury" ? "La qualité se remarque tout de suite." : tone == "urgent" ? "Jusqu’à dimanche seulement." : tone == "funny" ? "Votre voisine l’a déjà. Et vous ?" : tone == "bold" ? "C’est lui, le bon." : tone == "minimal" ? "\(p.product)." : "Découvrez \(p.product)."
        let tag = p.product.replacingOccurrences(of: " ", with: "").lowercased()
        let hooks = Catalog.hookLibrary
        switch p.tool {
        case "Product Description":
            return "\(p.product) : un produit de qualité pour \(p.audience). Disponible tout de suite, livraison dans toute la ville, paiement Mobile Money ou à la livraison. Écrivez-nous sur WhatsApp pour réserver le vôtre."
        case "Instagram Caption":
            return "\(opener) \(p.product) est là pour \(p.audience).\n\nCommandes en DM ou sur WhatsApp (lien en bio).\n#\(tag) #madeinafrica #boutique #livraison"
        case "TikTok Caption":
            return "\(opener) pov : \(p.audience) l’a enfin trouvé. Commande sur WhatsApp, lien en bio. #\(tag) #tiktokafrique"
        case "Email":
            return "Objet : \(opener)\n\nBonjour,\n\n\(p.product) est disponible, et il a été pensé pour \(p.audience).\n\nJe commande →"
        case "Headline":
            return [opener, "\(p.product), pensé pour \(p.audience)", "La qualité au juste prix", "Livré chez vous, payé en Mobile Money", "Stock limité, réservez le vôtre"].enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n")
        case "Hook":
            return hooks.prefix(5).enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n")
        case "CTA":
            return ["Commander sur WhatsApp", "Réserver le mien", "Payer en Mobile Money", "Écrivez-nous maintenant", "Passer à la boutique"].enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n")
        case "UGC Script":
            return "[Accroche] \(hooks.first ?? "")\n[Démo] Regardez \(p.product) de près : la finition, la qualité.\n[Preuve] Mes clientes reviennent toutes pour en reprendre.\n[CTA] Écrivez-moi sur WhatsApp, je livre aujourd’hui."
        case "Landing Page Copy":
            return "Hero : \(opener)\nSous-titre : \(p.product) pour \(p.audience).\n\nBénéfices :\n• Qualité vérifiée\n• Livraison rapide dans votre ville\n• Paiement Mobile Money ou à la livraison\n\nCTA : Commander sur WhatsApp"
        case "WhatsApp Status":
            return ["Lundi : \(opener) \(p.product) est arrivé 🔥", "Mardi : Photo du jour. Qui veut le sien ? Répondez à ce statut.", "Mercredi : Prix spécial jusqu’à vendredi.", "Jeudi : Une cliente satisfaite nous a envoyé ceci 🙏", "Vendredi : Derniers articles en stock. Écrivez-moi en privé."].joined(separator: "\n")
        case "WhatsApp Catalog":
            return "Nom : \(p.product)\nDescription : Pensé pour \(p.audience). Qualité vérifiée, livraison rapide.\nPrix : à compléter\nLien : Commander sur WhatsApp"
        case "Voice Note":
            return "🎙 Note vocale · 20 secondes\n\nBonjour à tous ! Nouveau chez nous : \(p.product), pensé pour \(p.audience). Les quantités sont limitées. Pour commander, envoyez-moi simplement un message ici sur WhatsApp. On livre aujourd’hui même. Merci et à tout de suite !"
        default: // Ad Copy
            return "Titre : \(opener)\n\nTexte principal : \(p.product), pensé pour \(p.audience). Qualité garantie, livraison rapide, paiement à la livraison ou par Mobile Money.\n\nCTA : Commander sur WhatsApp"
        }
    }

    // MARK: Campaign

    /// Real visuals (2 ad visuals) + copy variants + a starter calendar.
    static func createCampaign(_ p: CampaignParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> Campaign {
        progress("Analyse de l'objectif")
        let assetIds = Array(store.assets.filter { $0.kind == .image && $0.imageURL.hasPrefix("https://") }.prefix(8).map(\.id))
        progress("Génération des visuels")
        let product = store.assets.first { $0.kind == .image && $0.tags.contains("product") }
        let vars = try await generateAds(AdParams(platform: p.platforms.first ?? .whatsapp, format: "Image", product: store.brand.name.isEmpty ? p.name : store.brand.name, offer: "Offre de lancement", audience: p.audience, productAssetId: product?.id, projectId: p.projectId), store: store)
        progress("Rédaction des textes")
        let visualIds = vars.prefix(2).enumerated().map { i, v in
            store.addAsset(name: "\(p.name) · visuel \(i + 1)", kind: .image, imageURL: v.visualURL, projectId: p.projectId, tags: ["campaign", "generated"]).id
        }
        progress("Création du calendrier")
        var c = store.createCampaign(name: p.name, objective: p.objective, audience: p.audience, platforms: p.platforms, formats: p.formats, projectId: p.projectId, assetIds: visualIds + assetIds, variations: vars)
        c.status = .ready
        let titles = ["Teaser", "Post phare", "Accroche UGC", "Statut WhatsApp", "Relance"]
        let ids = visualIds + assetIds
        c.calendarItems = (0..<5).map { d in
            CalendarItem(id: IDGen.make("cal"), title: titles[d], date: .daysFromNow(Double(d * 2 + 1)), platform: p.platforms.isEmpty ? .whatsapp : p.platforms[d % p.platforms.count], format: ["Reel", "Image", "Vidéo", "Statut", "Carrousel"][d], status: .draft, assetId: ids.indices.contains(d) ? ids[d] : nil)
        }
        store.updateCampaign(c)
        store.pushNotification(kind: .campaignReady, title: "Campagne prête", message: "\(p.name) : visuels, textes et calendrier de départ.")
        return c
    }

    // MARK: Export / upload

    /// Gathers the real files of the selected assets. Files keep their generated format.
    static func exportAssets(ids: [String], format: ExportFormat, quality: ExportQuality, store: AppStore, progress: @escaping (Double, String) -> Void) async throws -> Asset {
        let files = ids.compactMap { store.asset($0) }.filter { ($0.videoURL ?? $0.imageURL).hasPrefix("https://") }
        guard let first = files.first else { throw APIError.failed("Aucun fichier réel à exporter : générez ou importez d’abord des contenus.") }
        for (i, step) in exportSteps.enumerated() {
            progress(Double(i) / Double(exportSteps.count - 1), step)
            try? await Task.sleep(for: .milliseconds(250))
        }
        let urls = files.map { $0.videoURL ?? $0.imageURL }
        let a = store.addAsset(name: "Export de \(files.count) fichier\(files.count == 1 ? "" : "s") (\(format.rawValue), \(quality.label))", kind: .export, imageURL: first.imageURL, projectId: store.currentProjectId, tags: ["export"] + urls.map { "file:\($0)" })
        store.pushNotification(kind: .exportComplete, title: "Export prêt", message: "\(a.name) est prêt à être partagé.")
        return a
    }

    /// URLs of the files included in an export (or the asset's own file).
    static func exportFiles(_ asset: Asset) -> [URL] {
        let urls = asset.tags.filter { $0.hasPrefix("file:") }.map { String($0.dropFirst(5)) }
        return (urls.isEmpty ? [asset.videoURL ?? asset.imageURL] : urls).compactMap(URL.init(string:))
    }

    /// Uploads a product photo to the user's space and adds it to the library.
    static func uploadProduct(image: UIImage, name: String, store: AppStore, progress: @escaping (Double) -> Void) async throws -> Asset {
        progress(0.2)
        let url = try await APIClient.upload(image)
        progress(1)
        return store.addAsset(name: name, kind: .image, imageURL: url, projectId: store.currentProjectId, tags: ["upload", "product"])
    }

    // MARK: Assistant

    static func assistantReply(to message: String, store: AppStore) async -> String {
        try? await Task.sleep(for: .milliseconds(Int.random(in: 600...1200)))
        let m = message.lowercased()
        if m.contains("campagne") || m.contains("campaign") {
            return "Je peux créer une campagne complète : photos produit, une vidéo UGC, des statuts WhatsApp et des pubs Facebook avec votre prix en FCFA. On commence avec l’objectif Ventes ?"
        }
        if m.contains("vidéo") || m.contains("video") || m.contains("reel") {
            return "Une rotation lente de 10 secondes marche très bien pour un produit. J’utilise votre photo principale comme image de départ, en version légère pour WhatsApp."
        }
        if m.contains("texte") || m.contains("légende") || m.contains("caption") {
            return "Je vous propose trois légendes courtes dans le ton de votre marque, avec un appel à commander sur WhatsApp."
        }
        return "Importez une photo produit ou choisissez un modèle, je m’occupe du reste. Que créons-nous aujourd’hui ?"
    }
}
