import Foundation

/// Generation models offered in Sokozia, priced in Sokozia credits only (never provider prices).
/// Same ids and costs as the web app (lib/higgsfield/models.ts: Higgsfield credits × 2.5); the server recomputes and charges
/// the cost, these values are for display and the instant "not enough credits" check.
struct VideoModel: Identifiable, Hashable {
    let id: String
    let label: String
    let hint: String
    /// 480p price ("vidéos légères").
    let creditsPerSecond: Int
    /// 720p price when light videos are off (nil = same price).
    let creditsPerSecondHD: Int?
    let minSec: Int
    let maxSec: Int
    /// Can animate a product photo. Models without it fall back to Seedance 2.5 for photos.
    let animatesPhotos: Bool
}

struct ImageModel: Identifiable, Hashable {
    let id: String
    let label: String
    let hint: String
    let credits: Int
    /// Accepts a product photo (keeps the product identical).
    let acceptsImages: Bool
}

enum AIModels {
    // Users see quality levels, never provider names (same tiers and prices as the web app).
    static let video: [VideoModel] = [
        VideoModel(id: "seedance-2.5", label: "Premium", hint: "Le plus réaliste, anime vos photos produit, son inclus", creditsPerSecond: 21, creditsPerSecondHD: 46, minSec: 4, maxSec: 15, animatesPhotos: true),
        VideoModel(id: "kling-3.0", label: "Rapide", hint: "Économique, plusieurs plans, son inclus", creditsPerSecond: 13, creditsPerSecondHD: nil, minSec: 3, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "wan-3.0-prime", label: "Éco", hint: "Le moins cher, jusqu’à 30 s", creditsPerSecond: 7, creditsPerSecondHD: 15, minSec: 2, maxSec: 30, animatesPhotos: false),
        VideoModel(id: "minimax-h3", label: "Ultra HD", hint: "Très haute définition (2K)", creditsPerSecond: 13, creditsPerSecondHD: nil, minSec: 5, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "seedance-2.0", label: "Standard", hint: "Bon équilibre qualité / crédits", creditsPerSecond: 14, creditsPerSecondHD: 30, minSec: 4, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "cinema-studio-4.0", label: "Cinéma", hint: "Rendu cinéma, mise en scène automatique", creditsPerSecond: 21, creditsPerSecondHD: 46, minSec: 4, maxSec: 15, animatesPhotos: false),
    ]

    /// First entry = default (Standard keeps the product identical at 1K, half the price of HD).
    static let image: [ImageModel] = [
        ImageModel(id: "marketing-studio-1k", label: "Standard", hint: "Votre produit reste identique · idéal WhatsApp et réseaux", credits: 23, acceptsImages: true),
        ImageModel(id: "marketing-studio", label: "HD", hint: "Même rendu en haute définition · affiches et impression", credits: 44, acceptsImages: true),
        ImageModel(id: "soul-2", label: "Éco", hint: "Idées, portraits et mode · très économique, le produit peut changer un peu", credits: 4, acceptsImages: false),
    ]

    static let defaultVideo = "seedance-2.5"
    /// Extra credits for the "very high definition" option.
    static let upscaleExtra = 28
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
        return (lightVideos ? m.creditsPerSecond : (m.creditsPerSecondHD ?? m.creditsPerSecond)) * clamp(m, seconds)
    }

    /// UGC = one Seedance 2.5 reference-to-video job (creator sheet + product).
    static func ugcCredits(seconds: Int) -> Int { videoCredits(defaultVideo, seconds: seconds, withPhoto: true) }
}
