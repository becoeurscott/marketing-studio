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
        case .insufficientCredits(let n): return "You need \(n) credits for this. Top up to continue."
        case .failed(let m): return m
        }
    }
}

// MARK: - Mock API

/// Simulated backend. Every call waits 0.6–2.5s, charges credits through the store,
/// records a Generation and returns fake results. Replace bodies with real calls later.
@MainActor
enum MockAPI {

    static let videoSteps = ["Preparing assets", "Building scene 1...", "Adding motion...", "Rendering...", "Finalizing..."]
    static let exportSteps = ["Collecting assets", "Rendering files", "Packaging", "Done"]

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
        try charge(store, cost, "Image generation × 4")
        await delay(1.2, 2.5)
        let s = slug()
        let urls = (1...4).map { MockData.image("img-\(s)-\($0)") }
        let g = store.addGeneration(kind: .image, prompt: p.prompt, thumbnails: urls, projectId: p.projectId, credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Generation complete", message: "4 images are ready for \"\(p.prompt.prefix(40))\".")
        return urls.map { GeneratedImage(id: IDGen.make("out"), url: $0, generationId: g.id) }
    }

    static func upscaleImage(url: String, store: AppStore) async throws -> GeneratedImage {
        try charge(store, 15, "Upscale")
        await delay(0.8, 1.6)
        let g = store.addGeneration(kind: .image, prompt: "Upscale 2×", thumbnails: [url], credits: 15)
        return GeneratedImage(id: IDGen.make("out"), url: url, generationId: g.id)
    }

    // MARK: Video

    static func generateVideo(_ p: VideoGenParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> GeneratedVideo {
        let cost = GenerationKind.video.creditCost
        try charge(store, cost, "Video generation (\(p.duration)s)")
        for step in videoSteps {
            progress(step)
            await wait(Double.random(in: 0.5...0.9))
        }
        let poster = MockData.image("vid-\(slug())", w: 720, h: 1280)
        let g = store.addGeneration(kind: .video, prompt: p.prompt, thumbnails: [poster], projectId: p.projectId, model: "Motion v1", credits: cost)
        store.pushNotification(kind: .generationComplete, title: "Video rendered", message: "\(p.duration)s \(p.style.lowercased()) video is ready.")
        return GeneratedVideo(id: IDGen.make("out"), posterURL: poster, duration: p.duration, generationId: g.id)
    }

    static func generateUGC(_ p: UGCParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> GeneratedVideo {
        let cost = GenerationKind.video.creditCost
        try charge(store, cost, "UGC video")
        let creatorName = store.creator(p.creatorId)?.name ?? "Creator"
        for step in ["Casting \(creatorName)", "Reading script...", "Building scene 1...", "Adding motion...", "Rendering...", "Finalizing..."] {
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
        try charge(store, cost, "Product shoot × \(p.count)")
        await delay(1.4, 2.5)
        let s = slug()
        let urls = (1...p.count).map { MockData.image("shoot-\(s)-\($0)") }
        let g = store.addGeneration(kind: .image, prompt: "Product shoot · \(p.environment) · \(p.lighting) · \(p.camera)", thumbnails: urls, projectId: p.projectId, credits: cost)
        return urls.map { GeneratedImage(id: IDGen.make("out"), url: $0, generationId: g.id) }
    }

    // MARK: Ads

    static func generateAds(_ p: AdParams, store: AppStore) async throws -> [AdVariation] {
        let cost = GenerationKind.ad.creditCost
        try charge(store, cost, "Ad variations × 4")
        await delay(1.0, 2.2)
        let s = slug()
        let headlines = ["\(p.product): \(p.offer)", "Made for \(p.audience.lowercased())", "The upgrade you've been waiting for", "\(p.offer). Today only."]
        let bodies = [
            "Premium quality, honest pricing. \(p.offer) for a limited time.",
            "Designed for \(p.audience.lowercased()) who want more from every day.",
            "Thousands already switched. See why \(p.product) is different.",
            "Don't wait — \(p.offer.lowercased()) ends soon. Tap to claim yours.",
        ]
        let vars = ["A", "B", "C", "D"].enumerated().map { i, l in
            AdVariation(id: IDGen.make("var"), label: "Creative \(l)", visualURL: MockData.image("ad-\(s)-\(l)"), headline: headlines[i], primaryText: bodies[i], cta: p.cta, platform: p.platform)
        }
        store.addGeneration(kind: .ad, prompt: "\(p.platform.title) \(p.format) ad · \(p.product) · \(p.audience) · \(p.offer)", thumbnails: vars.map { $0.visualURL }, projectId: p.projectId, model: "Ads v1", credits: cost)
        return vars
    }

    // MARK: Copy

    static func generateCopy(_ p: CopyParams, store: AppStore) async throws -> CopyResult {
        let cost = GenerationKind.copy.creditCost
        try charge(store, cost, "Copywriter · \(p.tool)")
        await delay(0.6, 1.6)
        let voice = store.brand.voice
        let text: String
        switch p.tool {
        case "Instagram Caption":
            text = "Meet your everyday glow. \(p.product) does the work so your routine doesn't have to. Clean formula, real results. ✨ #\(p.product.replacingOccurrences(of: " ", with: "").lowercased())"
        case "TikTok Caption":
            text = "POV: your skin finally gets it 💧 \(p.product) is the one. #skincare #glow #fyp"
        case "Email":
            text = "Subject: Your glow, delivered.\n\nHi there,\n\n\(p.product) is here. Built for \(p.audience.lowercased()), designed for every day. \(voice.writingStyle)\n\nTap below to \(p.goal.lowercased() == "sales" ? "shop the launch" : "learn more").\n\n— Team Luma"
        case "Headline":
            text = "\(p.product). Glow, simplified."
        case "Hook":
            text = MockData.hookLibrary.randomElement() ?? "Nobody tells you this about..."
        case "CTA":
            text = "Get your glow — Shop now"
        case "UGC Script":
            text = "[Hook] Okay, I need to talk about \(p.product).\n[Problem] I tried everything for dull skin.\n[Product] Then I found this. Three drops, every morning.\n[Proof] Two weeks in and people are asking what changed.\n[CTA] Link's below — trust me on this one."
        case "Landing Page Copy":
            text = "# \(p.product)\n\nBrighter skin, simpler routine.\n\nA vitamin C serum designed for everyday use. Light, clean and made for \(p.audience.lowercased()).\n\n**Shop now** · Free shipping over $40"
        case "Product Description":
            text = "\(p.product) is a vitamin C brightening serum designed for everyday skincare routines. Lightweight and fast-absorbing, it evens tone and adds glow without heaviness. Made for \(p.audience.lowercased())."
        default:
            text = "\(p.product) — the \(p.tone.lowercased()) choice for \(p.audience.lowercased()). \(voice.writingStyle) Shop today."
        }
        store.addGeneration(kind: .copy, prompt: "\(p.tool) · \(p.product) · \(p.tone)", thumbnails: [], model: "Writer v3", credits: cost, resultText: text)
        store.addCopyResult(tool: p.tool, tone: p.tone, text: text)
        return CopyResult(id: IDGen.make("copy"), tool: p.tool, tone: p.tone, text: text, createdAt: Date())
    }

    static func generateHooks(product: String, audience: String, store: AppStore) async throws -> [HookResult] {
        let cost = GenerationKind.copy.creditCost * 2
        try charge(store, cost, "Hook generator × 10")
        await delay(0.8, 1.8)
        let cats = ["Curiosity", "Contrarian", "POV", "Pattern interrupt", "Story", "Authority", "Urgency", "Simplicity", "Trend", "Proof"]
        let hooks = Array(MockData.hookLibrary.shuffled().prefix(10)).enumerated().map { i, t in
            HookResult(id: IDGen.make("hook"), text: t.replacingOccurrences(of: "vitamin C serums", with: product.lowercased()), category: cats[i % cats.count])
        }
        store.addGeneration(kind: .copy, prompt: "10 hooks · \(product) · \(audience)", thumbnails: [], model: "Writer v3", credits: cost, resultText: hooks.map { $0.text }.joined(separator: "\n"))
        return hooks
    }

    // MARK: Campaign

    static func createCampaign(_ p: CampaignParams, store: AppStore, progress: @escaping (String) -> Void) async throws -> Campaign {
        let cost = 60
        try charge(store, cost, "Campaign generation")
        for step in ["Analysing objective", "Selecting formats", "Generating creatives", "Writing copy", "Building calendar"] {
            progress(step)
            await wait(Double.random(in: 0.4...0.7))
        }
        let s = slug()
        let assetIds = (1...6).map { i in
            store.addAsset(name: "\(p.name) creative \(i)", kind: i % 3 == 0 ? .video : .image, imageURL: MockData.image("camp-\(s)-\(i)"), projectId: p.projectId, tags: ["campaign"], durationSeconds: i % 3 == 0 ? 10 : nil).id
        }
        let vars = try await generateAds(AdParams(platform: p.platforms.first ?? .instagram, format: "Image", product: store.brand.name, offer: "Launch offer", audience: p.audience, projectId: p.projectId), store: store)
        var c = store.createCampaign(name: p.name, objective: p.objective, audience: p.audience, platforms: p.platforms, formats: p.formats, projectId: p.projectId, assetIds: assetIds, variations: vars)
        c.status = .ready
        c.calendarItems = (0..<5).map { d in
            CalendarItem(id: IDGen.make("cal"), title: ["Teaser", "Hero post", "UGC hook", "Story", "Retarget"][d], date: .daysFromNow(Double(d * 2 + 1)), platform: p.platforms[d % max(p.platforms.count, 1)], format: ["Reel", "Image", "Video", "Story", "Carousel"][d], status: .draft, assetId: assetIds.indices.contains(d) ? assetIds[d] : nil)
        }
        store.updateCampaign(c)
        store.pushNotification(kind: .campaignReady, title: "Campaign ready", message: "\(p.name) has \(assetIds.count) assets and \(vars.count) ad variations.")
        return c
    }

    // MARK: Export / upload

    static func exportAssets(ids: [String], format: ExportFormat, quality: ExportQuality, store: AppStore, progress: @escaping (Double, String) -> Void) async throws -> Asset {
        for (i, step) in exportSteps.enumerated() {
            progress(Double(i) / Double(exportSteps.count - 1), step)
            await wait(Double.random(in: 0.4...0.8))
        }
        let a = store.addAsset(name: "Export \(ids.count) item\(ids.count == 1 ? "" : "s") (\(format.rawValue), \(quality.rawValue))", kind: .export, imageURL: MockData.image("exp-\(slug())", w: 800, h: 800), projectId: store.currentProjectId, tags: ["export"])
        store.pushNotification(kind: .exportComplete, title: "Export complete", message: "\(a.name) is ready to download.")
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
        return MockData.assistantReplies.randomElement() ?? "Done."
    }
}
