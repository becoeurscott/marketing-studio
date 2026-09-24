import SwiftUI

/// SPEC §15 — UGC Creator: product + creator + script + location/tone/duration → mock UGC video.
struct UGCCreatorView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var initialScript: String? = nil

    static let defaultScript = "Create a 15-second TikTok-style video introducing this product."
    static let locations = ["Bathroom", "Bedroom", "Kitchen", "Living room", "Outdoors", "Gym", "Car", "Office", "Studio"]
    static let tones = ["Excited", "Casual", "Professional", "Funny", "Luxury", "Authentic"]
    static let durations = [15, 30, 60]
    static let cost = GenerationKind.video.creditCost
    static let steps = ["Casting creator", "Reading script...", "Building scene 1...", "Adding motion...", "Rendering...", "Finalizing..."]

    private enum Phase: Equatable { case idle, generating(step: Int, label: String), done, failed(String) }

    @State private var productId: String?
    @State private var creatorId: String = "creator_maya"
    @State private var script: String = UGCCreatorView.defaultScript
    @State private var location: String = "Bathroom"
    @State private var tone: Set<String> = ["Authentic"]
    @State private var duration = 15
    @State private var phase: Phase = .idle
    @State private var result: GeneratedVideo?
    @State private var lastError: Error?
    @State private var savedAssetId: String?
    @State private var campaignPicker = false
    @State private var scrollTarget: String?

    private var creator: Creator? { store.creator(creatorId) }
    private var product: Asset? { productId.flatMap { store.asset($0) } ?? store.asset("asset_product_hero") }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 22) {
                    header
                    if case .generating = phase { progressCard }
                    if case .failed = phase, let lastError { CreativeErrorView(error: lastError, retry: generate, back: { router.popToRoot() }) }
                    if let result { resultCard(result).id("result") }
                    productSection
                    creatorSection
                    scriptSection
                    optionsSection
                    previewSection
                    CreditCostRow(cost: Self.cost, label: "\(duration)s UGC video")
                    MSButton(title: result == nil ? "Generate UGC Video" : "Generate Another", icon: "sparkles", isLoading: isGenerating, isDisabled: script.trimmingCharacters(in: .whitespaces).isEmpty) {
                        generate()
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
            .onChange(of: scrollTarget) { _, t in
                if let t { withAnimation(MSAnimation.gentle) { proxy.scrollTo(t, anchor: .top) }; scrollTarget = nil }
            }
        }
        .msScreen()
        .navigationTitle("UGC Creator")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .onAppear { if let initialScript, !initialScript.isEmpty { script = initialScript } }
        .msSheet(isPresented: $campaignPicker) {
            CampaignPickerSheet(assetIds: [savedAssetId].compactMap { $0 }) { campaignPicker = false }
        }
    }

    private var isGenerating: Bool { if case .generating = phase { return true }; return false }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("UGC Creator").msTitle(26)
            Text("Cast an AI creator, hand them a script and get a short-form video.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case .generating(let step, let label) = phase {
                ProgressIndicator(steps: Self.steps, currentStep: step, title: label)
            }
        }
        .msCard()
        .padding(.horizontal, MSSpacing.gutter)
        .id("progress")
    }

    private var productSection: some View {
        CreativeSection(title: "Product", subtitle: "Pick from your assets or upload a new photo") {
            ProductPicker(selectedId: $productId) { router.present(.uploadProduct) }
        }
    }

    private var creatorSection: some View {
        CreativeSection(title: "Creator", subtitle: "All creators are fictional AI personas") {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(store.creators) { c in
                        CreatorPickCard(creator: c, selected: c.id == creatorId) {
                            MSHaptic.tap()
                            withAnimation(MSAnimation.snappy) { creatorId = c.id }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.horizontal, -MSSpacing.gutter)
        }
    }

    private var scriptSection: some View {
        CreativeSection(title: "Script") {
            MSTextEditor(placeholder: Self.defaultScript, text: $script, minHeight: 96)
            HStack(spacing: 8) {
                ResultAction(title: "Write with Copywriter", icon: "text.alignleft") { router.push(.copywriter) }
                ResultAction(title: "Hooks", icon: "bolt") { router.push(.hookGenerator) }
                Spacer()
                Text("\(script.count) chars").msCaption()
            }
        }
    }

    private var optionsSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            CreativeSection(title: "Location") {
                ChipRow(options: Self.locations, selection: $location).padding(.horizontal, -MSSpacing.gutter)
            }
            CreativeSection(title: "Tone") {
                ChipGroup(options: Self.tones, selection: $tone, allowDeselect: false)
            }
            CreativeSection(title: "Duration") {
                HStack(spacing: 8) {
                    ForEach(Self.durations, id: \.self) { d in
                        MSChip(title: "\(d)s", icon: "timer", selected: duration == d) {
                            MSHaptic.tap(); withAnimation(MSAnimation.snappy) { duration = d }
                        }
                    }
                }
            }
        }
    }

    private var previewSection: some View {
        CreativeSection(title: "Preview", subtitle: "What the creator will receive") {
            HStack(alignment: .top, spacing: 12) {
                ZStack(alignment: .bottomLeading) {
                    RemoteImage(url: creator?.avatarURL, cornerRadius: 12)
                        .frame(width: 96, height: 128)
                    RemoteImage(url: product?.imageURL, cornerRadius: 8)
                        .frame(width: 40, height: 40)
                        .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(MSColor.bg, lineWidth: 2))
                        .padding(6)
                }
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Text(creator?.name ?? "Creator").msHeadline(15)
                        Text("· \(creator?.style ?? "")").msCaption()
                    }
                    Text(product?.name ?? "No product selected").msCaption(color: MSColor.text2).lineLimit(1)
                    Text("\u{201C}\(script)\u{201D}").msBody(13).lineLimit(3)
                    HStack(spacing: 6) {
                        MSBadge(text: tone.first ?? "Authentic", tone: .accent)
                        MSBadge(text: location)
                        MSBadge(text: "\(duration)s")
                    }
                }
                Spacer(minLength: 0)
            }
            .msCard(padding: 12)
        }
    }

    // MARK: Result

    private func resultCard(_ video: GeneratedVideo) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Your UGC video").msHeadline(16)
                Spacer()
                MSBadge(text: "Ready", tone: .success, icon: "checkmark")
            }
            PlatformPreviewFrame(ratio: 9 / 16, label: "9:16 · \(video.duration)s · \(creator?.name ?? "") · \(tone.first ?? "")") {
                ZStack {
                    RemoteImage(url: video.posterURL)
                    LinearGradient(colors: [.clear, .black.opacity(0.55)], startPoint: .center, endPoint: .bottom)
                    Image(systemName: "play.fill")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 60, height: 60)
                        .background(.white.opacity(0.18), in: Circle())
                        .overlay(Circle().strokeBorder(.white.opacity(0.5), lineWidth: 1))
                    VStack {
                        HStack {
                            HStack(spacing: 6) {
                                AvatarView(url: creator?.avatarURL, name: creator?.name ?? "C", size: 22)
                                Text(creator?.name ?? "").font(MSFont.control(12)).foregroundStyle(.white)
                            }
                            .padding(.horizontal, 8).padding(.vertical, 5)
                            .background(.black.opacity(0.4), in: Capsule())
                            Spacer()
                            Text("0:\(String(format: "%02d", video.duration))").font(MSFont.mono(12)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 5)
                                .background(.black.opacity(0.4), in: Capsule())
                        }
                        Spacer()
                        Text(script).font(MSFont.control(13)).foregroundStyle(.white).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(12)
                }
            }
            .frame(maxWidth: 260)
            .frame(maxWidth: .infinity)
            HStack(spacing: 8) {
                ResultAction(title: savedAssetId == nil ? "Save to assets" : "Saved", icon: savedAssetId == nil ? "square.and.arrow.down" : "checkmark", tint: savedAssetId == nil ? MSColor.text : MSColor.success) { save(video) }
                ResultAction(title: "Use in Campaign", icon: "flag") {
                    if savedAssetId == nil { save(video, quiet: true) }
                    campaignPicker = true
                }
                ResultAction(title: "Regenerate", icon: "arrow.clockwise") { generate() }
            }
        }
        .msCard()
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: Actions

    private func generate() {
        guard !isGenerating else { return }
        MSHaptic.tap()
        lastError = nil
        savedAssetId = nil
        withAnimation(MSAnimation.gentle) { phase = .generating(step: 0, label: Self.steps[0]); result = nil }
        scrollTarget = "progress"
        let params = UGCParams(productAssetId: productId, creatorId: creatorId, script: script, location: location, tone: tone.first ?? "Authentic", duration: duration, projectId: store.currentProjectId)
        Task {
            do {
                var idx = -1
                let video = try await MockAPI.generateUGC(params, store: store) { label in
                    idx = min(idx + 1, Self.steps.count - 1)
                    withAnimation(MSAnimation.gentle) { phase = .generating(step: idx, label: label) }
                }
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { result = video; phase = .done }
                scrollTarget = "result"
                router.toast("UGC video ready", style: .success, icon: "sparkles")
            } catch {
                MSHaptic.warning()
                lastError = error
                withAnimation(MSAnimation.gentle) { phase = .failed(error.localizedDescription) }
                scrollTarget = "progress"
            }
        }
    }

    private func save(_ video: GeneratedVideo, quiet: Bool = false) {
        guard savedAssetId == nil else { return }
        let a = store.addAsset(name: "UGC · \(creator?.name ?? "Creator") · \(tone.first ?? "")", kind: .video, imageURL: video.posterURL, projectId: store.currentProjectId, tags: ["ugc", (tone.first ?? "").lowercased()], durationSeconds: video.duration)
        savedAssetId = a.id
        if !quiet { MSHaptic.success(); router.toast("Saved to assets", style: .success) }
    }
}

/// Avatar card for picking a creator.
struct CreatorPickCard: View {
    var creator: Creator
    var selected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 6) {
                RemoteImage(url: creator.avatarURL, cornerRadius: 12)
                    .frame(width: 96, height: 120)
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(selected ? MSColor.accent : .clear, lineWidth: 2))
                    .overlay(alignment: .topTrailing) {
                        if selected {
                            Image(systemName: "checkmark.circle.fill").font(.system(size: 16, weight: .bold)).foregroundStyle(.white, MSColor.accent).padding(6)
                        }
                    }
                Text(creator.name).font(MSFont.control(13)).foregroundStyle(selected ? MSColor.text : MSColor.text2)
                Text("\(creator.age) · \(creator.style)").msCaption().lineLimit(1)
            }
            .frame(width: 96, alignment: .leading)
        }
        .buttonStyle(MSPressStyle())
    }
}
