import Foundation

// All models are Codable + Identifiable with String ids so they persist to UserDefaults as JSON
// and can later be swapped for real API DTOs without touching the views.

// MARK: - User / Workspace

struct User: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var email: String
    var company: String
    var role: String
    var avatarURL: String
    var plan: Plan
}

enum Plan: String, Codable, CaseIterable, Identifiable {
    case starter, creator, studio, agency
    var id: String { rawValue }
    var title: String {
        switch self {
        case .starter: return "Starter"
        case .creator: return "Créateur"
        case .studio: return "Studio"
        case .agency: return "Agence"
        }
    }
    /// Monthly price in FCFA (converted per country with `Market.price`).
    var monthlyPriceXof: Int {
        switch self {
        case .starter: return 4_900
        case .creator: return 14_900
        case .studio: return 29_900
        case .agency: return 79_900
        }
    }
    var monthlyCredits: Int {
        switch self {
        case .starter: return 300
        case .creator: return 1_000
        case .studio: return 3_000
        case .agency: return 10_000
        }
    }
    var features: [String] {
        switch self {
        case .starter: return ["300 crédits / mois (≈ 30 photos IA)", "≈ 6 vidéos de 5 s", "3 projets", "1 kit de marque", "Générateur d'images", "Rédacteur IA"]
        case .creator: return ["1 000 crédits / mois (≈ 100 photos IA)", "≈ 20 vidéos de 5 s", "Projets illimités", "Créateur vidéo + UGC", "Statuts et catalogue WhatsApp", "Tous les modèles"]
        case .studio: return ["3 000 crédits / mois (≈ 300 photos IA)", "≈ 60 vidéos de 5 s", "Campagnes illimitées", "Création de campagnes + calendrier", "Rendu prioritaire", "10 kits de marque"]
        case .agency: return ["10 000 crédits / mois (≈ 1 000 photos IA)", "≈ 200 vidéos de 5 s", "Kits de marque illimités", "Campagnes illimitées", "Support dédié", "Projets illimités"]
        }
    }
}

enum MemberRole: String, Codable, CaseIterable, Identifiable {
    case owner, admin, editor, viewer
    var id: String { rawValue }
    var title: String {
        switch self {
        case .owner: return "Propriétaire"
        case .admin: return "Administrateur"
        case .editor: return "Éditeur"
        case .viewer: return "Lecteur"
        }
    }
}

struct WorkspaceMember: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var email: String
    var role: MemberRole
    var avatarURL: String
    var joinedAt: Date
}

// MARK: - Projects

enum ProjectStatus: String, Codable, CaseIterable, Identifiable {
    case active, archived
    var id: String { rawValue }
    var title: String { self == .active ? "Actif" : "Archivé" }
}

struct Project: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var description: String
    var brandId: String?
    var thumbnailURL: String
    var status: ProjectStatus
    var createdAt: Date
    var updatedAt: Date
}

// MARK: - Assets

enum AssetKind: String, Codable, CaseIterable, Identifiable {
    case image, video, audio, logo, brand, export
    var id: String { rawValue }
    var title: String {
        switch self {
        case .image: return "Images"
        case .video: return "Vidéos"
        case .audio: return "Audio"
        case .logo: return "Logos"
        case .brand: return "Éléments de marque"
        case .export: return "Exports"
        }
    }
    var icon: String {
        switch self {
        case .image: return "photo"
        case .video: return "film"
        case .audio: return "waveform"
        case .logo: return "seal"
        case .brand: return "paintpalette"
        case .export: return "square.and.arrow.up"
        }
    }
}

struct Asset: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var kind: AssetKind
    var imageURL: String
    var projectId: String?
    var favorite: Bool
    var createdAt: Date
    var tags: [String]
    var width: Int
    var height: Int
    var durationSeconds: Int?
    /// Playable file for videos (`imageURL` is then the poster).
    var videoURL: String? = nil
}

// MARK: - Campaigns

enum CampaignObjective: String, Codable, CaseIterable, Identifiable {
    case awareness, engagement, leads, sales
    var id: String { rawValue }
    var title: String {
        switch self {
        case .awareness: return "Notoriété"
        case .engagement: return "Engagement"
        case .leads: return "Prospects"
        case .sales: return "Ventes"
        }
    }
    var icon: String {
        switch self {
        case .awareness: return "megaphone"
        case .engagement: return "heart.text.square"
        case .leads: return "person.crop.circle.badge.plus"
        case .sales: return "cart"
        }
    }
}

enum SocialPlatform: String, Codable, CaseIterable, Identifiable {
    case whatsapp, facebook, tiktok, instagram, youtube, google, pinterest
    var id: String { rawValue }
    var title: String {
        switch self {
        case .whatsapp: return "WhatsApp"
        case .instagram: return "Instagram"
        case .tiktok: return "TikTok"
        case .facebook: return "Facebook"
        case .youtube: return "YouTube"
        case .google: return "Google"
        case .pinterest: return "Pinterest"
        }
    }
    var icon: String {
        switch self {
        case .whatsapp: return "message.circle"
        case .instagram: return "camera.circle"
        case .tiktok: return "music.note"
        case .facebook: return "person.2.circle"
        case .youtube: return "play.rectangle"
        case .google: return "magnifyingglass.circle"
        case .pinterest: return "pin.circle"
        }
    }
}

enum ContentFormat: String, Codable, CaseIterable, Identifiable {
    case productPhotos, ugc, videoAds, stories, carousels
    var id: String { rawValue }
    var title: String {
        switch self {
        case .productPhotos: return "Photos produit"
        case .ugc: return "UGC"
        case .videoAds: return "Pubs vidéo"
        case .stories: return "Stories"
        case .carousels: return "Carrousels"
        }
    }
}

enum CampaignStatus: String, Codable, CaseIterable, Identifiable {
    case draft, ready, scheduled, live, completed
    var id: String { rawValue }
    var title: String {
        switch self {
        case .draft: return "Brouillon"
        case .ready: return "Prête"
        case .scheduled: return "Programmée"
        case .live: return "En ligne"
        case .completed: return "Terminée"
        }
    }
}

enum CalendarStatus: String, Codable, CaseIterable, Identifiable {
    case draft, scheduled, published
    var id: String { rawValue }
    var title: String {
        switch self {
        case .draft: return "Brouillon"
        case .scheduled: return "Programmé"
        case .published: return "Publié"
        }
    }
}

struct CalendarItem: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var date: Date
    var platform: SocialPlatform
    var format: String
    var status: CalendarStatus
    var assetId: String?
}

struct AdVariation: Codable, Identifiable, Hashable {
    var id: String
    var label: String
    var visualURL: String
    var headline: String
    var primaryText: String
    var cta: String
    var platform: SocialPlatform
}

struct Campaign: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var projectId: String?
    var objective: CampaignObjective
    var audience: String
    var platforms: [SocialPlatform]
    var formats: [ContentFormat]
    var status: CampaignStatus
    var assetIds: [String]
    var calendarItems: [CalendarItem]
    var variations: [AdVariation]
    var createdAt: Date
}

// MARK: - Templates / Creators

/// Sector categories for local merchants (same as the web app).
enum TemplateCategory: String, Codable, CaseIterable, Identifiable {
    case waxCouture, cosmetics, restaurant, electronics, hair, grocery, whatsapp, print, ugc, promo
    var id: String { rawValue }
    var title: String {
        switch self {
        case .waxCouture: return "Wax & couture"
        case .cosmetics: return "Cosmétiques"
        case .restaurant: return "Restauration"
        case .electronics: return "Électronique"
        case .hair: return "Coiffure"
        case .grocery: return "Alimentation"
        case .whatsapp: return "WhatsApp"
        case .print: return "Imprimés"
        case .ugc: return "UGC"
        case .promo: return "Promos"
        }
    }
}

/// Which studio tool a template opens.
enum TemplateMode: String, Codable, Hashable {
    case image, video, ugc, productShoot, ads, copy
    var title: String {
        switch self {
        case .image: return "Image"
        case .video: return "Vidéo"
        case .ugc: return "UGC"
        case .productShoot: return "Shooting produit"
        case .ads: return "Pub"
        case .copy: return "Texte"
        }
    }
}

struct Template: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var description: String
    var category: TemplateCategory
    var platforms: [SocialPlatform]
    /// Display label of the output ("Statut", "Reel", "Flyer"…).
    var format: String
    var thumbnailURL: String
    var prompt: String
    var style: String
    var ratio: String
    var mode: TemplateMode
    var durationSec: Int?
    var popular: Bool
    var uses: Int
}

/// AI creator: a fixed persona with a character sheet (consistency reference) and an intro clip.
struct Creator: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var gender: String
    var ageRange: String
    var age: Int
    var style: String
    var languages: [String]
    var country: String
    /// Portrait (hero image).
    var avatarURL: String
    var sheetURL: String
    var introURL: String
    /// Fixed appearance, repeated in every video prompt.
    var look: String
    var bio: String
    var featured: Bool
}

// MARK: - Generations

enum GenerationKind: String, Codable, CaseIterable, Identifiable {
    case image, video, copy, ad
    var id: String { rawValue }
    var title: String {
        switch self {
        case .image: return "Images"
        case .video: return "Vidéos"
        case .copy: return "Textes"
        case .ad: return "Pubs"
        }
    }
    var icon: String {
        switch self {
        case .image: return "photo.on.rectangle.angled"
        case .video: return "video"
        case .copy: return "text.alignleft"
        case .ad: return "rectangle.stack"
        }
    }
    /// Typical cost shown in lists (the exact cost depends on the model and duration, see AIModels).
    var creditCost: Int {
        switch self {
        case .image: return AIModels.imageModel(nil).credits
        case .video: return AIModels.videoCredits(AIModels.defaultVideo, seconds: 10)
        case .copy: return 0
        case .ad: return AIModels.imageModel(nil).credits * 2
        }
    }
}

enum GenerationStatus: String, Codable, CaseIterable, Identifiable {
    case queued, processing, completed, failed
    var id: String { rawValue }
    var title: String {
        switch self {
        case .queued: return "En file d'attente"
        case .processing: return "En cours"
        case .completed: return "Terminée"
        case .failed: return "Échec"
        }
    }
}

struct Generation: Codable, Identifiable, Hashable {
    var id: String
    var kind: GenerationKind
    var prompt: String
    var status: GenerationStatus
    var thumbnails: [String]
    var projectId: String?
    var model: String
    var creditsSpent: Int
    var createdAt: Date
    var resultText: String?
}

// MARK: - Brand

struct BrandVoice: Codable, Hashable {
    var tone: String
    var writingStyle: String
    var keywords: [String]
    var avoid: [String]
}

struct Brand: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var logoURL: String
    var iconURL: String
    var colors: [String]
    var fonts: [String]
    var website: String
    var description: String
    var industry: String
    var audience: String
    var voice: BrandVoice
    var assetIds: [String]
}

// MARK: - Notifications

enum NotificationKind: String, Codable, CaseIterable, Identifiable {
    case generationComplete, campaignReady, exportComplete, creditsLow, newTemplate, projectShared
    var id: String { rawValue }
    var icon: String {
        switch self {
        case .generationComplete: return "sparkles"
        case .campaignReady: return "flag.checkered"
        case .exportComplete: return "square.and.arrow.down"
        case .creditsLow: return "bolt.badge.clock"
        case .newTemplate: return "rectangle.on.rectangle"
        case .projectShared: return "person.2"
        }
    }
}

struct AppNotification: Codable, Identifiable, Hashable {
    var id: String
    var kind: NotificationKind
    var title: String
    var message: String
    var createdAt: Date
    var read: Bool
    var routeHint: String?
}

// MARK: - Copy / Hooks / Credits

struct CopyResult: Codable, Identifiable, Hashable {
    var id: String
    var tool: String
    var tone: String
    var text: String
    var createdAt: Date
}

struct HookResult: Codable, Identifiable, Hashable {
    var id: String
    var text: String
    var category: String
}

struct CreditTransaction: Codable, Identifiable, Hashable {
    var id: String
    /// Negative for spend, positive for purchase / plan refill.
    var amount: Int
    var reason: String
    var createdAt: Date
}

// MARK: - Onboarding / Preferences

struct OnboardingAnswers: Codable, Hashable {
    var creating: [String] = []
    var role: [String] = []
    var wants: [String] = []
    var platforms: [String] = []
    var goal: [String] = []
}

struct UserPreferences: Codable, Hashable {
    /// Market.countries code (prices, Mobile Money, languages).
    var country: String = Market.defaultCountry
    /// Default text / voice-over language (Market.languages id).
    var language: String = "fr"
    /// Lighter videos (480p) for slow connections and WhatsApp.
    var lightVideos: Bool = true
    var haptics: Bool = true
    var pushNotifications: Bool = true
    var emailDigest: Bool = false
    var defaultRatio: String = "4:5"
    var defaultModel: String = "Marketing Studio"
    var defaultStyle: String = "Product Photography"
    var reduceMotion: Bool = false
}

enum FavoriteKind: String, Codable, CaseIterable, Identifiable {
    case asset, template, prompt, creator
    var id: String { rawValue }
    var title: String {
        switch self {
        case .asset: return "Ressources"
        case .template: return "Modèles"
        case .prompt: return "Prompts"
        case .creator: return "Créateurs"
        }
    }
}

// MARK: - Helpers

enum IDGen {
    static func make(_ prefix: String = "id") -> String {
        prefix + "_" + UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10).lowercased()
    }
}

extension Date {
    static func daysAgo(_ n: Double) -> Date { Date().addingTimeInterval(-n * 86_400) }
    static func daysFromNow(_ n: Double) -> Date { Date().addingTimeInterval(n * 86_400) }

    var relativeString: String {
        let f = RelativeDateTimeFormatter()
        f.locale = Locale(identifier: "fr_FR")
        f.unitsStyle = .short
        return f.localizedString(for: self, relativeTo: Date())
    }

    var shortString: String {
        formatted(.dateTime.month(.abbreviated).day().locale(Locale(identifier: "fr_FR")))
    }
}
