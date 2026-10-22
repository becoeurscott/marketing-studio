import SwiftUI
import Combine

// MARK: - Option catalogs (SPEC §11, §14)

enum StudioOptions {
    static let styles = ["Product Photography", "Luxury", "Minimal", "Street", "Lifestyle", "Editorial", "Cinematic", "UGC", "Studio", "Fashion", "Food", "Tech"]
    static let ratios = ["1:1", "4:5", "9:16", "16:9", "3:2"]
    static let backgrounds = ["Studio", "White", "Gradient", "Marble", "Wood", "Outdoor", "Transparent"]
    static let lighting = ["Natural", "Golden hour", "Studio", "Neon", "Softbox", "Dramatic"]
    static let cameras = ["Close-up", "Medium", "Wide", "Macro"]
    static let compositions = ["Centered", "Rule of thirds", "Flat lay", "Hero angle", "Top-down"]
    static let models = imageModels.map(\.name)

    static let videoDurations = [5, 8, 10, 15]
    static let videoCameras = ["Slow zoom", "Orbit", "Handheld", "Push in", "Pull out", "Tracking", "Static"]
    static let videoStyles = ["UGC", "Commercial", "Cinematic", "Product demo", "Lifestyle"]
    static let videoModels = motionModels.map(\.name)
    static let ugcModels = personaModels.map(\.name)

    static let ugcDurations = [5, 10, 15]
    static let ugcLocations = ["Boutique", "Marché", "Maquis", "Salon de coiffure", "Cour familiale", "Salon", "Chambre", "Cuisine", "Rue", "Studio"]
    static let ugcTones = ["Excited", "Casual", "Professional", "Funny", "Luxury", "Authentic"]

    /// Real models (AIModels), shown in the composer's model sheet with their price in credits.
    static let imageModels: [StudioModel] = AIModels.image.map {
        StudioModel(name: $0.label, tagline: $0.hint, icon: $0.acceptsImages ? "shippingbox" : "person.crop.square", speed: "\($0.credits) cr / image")
    }
    static let motionModels: [StudioModel] = AIModels.video.map {
        StudioModel(name: $0.label, tagline: $0.hint, icon: $0.id == AIModels.defaultVideo ? "sparkle" : "film", speed: "\($0.creditsPerSecond) cr / s")
    }
    /// UGC always renders with Seedance 2.5 reference-to-video (keeps the creator identical).
    static let personaModels: [StudioModel] = [
        StudioModel(name: "Créateur IA", tagline: "Le créateur reste identique d'une vidéo à l'autre, son inclus", icon: "sparkle", speed: "\(AIModels.videoModel(AIModels.defaultVideo).creditsPerSecond) cr / s"),
    ]

    static func videoModelId(_ label: String) -> String { AIModels.video.first { $0.label == label }?.id ?? AIModels.defaultVideo }

    static let promptPlaceholder = "Créez une pub pour ce beurre de karité, sur un étal de marché..."

    /// French display label for an option value. Values themselves stay English (used in params/persistence).
    static func label(_ value: String) -> String { frLabels[value] ?? value }

    private static let frLabels: [String: String] = [
        // Styles
        "Product Photography": "Photo produit", "Luxury": "Luxe", "Minimal": "Minimaliste", "Street": "Urbain",
        "Lifestyle": "Lifestyle", "Editorial": "Éditorial", "Cinematic": "Cinématique", "Studio": "Studio",
        "Fashion": "Mode", "Food": "Culinaire", "Tech": "Tech", "Commercial": "Publicitaire", "Product demo": "Démo produit",
        // Backgrounds
        "White": "Blanc", "Gradient": "Dégradé", "Marble": "Marbre", "Wood": "Bois", "Outdoor": "Extérieur", "Transparent": "Transparent",
        // Lighting
        "Natural": "Naturel", "Golden hour": "Heure dorée", "Neon": "Néon", "Softbox": "Softbox", "Dramatic": "Dramatique",
        // Cameras
        "Close-up": "Gros plan", "Medium": "Plan moyen", "Wide": "Plan large", "Macro": "Macro",
        "Slow zoom": "Zoom lent", "Orbit": "Orbite", "Handheld": "Caméra à l'épaule", "Push in": "Travelling avant",
        "Pull out": "Travelling arrière", "Tracking": "Suivi", "Static": "Fixe",
        // Compositions
        "Centered": "Centrée", "Rule of thirds": "Règle des tiers", "Flat lay": "Flat lay", "Hero angle": "Angle héroïque", "Top-down": "Vue de dessus",
        // UGC locations
        "Bathroom": "Salle de bain", "Bedroom": "Chambre", "Kitchen": "Cuisine", "Living room": "Salon", "Outdoors": "Extérieur",
        "Gym": "Salle de sport", "Car": "Voiture", "Office": "Bureau",
        // UGC tones
        "Excited": "Enthousiaste", "Casual": "Décontracté", "Professional": "Professionnel", "Funny": "Drôle", "Authentic": "Authentique",
        // Editor tools
        "Crop": "Recadrer", "Resize": "Redimensionner", "Remove Background": "Supprimer l'arrière-plan",
        "Replace Background": "Remplacer l'arrière-plan", "Relight": "Rééclairer", "Retouch": "Retoucher",
        "Add Text": "Ajouter du texte", "Add Logo": "Ajouter un logo", "Expand Image": "Agrandir l'image",
    ]

    static func aspect(_ ratio: String) -> CGFloat {
        let parts = ratio.split(separator: ":").compactMap { Double($0) }
        guard parts.count == 2, parts[1] > 0 else { return 0.8 }
        return CGFloat(parts[0] / parts[1])
    }
}

struct StudioModel: Identifiable, Hashable {
    var name: String
    var tagline: String
    var icon: String
    var speed: String
    var id: String { name }
}

// MARK: - Studio modes (SPEC §10)

enum StudioMode: Int, CaseIterable, Identifiable {
    case image, video, ugc, ads, copy, campaign
    var id: Int { rawValue }
    var title: String {
        switch self {
        case .image: return "Image"
        case .video: return "Vidéo"
        case .ugc: return "UGC"
        case .ads: return "Pubs"
        case .copy: return "Textes"
        case .campaign: return "Campagne"
        }
    }
    /// Modes that live on their own screens (built by other agents).
    /// Modes rendered on the Studio canvas.
    var isCanvas: Bool { externalRoute == nil }
    var externalRoute: AppRoute? {
        switch self {
        case .ads: return .adCreator
        case .copy: return .copywriter
        case .campaign: return .campaignBuilder
        default: return nil
        }
    }
}

// MARK: - Generation errors (SPEC §45)

enum GenerationFailure: Equatable {
    case insufficientCredits(needed: Int)
    case generic(String)

    init(_ error: Error, cost: Int) {
        if case APIError.insufficientCredits = error {
            self = .insufficientCredits(needed: cost)
        } else {
            self = .generic(error.localizedDescription)
        }
    }
}

// MARK: - Image session

struct ImageResult: Identifiable, Hashable {
    let id: String
    var url: String
    var assetId: String
    var generationId: String
    var upscaled: Bool = false
}

enum ImagePhase: Equatable {
    case idle
    case generating
    case results
    case failed(GenerationFailure)
}

/// Drives the image flow for both the Studio canvas and the standalone Image Generator screen.
@MainActor
final class ImageGenSession: ObservableObject {
    @Published var prompt = ""
    @Published var style = "Product Photography"
    @Published var ratio = "4:5"
    @Published var background = "Studio"
    @Published var lighting = "Softbox"
    @Published var camera = "Medium"
    @Published var composition = "Centered"
    @Published var model = StudioOptions.models[0]
    @Published var productAsset: Asset?
    /// Sentence built by the Studio composer ("Créer une photo produit de mon parfum"); not user-editable.
    @Published var leadIn = ""

    @Published private(set) var phase: ImagePhase = .idle
    @Published private(set) var results: [ImageResult] = []
    @Published var selectedId: String?
    @Published private(set) var busyAction: String?

    /// Images per generation.
    var count = 2
    var cost: Int { AIModels.imageModel(model).credits * count }

    init(defaults: UserPreferences? = nil) {
        if let defaults {
            style = defaults.defaultStyle
            ratio = defaults.defaultRatio
            model = defaults.defaultModel
        }
    }

    var selected: ImageResult? { results.first { $0.id == selectedId } ?? results.first }
    var isGenerating: Bool { phase == .generating }
    var hasResults: Bool { !results.isEmpty }

    var canGenerate: Bool { !prompt.trimmingCharacters(in: .whitespaces).isEmpty || productAsset != nil || !leadIn.isEmpty }

    var effectivePrompt: String {
        let p = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        let lead = leadIn.trimmingCharacters(in: .whitespacesAndNewlines)
        if !lead.isEmpty { return p.isEmpty ? lead : "\(lead). \(p)" }
        if !p.isEmpty { return p }
        if let productAsset { return "\(style) shot of \(productAsset.name), \(lighting.lowercased()) light" }
        return "\(style) product visual"
    }

    func applyTemplate(_ t: Template) {
        prompt = t.prompt
        style = StudioOptions.styles.contains(t.style) ? t.style : style
        ratio = StudioOptions.ratios.contains(t.ratio) ? t.ratio : ratio
    }

    func reset() {
        phase = .idle
        results = []
        selectedId = nil
    }

    func generate(store: AppStore, router: Router) async {
        guard !isGenerating else { return }
        phase = .generating
        let params = ImageGenParams(
            prompt: effectivePrompt, style: style, ratio: ratio, background: background,
            lighting: lighting, camera: camera, composition: composition,
            productAssetId: productAsset?.id, projectId: store.currentProjectId,
            model: model, count: count
        )
        do {
            let out = try await API.generateImage(params, store: store)
            let name = String(params.prompt.prefix(32))
            results = out.enumerated().map { i, g in
                let asset = store.addAsset(name: "\(name) · \(i + 1)", kind: .image, imageURL: g.url, projectId: store.currentProjectId, tags: [style, ratio, "generated"])
                return ImageResult(id: g.id, url: g.url, assetId: asset.id, generationId: g.generationId)
            }
            selectedId = results.first?.id
            phase = .results
            MSHaptic.success()
            router.toast("\(results.count) images prêtes", style: .success, icon: "sparkles")
        } catch {
            phase = .failed(GenerationFailure(error, cost: cost))
            MSHaptic.warning()
        }
    }

    func upscaleSelected(store: AppStore, router: Router) async {
        guard let r = selected, busyAction == nil else { return }
        busyAction = "upscale"
        defer { busyAction = nil }
        do {
            let g = try await API.upscaleImage(url: r.url, store: store)
            let asset = store.addAsset(name: "HD · \(store.asset(r.assetId)?.name ?? "image")", kind: .image, imageURL: g.url, projectId: store.currentProjectId, tags: ["upscaled"])
            replace(r.id, with: ImageResult(id: r.id, url: g.url, assetId: asset.id, generationId: g.generationId, upscaled: true))
            router.toast("Image agrandie en haute définition", style: .success, icon: "arrow.up.left.and.arrow.down.right")
        } catch {
            router.toast(error.localizedDescription, style: .error)
        }
    }

    /// Replaces the selected result with a real edited version (from the Image Editor).
    func applyEdit(tool: String, store: AppStore, router: Router) async {
        guard let r = selected, busyAction == nil else { return }
        busyAction = "edit"
        defer { busyAction = nil }
        router.toast("\(StudioOptions.label(tool)) en cours…", style: .info, icon: "wand.and.stars")
        do {
            let g = try await API.editImage(url: r.url, tool: tool, ratio: ratio, store: store)
            let asset = store.addAsset(name: "\(StudioOptions.label(tool)) · \(store.asset(r.assetId)?.name ?? "image")", kind: .image, imageURL: g.url, projectId: store.currentProjectId, tags: ["edited", tool])
            replace(r.id, with: ImageResult(id: r.id, url: g.url, assetId: asset.id, generationId: g.generationId))
            router.toast("\(StudioOptions.label(tool)) appliqué", style: .success, icon: "wand.and.stars")
        } catch {
            router.toast(error.localizedDescription, style: .error)
        }
    }

    private func replace(_ id: String, with new: ImageResult) {
        guard let i = results.firstIndex(where: { $0.id == id }) else { return }
        withAnimation(MSAnimation.gentle) { results[i] = new }
    }
}

// MARK: - Video session

struct VideoResult: Identifiable, Hashable {
    let id: String
    var posterURL: String
    var videoURL: String
    var duration: Int
    var assetId: String
    var ratio: String
}

enum VideoPhase: Equatable {
    case idle
    case generating(step: Int)
    case result
    case failed(GenerationFailure)
}

/// Drives the video flow for the Studio VIDEO mode and the standalone Video Generator.
@MainActor
final class VideoGenSession: ObservableObject {
    @Published var concept = ""
    @Published var sourceAsset: Asset?
    @Published var duration = 10
    @Published var ratio = "9:16"
    @Published var camera = "Slow zoom"
    @Published var style = "Commercial"
    @Published var model = StudioOptions.videoModels[0]
    @Published var leadIn = ""
    @Published private(set) var phase: VideoPhase = .idle
    @Published private(set) var result: VideoResult?

    var cost: Int { AIModels.videoCredits(StudioOptions.videoModelId(model), seconds: duration, withPhoto: sourceAsset != nil) }

    var isGenerating: Bool { if case .generating = phase { return true } else { return false } }
    var canGenerate: Bool { sourceAsset != nil || !concept.trimmingCharacters(in: .whitespaces).isEmpty || !leadIn.isEmpty }

    var effectivePrompt: String {
        let c = concept.trimmingCharacters(in: .whitespacesAndNewlines)
        let lead = leadIn.trimmingCharacters(in: .whitespacesAndNewlines)
        if !lead.isEmpty { return c.isEmpty ? lead : "\(lead). \(c)" }
        if !c.isEmpty { return c }
        return "\(style) \(duration)s video, \(camera.lowercased()) on \(sourceAsset?.name ?? "product")"
    }

    func reset() {
        phase = .idle
        result = nil
    }

    func generate(store: AppStore, router: Router) async {
        guard !isGenerating else { return }
        phase = .generating(step: 0)
        let params = VideoGenParams(prompt: effectivePrompt, sourceAssetId: sourceAsset?.id, duration: duration, ratio: ratio, camera: camera, style: style, model: StudioOptions.videoModelId(model), projectId: store.currentProjectId)
        do {
            let v = try await API.generateVideo(params, store: store) { [weak self] step in
                guard let self else { return }
                let idx = API.videoSteps.firstIndex(of: step) ?? 0
                withAnimation(MSAnimation.gentle) { self.phase = .generating(step: idx) }
            }
            let asset = store.addAsset(name: "Vidéo \(StudioOptions.label(style)) · \(duration)s", kind: .video, imageURL: v.posterURL, projectId: store.currentProjectId, tags: [style, ratio, "generated"], durationSeconds: v.duration, videoURL: v.videoURL)
            result = VideoResult(id: v.id, posterURL: v.posterURL, videoURL: v.videoURL, duration: v.duration, assetId: asset.id, ratio: ratio)
            phase = .result
            MSHaptic.success()
            router.toast("Vidéo générée", style: .success, icon: "video.fill")
        } catch {
            phase = .failed(GenerationFailure(error, cost: cost))
            MSHaptic.warning()
        }
    }
}


// MARK: - UGC session (SPEC §15)

/// Drives the Studio UGC mode: creator + optional product + script → talking video (Seedance 2.5,
/// creator character sheet as reference so the person stays the same).
@MainActor
final class UGCGenSession: ObservableObject {
    @Published var script = ""
    @Published var leadIn = ""
    @Published var productAsset: Asset?
    @Published var creator: Creator?
    @Published var duration = 15
    @Published var ratio = "9:16"
    @Published var location = "Boutique"
    @Published var tone = "Authentic"
    /// Voice-over language (Market.languages id).
    @Published var language = "fr"
    @Published var model = StudioOptions.ugcModels[0]
    @Published private(set) var phase: VideoPhase = .idle
    @Published private(set) var result: VideoResult?

    var cost: Int { AIModels.ugcCredits(seconds: duration) }
    static let steps = ["Choix du créateur", "Lecture du script...", "Création de la scène 1...", "Ajout du mouvement...", "Rendu...", "Finalisation..."]

    var isGenerating: Bool { if case .generating = phase { return true } else { return false } }
    var canGenerate: Bool { creator != nil }

    var effectiveScript: String {
        let s = script.trimmingCharacters(in: .whitespacesAndNewlines)
        let lead = leadIn.trimmingCharacters(in: .whitespacesAndNewlines)
        if !lead.isEmpty { return s.isEmpty ? lead : "\(lead). \(s)" }
        if !s.isEmpty { return s }
        return "Bonjour ! Je vous présente \(productAsset?.name ?? "mon produit préféré"). Écrivez-nous sur WhatsApp pour commander."
    }

    func reset() {
        phase = .idle
        result = nil
    }

    func generate(store: AppStore, router: Router) async {
        guard !isGenerating, let creator else { return }
        phase = .generating(step: 0)
        let params = UGCParams(productAssetId: productAsset?.id, creatorId: creator.id, script: effectiveScript, location: location, tone: tone, language: language, duration: duration, projectId: store.currentProjectId)
        do {
            var idx = -1
            let v = try await API.generateUGC(params, store: store) { [weak self] _ in
                guard let self else { return }
                idx = min(idx + 1, Self.steps.count - 1)
                withAnimation(MSAnimation.gentle) { self.phase = .generating(step: idx) }
            }
            let asset = store.addAsset(name: "UGC · \(creator.name) · \(StudioOptions.label(tone))", kind: .video, imageURL: v.posterURL, projectId: store.currentProjectId, tags: ["ugc", tone.lowercased(), ratio], durationSeconds: v.duration, videoURL: v.videoURL)
            result = VideoResult(id: v.id, posterURL: v.posterURL, videoURL: v.videoURL, duration: v.duration, assetId: asset.id, ratio: ratio)
            phase = .result
            MSHaptic.success()
            router.toast("Vidéo UGC prête", style: .success, icon: "sparkles")
        } catch {
            phase = .failed(GenerationFailure(error, cost: cost))
            MSHaptic.warning()
        }
    }
}

// MARK: - Studio undo / redo history

struct StudioSnapshot: Equatable {
    var prompt: String
    var productAssetId: String?
    var selectedResultId: String?
}

/// Small linear undo stack for canvas-level changes (prompt edits, product swaps, selection).
struct StudioHistory {
    private(set) var past: [StudioSnapshot] = []
    private(set) var future: [StudioSnapshot] = []
    var current: StudioSnapshot

    init(_ initial: StudioSnapshot) { current = initial }

    var canUndo: Bool { !past.isEmpty }
    var canRedo: Bool { !future.isEmpty }

    mutating func record(_ s: StudioSnapshot) {
        guard s != current else { return }
        past.append(current)
        if past.count > 40 { past.removeFirst() }
        current = s
        future.removeAll()
    }

    mutating func undo() -> StudioSnapshot? {
        guard let p = past.popLast() else { return nil }
        future.append(current)
        current = p
        return p
    }

    mutating func redo() -> StudioSnapshot? {
        guard let f = future.popLast() else { return nil }
        past.append(current)
        current = f
        return f
    }
}
