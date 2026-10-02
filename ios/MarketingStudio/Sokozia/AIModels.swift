import Foundation

/// Generation models offered in Sokozia, priced in Sokozia credits only (never provider prices).
/// Same ids and costs as the web app (lib/higgsfield/models.ts: Higgsfield credits × 2.5); the server recomputes and charges
/// the cost, these values are for display and the instant "not enough credits" check.
struct VideoModel: Identifiable, Hashable {
    let id: String
    let label: String
    let hint: String
    let creditsPerSecond: Int
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
    static let video: [VideoModel] = [
        VideoModel(id: "seedance-2.5", label: "Seedance 2.5", hint: "Le plus réaliste, anime vos photos produit, son inclus", creditsPerSecond: 28, minSec: 4, maxSec: 15, animatesPhotos: true),
        VideoModel(id: "kling-3.0", label: "Kling 3.0", hint: "Rapide et économique, plans multiples, son inclus", creditsPerSecond: 10, minSec: 3, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "wan-3.0-prime", label: "Wan 3.0 Prime", hint: "Économique, jusqu’à 30 s", creditsPerSecond: 10, minSec: 2, maxSec: 30, animatesPhotos: false),
        VideoModel(id: "minimax-h3", label: "MiniMax H3", hint: "Très haute définition (2K)", creditsPerSecond: 18, minSec: 5, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "seedance-2.0", label: "Seedance 2.0", hint: "Bon équilibre qualité / crédits", creditsPerSecond: 20, minSec: 4, maxSec: 15, animatesPhotos: false),
        VideoModel(id: "cinema-studio-4.0", label: "Cinema Studio 4.0", hint: "Rendu cinéma, mise en scène automatique", creditsPerSecond: 38, minSec: 4, maxSec: 15, animatesPhotos: false),
    ]

    static let image: [ImageModel] = [
        ImageModel(id: "marketing-studio", label: "Marketing Studio", hint: "Photos produit et pubs, garde votre produit identique", credits: 25, acceptsImages: true),
        ImageModel(id: "soul-2", label: "Soul 2", hint: "Portraits et mode réalistes, sans photo produit", credits: 10, acceptsImages: false),
    ]

    static let defaultVideo = "seedance-2.5"
    /// Extra credits for the "very high definition" option.
    static let upscaleExtra = 13

    static func videoModel(_ id: String?) -> VideoModel { video.first { $0.id == id } ?? video[0] }
    /// Accepts an id or a display label.
    static func imageModel(_ idOrLabel: String?) -> ImageModel { image.first { $0.id == idOrLabel || $0.label == idOrLabel } ?? image[0] }

    static func clamp(_ m: VideoModel, _ sec: Int) -> Int { min(m.maxSec, max(m.minSec, sec)) }

    /// Credits charged for one video. Photo-to-video always renders on a model that animates photos.
    static func videoCredits(_ modelId: String?, seconds: Int, withPhoto: Bool = false) -> Int {
        let picked = videoModel(modelId)
        let m = withPhoto && !picked.animatesPhotos ? videoModel(defaultVideo) : picked
        return m.creditsPerSecond * clamp(m, seconds)
    }

    /// UGC = one Seedance 2.5 reference-to-video job (creator sheet + product).
    static func ugcCredits(seconds: Int) -> Int { videoCredits(defaultVideo, seconds: seconds, withPhoto: true) }
}
