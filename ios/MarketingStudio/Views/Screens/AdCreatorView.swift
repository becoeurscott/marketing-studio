import SwiftUI

/// SPEC §17–18 — Ad Creator: platform, format, product/offer/audience/CTA → Creative A–D variations.
struct AdCreatorView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    static let formats = ["Image", "Video", "Carousel", "Story", "Reel", "Short"]
    static let ctas = ["Shop Now", "Learn More", "Sign Up", "Get Offer", "Try Free", "Book Now"]
    static let cost = GenerationKind.ad.creditCost

    private enum Phase: Equatable { case idle, generating, done, failed }

    @State private var platform: SocialPlatform = .tiktok
    @State private var format = "Image"
    @State private var product = "Premium Watch"
    @State private var offer = "20% launch discount"
    @State private var audience = "Men 25–40"
    @State private var cta: Set<String> = ["Shop Now"]
    @State private var phase: Phase = .idle
    @State private var variations: [AdVariation] = []
    @State private var savedIds: [String: String] = [:]
    @State private var editing: AdVariation?
    @State private var exporting: String?
    @State private var lastError: Error?
    @State private var campaignPicker = false
    @State private var campaignAssetIds: [String] = []

    /// Aspect ratio implied by platform + format (SPEC: 9:16 story/reel/short, 1:1 feed).
    private var previewRatio: CGFloat {
        switch format {
        case "Story", "Reel", "Short", "Video": return 9 / 16
        default:
            switch platform {
            case .tiktok: return 9 / 16
            case .pinterest: return 2 / 3
            case .youtube, .google: return 16 / 9
            default: return 1
            }
        }
    }
    private var ratioLabel: String {
        let r = previewRatio
        if r == 9 / 16 { return "9:16" }
        if r == 16 / 9 { return "16:9" }
        if r == 2 / 3 { return "2:3" }
        return "1:1"
    }
    private var canGenerate: Bool { !product.trimmingCharacters(in: .whitespaces).isEmpty && !audience.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                CreativeSection(title: "Platform") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(SocialPlatform.allCases) { p in
                                MSChip(title: p.title, icon: p.icon, selected: platform == p) { MSHaptic.tap(); withAnimation(MSAnimation.snappy) { platform = p } }
                            }
                        }
                        .padding(.horizontal, MSSpacing.gutter)
                    }
                    .padding(.horizontal, -MSSpacing.gutter)
                }
                CreativeSection(title: "Format", subtitle: "Preview frame: \(ratioLabel) for \(platform.title) \(format)") {
                    FlowLayout(spacing: 8) {
                        ForEach(Self.formats, id: \.self) { f in
                            MSChip(title: f, selected: format == f) { MSHaptic.tap(); withAnimation(MSAnimation.snappy) { format = f } }
                        }
                    }
                }
                VStack(spacing: 14) {
                    MSTextField(label: "Product", placeholder: "e.g. Premium Watch", text: $product, icon: "shippingbox")
                    MSTextField(label: "Offer", placeholder: "e.g. 20% launch discount", text: $offer, icon: "tag")
                    MSTextField(label: "Target audience", placeholder: "e.g. Men 25–40", text: $audience, icon: "person.2")
                }
                .padding(.horizontal, MSSpacing.gutter)
                CreativeSection(title: "Call to action") {
                    ChipGroup(options: Self.ctas, selection: $cta, allowDeselect: false)
                }
                CreditCostRow(cost: Self.cost, label: "4 ad variations")
                MSButton(title: variations.isEmpty ? "Generate Ad" : "Generate New Set", icon: "sparkles", isLoading: phase == .generating, isDisabled: !canGenerate) { generate() }
                    .padding(.horizontal, MSSpacing.gutter)
                resultsSection
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Ad Creator")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(item: $editing, detents: [.large]) { v in
            AdVariationEditSheet(variation: v) { updated in
                if let i = variations.firstIndex(where: { $0.id == updated.id }) { variations[i] = updated }
                editing = nil
                router.toast("\(updated.label) updated", style: .success)
            }
        }
        .msSheet(isPresented: $campaignPicker) {
            CampaignPickerSheet(assetIds: campaignAssetIds) { campaignPicker = false }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Ad Creator").msTitle(26)
            Text("Four ready-to-run creatives, sized for the placement you pick.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    @ViewBuilder
    private var resultsSection: some View {
        switch phase {
        case .idle: EmptyView()
        case .generating:
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    ProgressView().tint(MSColor.accent)
                    Text("Writing and designing 4 variations...").msHeadline(15)
                }
                ForEach(0..<2, id: \.self) { _ in
                    VStack(alignment: .leading, spacing: 10) {
                        SkeletonView().aspectRatio(previewRatio, contentMode: .fit).frame(maxHeight: 220)
                        SkeletonView().frame(height: 16).frame(maxWidth: 180)
                        SkeletonView().frame(height: 12)
                    }
                    .msCard()
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        case .failed:
            if let lastError { CreativeErrorView(error: lastError, retry: generate, back: { router.popToRoot() }) }
        case .done:
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Ad variations", subtitle: "\(platform.title) · \(format) · \(ratioLabel)", actionTitle: "Save all") { saveAll() }
                ForEach(variations) { v in
                    CreativeAdVariationCard(variation: v, ratio: previewRatio, saved: savedIds[v.id] != nil, exporting: exporting == v.id,
                                    onEdit: { editing = v }, onDuplicate: { duplicate(v) }, onSave: { save(v) }, onExport: { export(v) },
                                    onUseInCampaign: { campaignAssetIds = [save(v, quiet: true)]; campaignPicker = true })
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    // MARK: Actions

    private func generate() {
        guard phase != .generating, canGenerate else { return }
        MSHaptic.tap()
        lastError = nil
        withAnimation(MSAnimation.gentle) { phase = .generating; variations = []; savedIds = [:] }
        let p = AdParams(platform: platform, format: format, product: product, offer: offer, audience: audience, cta: cta.first ?? "Shop Now", projectId: store.currentProjectId)
        Task {
            do {
                let vars = try await MockAPI.generateAds(p, store: store)
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { variations = vars; phase = .done }
                router.toast("4 creatives ready", style: .success, icon: "sparkles")
            } catch {
                MSHaptic.warning()
                lastError = error
                withAnimation(MSAnimation.gentle) { phase = .failed }
            }
        }
    }

    private func duplicate(_ v: AdVariation) {
        var copy = v
        copy.id = IDGen.make("var")
        copy.label = v.label + " (Copy)"
        withAnimation(MSAnimation.snappy) {
            if let i = variations.firstIndex(where: { $0.id == v.id }) { variations.insert(copy, at: i + 1) } else { variations.append(copy) }
        }
        router.toast("Duplicated \(v.label)", style: .info)
    }

    @discardableResult
    private func save(_ v: AdVariation, quiet: Bool = false) -> String {
        if let id = savedIds[v.id] { return id }
        let a = store.addAsset(name: "\(v.label) · \(product) · \(platform.title)", kind: .image, imageURL: v.visualURL, projectId: store.currentProjectId, tags: ["ad", platform.rawValue, format.lowercased()])
        store.addGeneration(kind: .ad, prompt: "\(v.label): \(v.headline)", thumbnails: [v.visualURL], projectId: store.currentProjectId, model: "Ads v1", credits: 0, resultText: "\(v.headline)\n\n\(v.primaryText)\n\nCTA: \(v.cta)")
        savedIds[v.id] = a.id
        if !quiet { MSHaptic.success(); router.toast("\(v.label) saved to assets", style: .success) }
        return a.id
    }

    private func saveAll() {
        for v in variations { save(v, quiet: true) }
        MSHaptic.success()
        router.toast("Saved \(variations.count) creatives", style: .success)
    }

    private func export(_ v: AdVariation) {
        guard exporting == nil else { return }
        exporting = v.id
        let id = save(v, quiet: true)
        Task {
            do {
                _ = try await MockAPI.exportAssets(ids: [id], format: format == "Video" || format == "Reel" || format == "Short" ? .mp4 : .png, quality: .high, store: store) { _, step in
                    router.toast("\(v.label): \(step)", style: .info, icon: "square.and.arrow.up")
                }
                MSHaptic.success()
                router.toast("\(v.label) exported", style: .success)
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
            exporting = nil
        }
    }
}

// MARK: - Variation card

struct CreativeAdVariationCard: View {
    var variation: AdVariation
    var ratio: CGFloat
    var saved: Bool
    var exporting: Bool
    var onEdit: () -> Void
    var onDuplicate: () -> Void
    var onSave: () -> Void
    var onExport: () -> Void
    var onUseInCampaign: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                MSBadge(text: variation.label, tone: .accent)
                MSBadge(text: variation.platform.title, icon: variation.platform.icon)
                Spacer()
                if saved { MSBadge(text: "Saved", tone: .success, icon: "checkmark") }
            }
            PlatformPreviewFrame(ratio: ratio, label: "Visual") {
                ZStack(alignment: .bottomLeading) {
                    RemoteImage(url: variation.visualURL)
                    LinearGradient(colors: [.clear, .black.opacity(0.7)], startPoint: .center, endPoint: .bottom)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(variation.headline).font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(.white).lineLimit(2)
                        Text(variation.cta)
                            .font(MSFont.control(12)).foregroundStyle(.black)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(.white, in: Capsule())
                    }
                    .padding(14)
                }
            }
            .frame(maxHeight: ratio < 1 ? 300 : 260)
            .frame(maxWidth: .infinity, alignment: .leading)
            VStack(alignment: .leading, spacing: 6) {
                labeled("Headline", variation.headline)
                labeled("Primary text", variation.primaryText)
                labeled("CTA", variation.cta)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ResultAction(title: "Edit", icon: "pencil", action: onEdit)
                    ResultAction(title: "Duplicate", icon: "plus.square.on.square", action: onDuplicate)
                    ResultAction(title: saved ? "Saved" : "Save", icon: saved ? "checkmark" : "square.and.arrow.down", tint: saved ? MSColor.success : MSColor.text, action: onSave)
                    ResultAction(title: exporting ? "Exporting..." : "Export", icon: "square.and.arrow.up", action: onExport)
                    ResultAction(title: "Use in Campaign", icon: "flag", action: onUseInCampaign)
                }
            }
        }
        .msCard()
    }

    private func labeled(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased()).font(.system(size: 10, weight: .semibold)).tracking(0.6).foregroundStyle(MSColor.muted)
            Text(value).msBody(14, color: MSColor.text)
        }
    }
}

// MARK: - Edit sheet

struct AdVariationEditSheet: View {
    @State var variation: AdVariation
    var onSave: (AdVariation) -> Void

    var body: some View {
        BottomSheetContainer(title: "Edit \(variation.label)", subtitle: "Changes apply to this variation only") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    MSTextField(label: "Headline", placeholder: "Headline", text: $variation.headline)
                    MSTextEditor(label: "Primary text", placeholder: "Primary text", text: $variation.primaryText, minHeight: 100)
                    MSTextField(label: "CTA", placeholder: "Shop Now", text: $variation.cta)
                    MSButton(title: "Apply Changes", icon: "checkmark") { onSave(variation) }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 30)
            }
        }
    }
}
