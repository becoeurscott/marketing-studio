import SwiftUI

/// UGC creator: AI creator (+ optional product) + script + language → a real talking video
/// (Seedance 2.5 with the creator's character sheet, so the person stays the same).
struct UGCCreatorView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var initialScript: String? = nil

    static let defaultScript = "Bonjour ! Regardez ce que je viens de recevoir. La qualité est top et le prix est doux. Écrivez-nous sur WhatsApp pour commander."
    static let locations = StudioOptions.ugcLocations
    static let tones = ["Enthousiaste", "Décontracté", "Professionnel", "Drôle", "Luxe", "Authentique"]
    static let durations = StudioOptions.ugcDurations
    static let steps = ["Choix du créateur"] + API.videoSteps

    private enum Phase: Equatable { case idle, generating(step: Int, label: String), done, failed(String) }

    @State private var productId: String?
    @State private var creatorId: String = Catalog.creators[0].id
    @State private var script: String = UGCCreatorView.defaultScript
    @State private var location: String = StudioOptions.ugcLocations[0]
    @State private var tone: Set<String> = ["Authentique"]
    @State private var language = "fr"
    @State private var duration = 10
    @State private var phase: Phase = .idle
    @State private var result: GeneratedVideo?
    @State private var lastError: Error?
    @State private var savedAssetId: String?
    @State private var campaignPicker = false
    @State private var scrollTarget: String?

    private var creator: Creator? { store.creator(creatorId) }
    /// Optional: no product until the user picks or imports one.
    private var product: Asset? { productId.flatMap { store.asset($0) } }
    private var cost: Int { AIModels.ugcCredits(seconds: duration) }

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
                    CreditCostRow(cost: cost, label: "Vidéo UGC de \(duration) s")
                    MSButton(title: result == nil ? "Générer la vidéo UGC" : "En générer une autre", icon: "sparkles", isLoading: isGenerating, isDisabled: script.trimmingCharacters(in: .whitespaces).isEmpty) {
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
        .navigationTitle("Créateur UGC")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .onAppear {
            if let initialScript, !initialScript.isEmpty { script = initialScript }
            language = store.preferences.language
            consumePendingCreator()
        }
        .onChange(of: store.pendingCreatorId) { _, _ in consumePendingCreator() }
        .msSheet(isPresented: $campaignPicker) {
            CampaignPickerSheet(assetIds: [savedAssetId].compactMap { $0 }) { campaignPicker = false }
        }
    }

    private var isGenerating: Bool { if case .generating = phase { return true }; return false }

    /// A creator chosen on the Creators screen ("Utiliser en UGC").
    private func consumePendingCreator() {
        guard let id = store.pendingCreatorId, store.creator(id) != nil else { return }
        store.pendingCreatorId = nil
        creatorId = id
    }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Créateur UGC").msTitle(26)
            Text("Choisissez un créateur IA, donnez-lui un script et obtenez une vidéo courte.").msBody(14)
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
        CreativeSection(title: "Produit (facultatif)", subtitle: "Le créateur le tient et le montre. Sans produit, il parle face caméra.") {
            ProductPicker(selectedId: $productId) { router.present(.uploadProduct) }
            if let product {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.success)
                    Text(product.name).font(MSFont.control(13)).foregroundStyle(MSColor.text).lineLimit(1)
                    Spacer()
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { productId = nil }
                    } label: {
                        Label("Retirer le produit", systemImage: "xmark").font(MSFont.control(13)).foregroundStyle(MSColor.text2)
                    }
                }
            }
        }
    }

    private var creatorSection: some View {
        CreativeSection(title: "Créateur", subtitle: "Créateurs IA : le même visage dans toutes vos vidéos") {
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(store.creators) { c in
                            CreatorPickCard(creator: c, selected: c.id == creatorId) {
                                MSHaptic.tap()
                                withAnimation(MSAnimation.snappy) { creatorId = c.id }
                            }
                            .id(c.id)
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
                .padding(.horizontal, -MSSpacing.gutter)
                .onAppear { proxy.scrollTo(creatorId, anchor: .center) }
                .onChange(of: creatorId) { _, id in withAnimation(MSAnimation.gentle) { proxy.scrollTo(id, anchor: .center) } }
            }
        }
    }

    private var scriptSection: some View {
        CreativeSection(title: "Script") {
            MSTextEditor(placeholder: Self.defaultScript, text: $script, minHeight: 96)
            HStack(spacing: 8) {
                ResultAction(title: "Rédiger avec le Copywriter", icon: "text.alignleft") { router.push(.copywriter) }
                ResultAction(title: "Accroches", icon: "bolt") { router.push(.hookGenerator) }
                Spacer()
                Text("\(script.count) caractères").msCaption()
            }
        }
    }

    private var optionsSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            CreativeSection(title: "Langue de la vidéo") {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Market.languages) { l in
                            MSChip(title: l.label, selected: language == l.id) { MSHaptic.tap(); withAnimation(MSAnimation.snappy) { language = l.id } }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
                .padding(.horizontal, -MSSpacing.gutter)
            }
            CreativeSection(title: "Lieu") {
                ChipRow(options: Self.locations, selection: $location).padding(.horizontal, -MSSpacing.gutter)
            }
            CreativeSection(title: "Ton") {
                ChipGroup(options: Self.tones, selection: $tone, allowDeselect: false)
            }
            CreativeSection(title: "Durée") {
                HStack(spacing: 8) {
                    ForEach(Self.durations, id: \.self) { d in
                        MSChip(title: "\(d) s", icon: "timer", selected: duration == d) {
                            MSHaptic.tap(); withAnimation(MSAnimation.snappy) { duration = d }
                        }
                    }
                }
            }
        }
    }

    private var previewSection: some View {
        CreativeSection(title: "Aperçu", subtitle: "Votre créateur se présente") {
            HStack(alignment: .top, spacing: 12) {
                ZStack(alignment: .bottomLeading) {
                    if let creator {
                        CreatorIntroView(creator: creator)
                            .id(creator.id)
                            .frame(width: 108, height: 192)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    if let product {
                        RemoteImage(url: product.imageURL, cornerRadius: 8)
                            .frame(width: 40, height: 40)
                            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(MSColor.bg, lineWidth: 2))
                            .padding(6)
                    }
                }
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Text(creator?.name ?? "Créateur").msHeadline(15)
                        Text("· \(creator?.style ?? "")").msCaption()
                    }
                    Text(product?.name ?? "Aucun produit sélectionné").msCaption(color: MSColor.text2).lineLimit(1)
                    Text("\u{201C}\(script)\u{201D}").msBody(13).lineLimit(3)
                    HStack(spacing: 6) {
                        MSBadge(text: Market.languageLabel(language), tone: .accent)
                        MSBadge(text: location)
                        MSBadge(text: "\(duration) s")
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
                Text("Votre vidéo UGC").msHeadline(16)
                Spacer()
                MSBadge(text: "Prête", tone: .success, icon: "checkmark")
            }
            PlatformPreviewFrame(ratio: 9 / 16, label: "9:16 · \(video.duration) s · \(creator?.name ?? "") · \(Market.languageLabel(language))") {
                ResultVideoPlayer(url: video.videoURL, poster: video.posterURL)
            }
            .frame(maxWidth: 260)
            .frame(maxWidth: .infinity)
            HStack(spacing: 8) {
                ResultAction(title: savedAssetId == nil ? "Enregistrer dans les ressources" : "Enregistrée", icon: savedAssetId == nil ? "square.and.arrow.down" : "checkmark", tint: savedAssetId == nil ? MSColor.text : MSColor.success) { save(video) }
                ResultAction(title: "Utiliser dans une campagne", icon: "flag") {
                    if savedAssetId == nil { save(video, quiet: true) }
                    campaignPicker = true
                }
                ResultAction(title: "Régénérer", icon: "arrow.clockwise") { generate() }
            }
            HStack(spacing: 8) {
                ShareMediaButton(url: video.videoURL, title: "Partager", icon: "square.and.arrow.up")
                ShareMediaButton(url: video.videoURL, title: "WhatsApp", icon: "message.fill", style: .primary)
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
        let params = UGCParams(productAssetId: productId, creatorId: creatorId, script: script, location: location, tone: tone.first ?? "Authentique", language: language, duration: duration, projectId: store.currentProjectId)
        Task {
            do {
                var idx = -1
                let video = try await API.generateUGC(params, store: store) { label in
                    idx = min(idx + 1, Self.steps.count - 1)
                    withAnimation(MSAnimation.gentle) { phase = .generating(step: idx, label: label) }
                }
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { result = video; phase = .done }
                save(video, quiet: true)
                scrollTarget = "result"
                router.toast("Vidéo UGC prête", style: .success, icon: "sparkles")
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
        let a = store.addAsset(name: "UGC · \(creator?.name ?? "Créateur") · \(tone.first ?? "")", kind: .video, imageURL: video.posterURL, projectId: store.currentProjectId, tags: ["ugc", (tone.first ?? "").lowercased()], durationSeconds: video.duration, videoURL: video.videoURL)
        savedAssetId = a.id
        if !quiet { MSHaptic.success(); router.toast("Enregistrée dans les ressources", style: .success) }
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
                Text("\(creator.age) ans · \(creator.style)").msCaption().lineLimit(1)
            }
            .frame(width: 96, alignment: .leading)
        }
        .buttonStyle(MSPressStyle())
    }
}
