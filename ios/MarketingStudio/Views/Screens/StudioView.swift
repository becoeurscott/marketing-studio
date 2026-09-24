import SwiftUI
import PhotosUI

/// SPEC §9–10, §46. Core screen: full-bleed canvas showing the current media, a thin translucent top bar,
/// a floating mode pill, and the floating composer (media slots + inline prompt + control pills + Generate).
struct StudioView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @StateObject private var image = ImageGenSession()
    @StateObject private var video = VideoGenSession()
    @StateObject private var ugc = UGCGenSession()

    @State private var mode: StudioMode = .image
    @State private var history = StudioHistory(StudioSnapshot(prompt: "", productAssetId: nil, selectedResultId: nil))
    @State private var restoring = false
    @State private var saveStatus = "Saved"
    @State private var saveTask: Task<Void, Never>?

    @State private var showProjects = false
    @State private var showProductPicker = false
    @State private var showCreatorPicker = false
    @State private var showModelPicker = false
    @State private var showOptions = false
    @State private var showAssistant = false
    @State private var photoItem: PhotosPickerItem?
    @State private var uploadingPhoto = false
    @State private var fullscreen: FullscreenImageItem?
    @State private var playback: VideoResult?
    /// Height of the composer + result strip, so canvas overlays center in the visible area above them.
    @State private var bottomInset: CGFloat = 260
    /// True while the prompt has keyboard focus; canvas overlays hide so they don't squash under the top bar.
    @State private var composing = false

    var body: some View {
        VStack(spacing: 10) {
            topBar
            modeRow
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12)
        .padding(.top, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background { canvas.ignoresSafeArea() }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(spacing: 10) {
                resultOverlay
                StudioComposer(mode: mode, image: image, video: video, ugc: ugc, photoItem: $photoItem, composing: $composing) {
                    showProductPicker = true
                } onCreator: {
                    showCreatorPicker = true
                } onModel: {
                    showModelPicker = true
                } onMore: {
                    showOptions = true
                } onGenerate: {
                    generate()
                }
            }
            .background(GeometryReader { g in Color.clear.preference(key: StudioBottomInsetKey.self, value: g.size.height) })
        }
        .onPreferenceChange(StudioBottomInsetKey.self) { bottomInset = $0 }
        .msScreen()
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            applyPreferencesIfFresh()
            consumePendingTemplate()
            if ugc.creator == nil { ugc.creator = store.creators.first }
        }
        .onChange(of: store.pendingTemplateId) { _, _ in consumePendingTemplate() }
        .onChange(of: image.prompt) { _, _ in recordSnapshot() }
        .onChange(of: image.productAsset) { _, _ in recordSnapshot() }
        .onChange(of: image.selectedId) { _, _ in recordSnapshot() }
        .onChange(of: photoItem) { _, item in
            guard item != nil else { return }
            uploadFromPhotos()
        }
        .msSheet(isPresented: $showProjects, detents: [.medium, .large]) { ProjectPickerSheet() }
        .msSheet(isPresented: $showProductPicker, detents: [.large]) {
            UploadProductSheet { asset in setProduct(asset) }
        }
        .msSheet(isPresented: $showCreatorPicker, detents: [.medium, .large]) {
            CreatorPickerSheet(selection: $ugc.creator)
        }
        .msSheet(isPresented: $showModelPicker, detents: [.medium]) { modelSheet }
        .msSheet(isPresented: $showOptions, detents: [.medium, .large]) { optionsSheet }
        .msSheet(isPresented: $showAssistant, detents: [.large]) {
            AssistantView(embedded: true) { route in
                showAssistant = false
                Task {
                    try? await Task.sleep(for: .milliseconds(350))
                    router.push(route)
                }
            }
        }
        .fullScreenCover(item: $fullscreen) { FullscreenImageViewer(url: $0.url, aspect: $0.aspect) }
        .fullScreenCover(item: $playback) { VideoPlaybackScreen(result: $0) }
    }

    // MARK: Top bar

    private var topBar: some View {
        HStack(spacing: 8) {
            Button {
                MSHaptic.tap()
                showProjects = true
            } label: {
                HStack(spacing: 7) {
                    RoundedRectangle(cornerRadius: 4, style: .continuous).fill(MSColor.accentGradient).frame(width: 14, height: 14)
                    Text(store.currentProject?.name ?? "No project").msHeadline(13).lineLimit(1)
                    Circle().fill(saveStatus == "Saved" ? MSColor.success : MSColor.warning).frame(width: 5, height: 5)
                    Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.muted)
                }
                .padding(.horizontal, 11)
                .frame(height: 32)
                .overlayPill()
            }
            .buttonStyle(MSPressStyle())
            .accessibilityLabel("Project \(store.currentProject?.name ?? "none"), \(saveStatus)")

            Spacer(minLength: 4)

            Button {
                MSHaptic.tap()
                router.push(.credits)
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "bolt.fill").font(.system(size: 10, weight: .bold)).foregroundStyle(MSColor.highlight)
                    Text(store.credits.formatted()).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text).contentTransition(.numericText())
                }
                .padding(.horizontal, 10)
                .frame(height: 32)
                .overlayPill()
            }
            .buttonStyle(MSPressStyle())
            .animation(MSAnimation.snappy, value: store.credits)

            Menu {
                Button { undo() } label: { Label("Undo", systemImage: "arrow.uturn.backward") }.disabled(!history.canUndo)
                Button { redo() } label: { Label("Redo", systemImage: "arrow.uturn.forward") }.disabled(!history.canRedo)
                Divider()
                if let url = URL(string: currentVisualURL ?? "") {
                    ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up") }
                }
                Button { export() } label: { Label("Export", systemImage: "square.and.arrow.down") }
                Button { showAssistant = true } label: { Label("Assistant", systemImage: "bubble.left.and.text.bubble.right") }
                Button { showOptions = true } label: { Label("All options", systemImage: "slider.horizontal.3") }
                Divider()
                Button { showProjects = true } label: { Label("Switch project", systemImage: "folder") }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(MSColor.text)
                    .frame(width: 32, height: 32)
                    .overlayPill()
            }
            .menuOrder(.fixed)
            .accessibilityLabel("Studio menu")
        }
    }

    // MARK: Mode pill

    private var modeRow: some View {
        HStack(spacing: 8) {
            Spacer(minLength: 0)
            StudioModePill(mode: mode) { selectMode($0) }
            Spacer(minLength: 0)
        }
        .overlay(alignment: .trailing) {
            HStack(spacing: 6) {
                if let url = currentVisualURL {
                    overlayIcon("arrow.up.left.and.arrow.down.right", label: "Fullscreen") {
                        fullscreen = FullscreenImageItem(url: url, aspect: currentAspect)
                    }
                }
                overlayIcon("bubble.left.and.text.bubble.right.fill", label: "Assistant") { showAssistant = true }
            }
        }
    }

    private func overlayIcon(_ icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(MSColor.text)
                .frame(width: 32, height: 32)
                .overlayPill()
        }
        .buttonStyle(MSPressStyle())
        .accessibilityLabel(label)
    }

    private func selectMode(_ m: StudioMode) {
        if let route = m.externalRoute {
            router.push(route)
        } else {
            withAnimation(MSAnimation.gentle) { mode = m }
        }
    }

    // MARK: Canvas

    @ViewBuilder
    private var canvas: some View {
        ZStack {
            MSColor.bg
            switch mode {
            case .video: videoCanvas
            case .ugc: ugcCanvas
            default: imageCanvas
            }
        }
        .animation(MSAnimation.gentle, value: mode)
    }

    @ViewBuilder
    private var imageCanvas: some View {
        switch image.phase {
        case .generating:
            StudioCanvasMedia(url: image.productAsset?.imageURL ?? image.selected?.url, dimmed: true)
            canvasOverlay {
                CreatingVisualView(aspect: StudioOptions.aspect(image.ratio))
                    .frame(maxWidth: 260, maxHeight: 300)
            }
        case .results:
            if let r = image.selected {
                StudioCanvasMedia(url: r.url) { fullscreen = FullscreenImageItem(url: r.url, aspect: StudioOptions.aspect(image.ratio)) }
                    .id(r.url)
                    .transition(.opacity)
            }
        case .failed(let f):
            errorCanvas { GenerationErrorView(failure: f, retry: { generate() }, back: { image.reset() }) }
        case .idle:
            if let p = image.productAsset {
                StudioCanvasMedia(url: p.imageURL) { fullscreen = FullscreenImageItem(url: p.imageURL, aspect: 0.8) }
                    .transition(.opacity)
            } else {
                emptyCanvas(icon: "sparkles", title: "Start creating", message: "Add a product, describe the shot, generate.", primary: "Upload product", primaryIcon: "square.and.arrow.up") {
                    showProductPicker = true
                }
            }
        }
    }

    @ViewBuilder
    private var videoCanvas: some View {
        switch video.phase {
        case .generating(let step):
            StudioCanvasMedia(url: video.sourceAsset?.imageURL, dimmed: true)
            canvasOverlay { progressCard(steps: MockAPI.videoSteps, step: step, title: "Generating \(video.duration)s video") }
        case .result:
            if let r = video.result {
                videoResultCanvas(r)
            }
        case .failed(let f):
            errorCanvas { GenerationErrorView(failure: f, retry: { generate() }, back: { video.reset() }) }
        case .idle:
            if let s = video.sourceAsset {
                StudioCanvasMedia(url: s.imageURL) { fullscreen = FullscreenImageItem(url: s.imageURL, aspect: currentAspect) }
                    .transition(.opacity)
            } else {
                emptyCanvas(icon: "video", title: "Bring a product to life", message: "Pick a source image, describe the motion, generate.", primary: "Pick source image", primaryIcon: "photo") {
                    showProductPicker = true
                }
            }
        }
    }

    @ViewBuilder
    private var ugcCanvas: some View {
        switch ugc.phase {
        case .generating(let step):
            StudioCanvasMedia(url: ugc.creator?.avatarURL, dimmed: true)
            canvasOverlay { progressCard(steps: UGCGenSession.steps, step: step, title: "Casting \(ugc.creator?.name ?? "creator")") }
        case .result:
            if let r = ugc.result {
                videoResultCanvas(r)
            }
        case .failed(let f):
            errorCanvas { GenerationErrorView(failure: f, retry: { generate() }, back: { ugc.reset() }) }
        case .idle:
            if let c = ugc.creator {
                StudioCanvasMedia(url: c.avatarURL) { fullscreen = FullscreenImageItem(url: c.avatarURL, aspect: 0.8) }
                    .id(c.id)
                    .transition(.opacity)
            } else {
                emptyCanvas(icon: "person.crop.rectangle", title: "Cast a creator", message: "Pick an AI creator, hand them your product and a script.", primary: "Choose creator", primaryIcon: "person") {
                    showCreatorPicker = true
                }
            }
        }
    }

    private func videoResultCanvas(_ r: VideoResult) -> some View {
        StudioCanvasMedia(url: r.posterURL)
            .overlay {
                canvasOverlay {
                Button {
                    MSHaptic.tap()
                    playback = r
                } label: {
                    ZStack {
                        Circle().fill(.black.opacity(0.45)).frame(width: 72, height: 72)
                        Circle().strokeBorder(.white.opacity(0.35), lineWidth: 1).frame(width: 72, height: 72)
                        Image(systemName: "play.fill").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).offset(x: 2)
                    }
                }
                .buttonStyle(MSPressStyle())
                .accessibilityLabel("Play video")
                }
            }
            .id(r.id)
            .transition(.opacity)
    }

    private func progressCard(steps: [String], step: Int, title: String) -> some View {
        ProgressIndicator(steps: steps, currentStep: step, title: title)
            .padding(18)
            .frame(maxWidth: 300)
            .background(MSColor.bg.opacity(0.85), in: RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
            .transition(.opacity)
    }

    private func errorCanvas<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        canvasOverlay { content().padding(.horizontal, 24) }
    }

    /// Centers `content` in the canvas area that is not covered by the top bar or the composer.
    private func canvasOverlay<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.top, 90)
            .padding(.bottom, bottomInset)
            .opacity(composing ? 0 : 1)
            .animation(MSAnimation.gentle, value: composing)
            .transition(.opacity)
    }

    private func emptyCanvas(icon: String, title: String, message: String, primary: String, primaryIcon: String, action: @escaping () -> Void) -> some View {
        ZStack {
            RadialGradient(colors: [MSColor.accent.opacity(0.22), .clear], center: .init(x: 0.5, y: 0.35), startRadius: 10, endRadius: 320)
            VStack(spacing: 14) {
                ZStack {
                    Circle().fill(MSColor.accent.opacity(0.12)).frame(width: 72, height: 72)
                    Image(systemName: icon).font(.system(size: 28, weight: .semibold)).foregroundStyle(MSColor.highlight)
                }
                VStack(spacing: 4) {
                    Text(title).msTitle(24)
                    Text(message).msBody(14).multilineTextAlignment(.center)
                }
                HStack(spacing: 10) {
                    MSButton(title: primary, icon: primaryIcon, size: .compact, fullWidth: false, action: action)
                    MSButton(title: "Templates", icon: "square.grid.2x2", style: .secondary, size: .compact, fullWidth: false) { router.push(.templates) }
                }
                .padding(.top, 4)
            }
            .padding(24)
            .padding(.top, 90)
            .padding(.bottom, bottomInset)
            .opacity(composing ? 0 : 1)
            .animation(MSAnimation.gentle, value: composing)
        }
        .transition(.opacity)
    }

    // MARK: Result overlay (thumbs / actions above the composer)

    @ViewBuilder
    private var resultOverlay: some View {
        switch mode {
        case .image:
            if image.phase == .results {
                ImageResultsView(session: image, compact: true, canvasOverlay: true) { generate() }
                    .padding(.horizontal, 12)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        case .video:
            if let r = video.result, video.phase == .result {
                videoActions(r) { video.reset() }
            }
        case .ugc:
            if let r = ugc.result, ugc.phase == .result {
                videoActions(r) { ugc.reset() }
            }
        default:
            EmptyView()
        }
    }

    private func videoActions(_ r: VideoResult, reset: @escaping () -> Void) -> some View {
        HStack(spacing: 6) {
            smallAction("Download", "arrow.down.to.line") { router.toast("Saved to Photos", style: .success, icon: "checkmark.circle.fill") }
            let fav = store.isFavorite(.asset, r.assetId)
            smallAction(fav ? "Favorited" : "Favorite", fav ? "heart.fill" : "heart", tint: fav ? MSColor.danger : nil) { store.toggleFavorite(.asset, r.assetId) }
            smallAction("Regenerate", "arrow.clockwise") { generate() }
            smallAction("New", "plus") { withAnimation(MSAnimation.gentle) { reset() } }
        }
        .padding(.horizontal, 12)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func smallAction(_ title: String, _ icon: String, tint: Color? = nil, run: @escaping () -> Void) -> some View {
        Button {
            MSHaptic.tap()
            run()
        } label: {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 12, weight: .semibold))
                Text(title).font(MSFont.control(12))
            }
            .foregroundStyle(tint ?? MSColor.text)
            .padding(.horizontal, 11)
            .frame(height: 32)
            .overlayPill()
        }
        .buttonStyle(MSPressStyle())
    }

    // MARK: Sheets

    @ViewBuilder
    private var modelSheet: some View {
        switch mode {
        case .video: ModelPickerSheet(models: StudioOptions.motionModels, selection: $video.model)
        case .ugc: ModelPickerSheet(models: StudioOptions.personaModels, selection: $ugc.model)
        default: ModelPickerSheet(models: StudioOptions.imageModels, selection: $image.model)
        }
    }

    private var optionsSheet: some View {
        let title: String
        let disabled: Bool
        switch mode {
        case .video: title = "Video options"; disabled = false
        case .ugc: title = "UGC options"; disabled = !ugc.canGenerate
        default: title = "Image options"; disabled = false
        }
        return BottomSheetContainer(title: title, subtitle: "Fine-tune before you generate.") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    switch mode {
                    case .video:
                        VideoOptionsForm(session: video, full: false)
                    case .ugc:
                        UGCOptionsForm(session: ugc)
                    default:
                        ImageOptionsForm(session: image, full: false)
                    }
                    MSButton(title: "Generate · \(currentCost) credits", icon: "paperplane.fill", isDisabled: disabled) {
                        showOptions = false
                        generate()
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 32)
            }
        }
    }

    // MARK: Actions

    private var currentCost: Int {
        switch mode {
        case .video: return VideoGenSession.cost
        case .ugc: return UGCGenSession.cost
        default: return ImageGenSession.cost
        }
    }

    private func generate() {
        markSaving()
        let lead = StudioComposer.leadIn(mode: mode, image: image, video: video, ugc: ugc)
        Task {
            switch mode {
            case .video:
                video.leadIn = lead
                await video.generate(store: store, router: router)
            case .ugc:
                ugc.leadIn = lead
                await ugc.generate(store: store, router: router)
            default:
                image.leadIn = lead
                await image.generate(store: store, router: router)
            }
            markSaved()
        }
    }

    private func setProduct(_ asset: Asset) {
        withAnimation(MSAnimation.snappy) {
            switch mode {
            case .video: video.sourceAsset = asset
            case .ugc: ugc.productAsset = asset
            default: image.productAsset = asset
            }
        }
    }

    /// The dashed "add media" slot: a PhotosPicker whose pick runs through the mock upload and lands in the product slot.
    private func uploadFromPhotos() {
        guard !uploadingPhoto else { return }
        uploadingPhoto = true
        router.toast("Uploading from Photos", style: .info, icon: "icloud.and.arrow.up")
        Task {
            defer { uploadingPhoto = false; photoItem = nil }
            do {
                let a = try await MockAPI.uploadProduct(name: "Camera roll upload", store: store) { _ in }
                MSHaptic.success()
                setProduct(a)
                router.toast("\(a.name) ready", style: .success, icon: "checkmark.circle.fill")
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
        }
    }

    private var currentVisualURL: String? {
        switch mode {
        case .video: return video.result?.posterURL ?? video.sourceAsset?.imageURL
        case .ugc: return ugc.result?.posterURL ?? ugc.creator?.avatarURL
        default: return image.selected?.url ?? image.productAsset?.imageURL
        }
    }

    private var currentAspect: CGFloat {
        switch mode {
        case .video: return StudioOptions.aspect(video.ratio)
        case .ugc: return StudioOptions.aspect(ugc.ratio)
        default: return image.hasResults ? StudioOptions.aspect(image.ratio) : 0.8
        }
    }

    private var currentAssetId: String? {
        switch mode {
        case .video: return video.result?.assetId ?? video.sourceAsset?.id
        case .ugc: return ugc.result?.assetId ?? ugc.productAsset?.id
        default: return image.selected?.assetId ?? image.productAsset?.id
        }
    }

    private func export() {
        guard let id = currentAssetId else {
            router.toast("Nothing to export yet", style: .info)
            return
        }
        router.present(.exportAssets(ids: [id]))
    }

    /// Templates hand off through `store.pendingTemplateId` (set by TemplateDetailView) so the
    /// Studio can preload the prompt/style/ratio and jump to the matching mode.
    private func consumePendingTemplate() {
        guard let id = store.pendingTemplateId, let t = store.template(id) else { return }
        store.pendingTemplateId = nil
        let isVideo = t.format.localizedCaseInsensitiveContains("video") || t.format.localizedCaseInsensitiveContains("reel")
        withAnimation(MSAnimation.gentle) {
            if isVideo {
                video.reset()
                video.concept = t.prompt
                if StudioOptions.videoStyles.contains(t.style) { video.style = t.style }
                if StudioOptions.ratios.contains(t.ratio) { video.ratio = t.ratio }
                mode = .video
            } else {
                image.reset()
                image.applyTemplate(t)
                mode = .image
            }
        }
        markSaved()
    }

    private func applyPreferencesIfFresh() {
        guard image.results.isEmpty, image.prompt.isEmpty else { return }
        image.style = store.preferences.defaultStyle
        image.ratio = store.preferences.defaultRatio
        if StudioOptions.models.contains(store.preferences.defaultModel) { image.model = store.preferences.defaultModel }
    }

    // MARK: Undo / redo / save status

    private func recordSnapshot() {
        guard !restoring else { return }
        history.record(StudioSnapshot(prompt: image.prompt, productAssetId: image.productAsset?.id, selectedResultId: image.selectedId))
        markSaving()
        markSaved(after: 0.8)
    }

    private func undo() { restore(history.undo()) }
    private func redo() { restore(history.redo()) }

    private func restore(_ s: StudioSnapshot?) {
        guard let s else { return }
        restoring = true
        withAnimation(MSAnimation.gentle) {
            image.prompt = s.prompt
            image.productAsset = s.productAssetId.flatMap { store.asset($0) }
            if let id = s.selectedResultId, image.results.contains(where: { $0.id == id }) { image.selectedId = id }
        }
        DispatchQueue.main.async { restoring = false }
    }

    private func markSaving() { saveStatus = "Saving" }

    private func markSaved(after seconds: Double = 0) {
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .seconds(seconds))
            guard !Task.isCancelled else { return }
            withAnimation(MSAnimation.gentle) { saveStatus = "Saved" }
        }
    }
}

// MARK: - Canvas media

/// Full-bleed image (or video poster) with legibility gradients for the overlaid bars.
struct StudioCanvasMedia: View {
    var url: String?
    var dimmed: Bool = false
    var onTap: (() -> Void)? = nil

    var body: some View {
        GeometryReader { geo in
            ZStack {
                if let url {
                    RemoteImage(url: url, contentMode: .fill)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                } else {
                    MSColor.surface
                }
                VStack(spacing: 0) {
                    LinearGradient(colors: [.black.opacity(0.55), .clear], startPoint: .top, endPoint: .bottom).frame(height: 150)
                    Spacer(minLength: 0)
                    LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .top, endPoint: .bottom).frame(height: 260)
                }
                if dimmed { Color.black.opacity(0.55) }
            }
            .contentShape(Rectangle())
            .onTapGesture { onTap?() }
        }
        .accessibilityHidden(onTap == nil)
    }
}

// MARK: - Mode pill

/// Compact floating segmented pill: canvas modes inline, screen-based modes behind a chevron menu.
struct StudioModePill: View {
    var mode: StudioMode
    var select: (StudioMode) -> Void
    @Namespace private var ns

    var body: some View {
        HStack(spacing: 2) {
            ForEach(StudioMode.allCases.filter(\.isCanvas)) { m in
                Button {
                    MSHaptic.tap()
                    select(m)
                } label: {
                    Text(m.title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(mode == m ? MSColor.text : MSColor.text2)
                        .padding(.horizontal, 13)
                        .frame(height: 30)
                        .background {
                            if mode == m {
                                Capsule().fill(MSColor.elevated)
                                    .overlay(Capsule().strokeBorder(MSColor.borderStrong, lineWidth: 1))
                                    .matchedGeometryEffect(id: "mode", in: ns)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
            Menu {
                ForEach(StudioMode.allCases.filter { !$0.isCanvas }) { m in
                    Button { select(m) } label: { Text(m.title) }
                }
            } label: {
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(MSColor.text2)
                    .frame(width: 28, height: 30)
            }
            .menuOrder(.fixed)
            .accessibilityLabel("More modes")
        }
        .padding(3)
        .overlayPill()
        .animation(MSAnimation.snappy, value: mode)
    }
}

// MARK: - Video playback

/// Fullscreen playback for a generated video (mock player over the poster).
struct VideoPlaybackScreen: View {
    var result: VideoResult
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            MockVideoPlayer(posterURL: result.posterURL, duration: result.duration, ratio: result.ratio)
                .padding(.horizontal, 16)
            MSIconButton(icon: "xmark", size: 36) { dismiss() }
                .padding(16)
        }
        .preferredColorScheme(.dark)
    }
}

private struct StudioBottomInsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

// MARK: - Overlay pill style

private struct OverlayPillModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(MSColor.bg.opacity(0.62), in: Capsule())
            .overlay(Capsule().strokeBorder(.white.opacity(0.1), lineWidth: 1))
    }
}

extension View {
    /// Translucent black capsule used for controls floating over the Studio canvas.
    func overlayPill() -> some View { modifier(OverlayPillModifier()) }
}
