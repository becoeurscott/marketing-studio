import Foundation

/// Generation models offered in Sokozia, priced in Sokozia credits only (never provider prices).
/// Same ids and costs as the web app (lib/higgsfield/models.ts: Higgsfield credits × 2.5); the server recomputes and charges
/// the cost, these values are for display and the instant "not enough credits" check.
struct VideoModel: Identifiable, Hashable {
    let id: String
    let label: String
    let hint: String
    /// Higgsfield cost per second at 480p ("vidéos légères"), in $.
    let usdPerSecond: Double
    /// Cost per second at 720p when it differs (nil = same price).
    let usdPerSecondHD: Double?
    /// Credits per second shown in pickers (480p).
    var creditsPerSecond: Int { Int((usdPerSecond * AIModels.xofPerUsd * AIModels.margin / AIModels.creditXof).rounded(.up)) }
    let minSec: Int
    let maxSec: Int
    /// Can animate a product photo. Models without it fall back to Seedance 2.5 for photos.
    let animatesPhotos: Bool
}

struct ImageModel: Identifiable, Hashable {
    let id: String
    let label: String
    let hint: String
    /// Higgsfield cost per image, in $.
    let usd: Double
    var credits: Int { AIModels.creditsFor(usd: usd) }
    /// Accepts a product photo (keeps the product identical).
    let acceptsImages: Bool
}

enum AIModels {
    // Users see quality levels, never provider names (same tiers and prices as the web app).
    static let video: [VideoModel] = [
        VideoModel(id: "seedance-2.5", label: "Premium", hint: "Le plus réaliste, anime vos photos produit, son inclus", usdPerSecond: 0.2056, usdPerSecondHD: 0.4622, minSec: 4, maxSec: 15, animatesPhotos: true),
        VideoModel(id: "kling-3.0", label: "Rapide", hint: "Économique, plusieurs plans, son inclus", usdPerSecond: 0.126, usdPerSecondHD: nil, minSec: 3, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "wan-3.0-prime", label: "Éco", hint: "Le moins cher, jusqu’à 30 s", usdPerSecond: 0.0272, usdPerSecondHD: 0.056, minSec: 2, maxSec: 30, animatesPhotos: false),
        VideoModel(id: "minimax-h3", label: "Ultra HD", hint: "Très haute définition (2K)", usdPerSecond: 0.13, usdPerSecondHD: nil, minSec: 5, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "seedance-2.0", label: "Standard", hint: "Bon équilibre qualité / crédits", usdPerSecond: 0.1345, usdPerSecondHD: 0.3024, minSec: 4, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "cinema-studio-4.0", label: "Cinéma", hint: "Rendu cinéma, mise en scène automatique", usdPerSecond: 0.2056, usdPerSecondHD: 0.4622, minSec: 4, maxSec: 15, animatesPhotos: false),
    ]

    /// First entry = default (Standard keeps the product identical at 1K, half the price of HD).
    static let image: [ImageModel] = [
        ImageModel(id: "marketing-studio-1k", label: "Standard", hint: "Votre produit reste identique · idéal WhatsApp et réseaux", usd: 0.235, acceptsImages: true),
        ImageModel(id: "marketing-studio", label: "HD", hint: "Même rendu en haute définition · affiches et impression", usd: 0.452, acceptsImages: true),
        ImageModel(id: "soul-2", label: "Éco", hint: "Idées, portraits et mode · très économique, le produit peut changer un peu", usd: 0.006, acceptsImages: false),
    ]

    static let defaultVideo = "seedance-2.5"
    /// Extra credits for the "very high definition" option.
    /// Pricing rule (same as the web): user pays the Higgsfield cost × 1.5, in credits of 10 FCFA.
    static let creditXof = 10.0
    static let margin = 1.5
    static let xofPerUsd = 590.0
    static func creditsFor(usd: Double) -> Int { max(1, Int((usd * xofPerUsd * margin / creditXof - 1e-9).rounded(.up))) }
    /// 4K re-render of an image, Higgsfield cost in $.
    static let upscaleUsd = 0.735
    /// Light videos (480p) use the lower per-second price; set from Réglages.
    nonisolated(unsafe) static var lightVideos = true

    static func videoModel(_ id: String?) -> VideoModel { video.first { $0.id == id } ?? video[0] }
    /// Accepts an id or a display label.
    static func imageModel(_ idOrLabel: String?) -> ImageModel { image.first { $0.id == idOrLabel || $0.label == idOrLabel } ?? image[0] }

    static func clamp(_ m: VideoModel, _ sec: Int) -> Int { min(m.maxSec, max(m.minSec, sec)) }

    /// Credits charged for one video. Photo-to-video always renders on a model that animates photos.
    static func videoCredits(_ modelId: String?, seconds: Int, withPhoto: Bool = false) -> Int {
        let picked = videoModel(modelId)
        let m = withPhoto && !picked.animatesPhotos ? videoModel(defaultVideo) : picked
        return creditsFor(usd: (lightVideos ? m.usdPerSecond : (m.usdPerSecondHD ?? m.usdPerSecond)) * Double(clamp(m, seconds)))
    }

    /// UGC = one Seedance 2.5 reference-to-video job (creator sheet + product).
    static func ugcCredits(seconds: Int) -> Int { videoCredits(defaultVideo, seconds: seconds, withPhoto: true) }
}
