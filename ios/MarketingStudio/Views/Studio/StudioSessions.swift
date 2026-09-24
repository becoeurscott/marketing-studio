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

    static let videoDurations = [5, 10, 15]
    static let videoCameras = ["Slow zoom", "Orbit", "Handheld", "Push in", "Pull out", "Tracking", "Static"]
    static let videoStyles = ["UGC", "Commercial", "Cinematic", "Product demo", "Lifestyle"]
    static let videoModels = motionModels.map(\.name)
    static let ugcModels = personaModels.map(\.name)

    static let ugcDurations = [15, 30, 60]
    static let ugcLocations = ["Bathroom", "Bedroom", "Kitchen", "Living room", "Outdoors", "Gym", "Car", "Office", "Studio"]
    static let ugcTones = ["Excited", "Casual", "Professional", "Funny", "Luxury", "Authentic"]

    /// Fictional model catalogs shown in the composer's model sheet.
    static let imageModels: [StudioModel] = [
        StudioModel(name: "Lumen 2.5", tagline: "Best overall quality for product visuals", icon: "sparkle", speed: "~20s"),
        StudioModel(name: "Lumen 2.5 Flash", tagline: "Fast drafts, same look", icon: "bolt", speed: "~6s"),
        StudioModel(name: "Verity XL", tagline: "Photoreal skin, fabric and glass", icon: "camera.aperture", speed: "~35s"),
        StudioModel(name: "Atelier 1", tagline: "Editorial and illustrated styles", icon: "paintpalette", speed: "~25s"),
    ]
    static let motionModels: [StudioModel] = [
        StudioModel(name: "Kinetic 3", tagline: "Smooth camera moves, stable products", icon: "sparkle", speed: "~60s"),
        StudioModel(name: "Kinetic 3 Turbo", tagline: "Quick previews at lower detail", icon: "bolt", speed: "~20s"),
        StudioModel(name: "Drift 1.5", tagline: "Cinematic depth and lighting", icon: "film", speed: "~90s"),
    ]
    static let personaModels: [StudioModel] = [
        StudioModel(name: "Persona 2", tagline: "Natural creators, lip-synced script", icon: "sparkle", speed: "~70s"),
        StudioModel(name: "Persona 2 Pro", tagline: "Higher fidelity faces and hands", icon: "person.crop.rectangle", speed: "~2m"),
        StudioModel(name: "Kinetic 3", tagline: "Motion-first, lighter on dialogue", icon: "film", speed: "~60s"),
    ]

    static let promptPlaceholder = "Create a luxury product advertisement for this perfume..."

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
        case .video: return "Video"
        case .ugc: return "UGC"
        case .ads: return "Ads"
        case .copy: return "Copy"
        case .campaign: return "Campaign"
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

    init(_ error: Error) {
        if case MockAPIError.insufficientCredits(let n) = error {
            self = .insufficientCredits(needed: n)
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
    /// Sentence built by the Studio composer ("Create a Luxury product shot of Luma Glow"); not user-editable.
    @Published var leadIn = ""

    @Published private(set) var phase: ImagePhase = .idle
    @Published private(set) var results: [ImageResult] = []
    @Published var selectedId: String?
    @Published private(set) var busyAction: String?

    static let cost = GenerationKind.image.creditCost * 4

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
            productAssetId: productAsset?.id, projectId: store.currentProjectId
        )
        do {
            let out = try await MockAPI.generateImage(params, store: store)
            let name = String(params.prompt.prefix(32))
            results = out.enumerated().map { i, g in
                let asset = store.addAsset(name: "\(name) · \(i + 1)", kind: .image, imageURL: g.url, projectId: store.currentProjectId, tags: [style, ratio, "generated"])
                return ImageResult(id: g.id, url: g.url, assetId: asset.id, generationId: g.generationId)
            }
            selectedId = results.first?.id
            phase = .results
            MSHaptic.success()
            router.toast("4 images ready", style: .success, icon: "sparkles")
        } catch {
            phase = .failed(GenerationFailure(error))
            MSHaptic.warning()
        }
    }

    func upscaleSelected(store: AppStore, router: Router) async {
        guard let r = selected, busyAction == nil else { return }
        busyAction = "upscale"
        defer { busyAction = nil }
        do {
            let g = try await MockAPI.upscaleImage(url: r.url, store: store)
            let upURL = MockData.image("up-\(r.id.suffix(6))", w: 1600, h: 2000)
            let asset = store.addAsset(name: "Upscaled 2× · \(store.asset(r.assetId)?.name ?? "image")", kind: .image, imageURL: upURL, projectId: store.currentProjectId, tags: ["upscaled"])
            replace(r.id, with: ImageResult(id: r.id, url: upURL, assetId: asset.id, generationId: g.generationId, upscaled: true))
            router.toast("Upscaled to 2× (3200 × 4000)", style: .success, icon: "arrow.up.left.and.arrow.down.right")
        } catch {
            router.toast(error.localizedDescription, style: .error)
        }
    }

    /// Replaces the selected result with an edited version (from the Image Editor).
    func applyEdit(tool: String, store: AppStore) {
        guard let r = selected else { return }
        let url = MockData.image("edit-\(tool.prefix(4).lowercased())-\(r.id.suffix(6))")
        let asset = store.addAsset(name: "\(tool) · \(store.asset(r.assetId)?.name ?? "image")", kind: .image, imageURL: url, projectId: store.currentProjectId, tags: ["edited", tool])
        replace(r.id, with: ImageResult(id: r.id, url: url, assetId: asset.id, generationId: r.generationId))
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

    static let cost = GenerationKind.video.creditCost

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
        let params = VideoGenParams(prompt: effectivePrompt, sourceAssetId: sourceAsset?.id, duration: duration, ratio: ratio, camera: camera, style: style, projectId: store.currentProjectId)
        do {
            let v = try await MockAPI.generateVideo(params, store: store) { [weak self] step in
                guard let self else { return }
                let idx = MockAPI.videoSteps.firstIndex(of: step) ?? 0
                withAnimation(MSAnimation.gentle) { self.phase = .generating(step: idx) }
            }
            let asset = store.addAsset(name: "\(style) video · \(duration)s", kind: .video, imageURL: v.posterURL, projectId: store.currentProjectId, tags: [style, ratio, "generated"], durationSeconds: v.duration)
            result = VideoResult(id: v.id, posterURL: v.posterURL, duration: v.duration, assetId: asset.id, ratio: ratio)
            phase = .result
            MSHaptic.success()
            router.toast("Video rendered", style: .success, icon: "video.fill")
        } catch {
            phase = .failed(GenerationFailure(error))
            MSHaptic.warning()
        }
    }
}


// MARK: - UGC session (SPEC §15)

/// Drives the Studio UGC mode: creator + product + script → mock talking-head video.
@MainActor
final class UGCGenSession: ObservableObject {
    @Published var script = ""
    @Published var leadIn = ""
    @Published var productAsset: Asset?
    @Published var creator: Creator?
    @Published var duration = 15
    @Published var ratio = "9:16"
    @Published var location = "Bathroom"
    @Published var tone = "Authentic"
    @Published var model = StudioOptions.ugcModels[0]
    @Published private(set) var phase: VideoPhase = .idle
    @Published private(set) var result: VideoResult?

    static let cost = GenerationKind.video.creditCost
    static let steps = ["Casting creator", "Reading script...", "Building scene 1...", "Adding motion...", "Rendering...", "Finalizing..."]

    var isGenerating: Bool { if case .generating = phase { return true } else { return false } }
    var canGenerate: Bool { creator != nil }

    var effectiveScript: String {
        let s = script.trimmingCharacters(in: .whitespacesAndNewlines)
        let lead = leadIn.trimmingCharacters(in: .whitespacesAndNewlines)
        if !lead.isEmpty { return s.isEmpty ? lead : "\(lead). \(s)" }
        if !s.isEmpty { return s }
        return "Create a \(duration)-second TikTok-style video introducing \(productAsset?.name ?? "this product")."
    }

    func reset() {
        phase = .idle
        result = nil
    }

    func generate(store: AppStore, router: Router) async {
        guard !isGenerating, let creator else { return }
        phase = .generating(step: 0)
        let params = UGCParams(productAssetId: productAsset?.id, creatorId: creator.id, script: effectiveScript, location: location, tone: tone, duration: duration, projectId: store.currentProjectId)
        do {
            var idx = -1
            let v = try await MockAPI.generateUGC(params, store: store) { [weak self] _ in
                guard let self else { return }
                idx = min(idx + 1, Self.steps.count - 1)
                withAnimation(MSAnimation.gentle) { self.phase = .generating(step: idx) }
            }
            let asset = store.addAsset(name: "UGC · \(creator.name) · \(tone)", kind: .video, imageURL: v.posterURL, projectId: store.currentProjectId, tags: ["ugc", tone.lowercased(), ratio], durationSeconds: v.duration)
            result = VideoResult(id: v.id, posterURL: v.posterURL, duration: v.duration, assetId: asset.id, ratio: ratio)
            phase = .result
            MSHaptic.success()
            router.toast("UGC video ready", style: .success, icon: "sparkles")
        } catch {
            phase = .failed(GenerationFailure(error))
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
