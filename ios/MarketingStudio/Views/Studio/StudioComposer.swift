import SwiftUI
import PhotosUI

/// Floating Studio composer (SPEC §9 generation bar, redesigned):
/// [media slots] / [inline prompt with product + creator chips] / [model][duration][ratio][more] ... [Generate].
struct StudioComposer: View {
    var mode: StudioMode
    @ObservedObject var image: ImageGenSession
    @ObservedObject var video: VideoGenSession
    @ObservedObject var ugc: UGCGenSession

    @Binding var photoItem: PhotosPickerItem?
    /// Mirrors the prompt's keyboard focus for the parent screen.
    @Binding var composing: Bool
    var onProduct: () -> Void
    var onCreator: () -> Void
    var onModel: () -> Void
    var onMore: () -> Void
    var onGenerate: () -> Void

    @FocusState private var promptFocused: Bool

    // MARK: Derived

    private var busy: Bool {
        switch mode {
        case .video: return video.isGenerating
        case .ugc: return ugc.isGenerating
        default: return image.isGenerating
        }
    }
    private var canGenerate: Bool {
        switch mode {
        case .ugc: return ugc.canGenerate
        default: return true
        }
    }
    private var cost: Int {
        switch mode {
        case .video: return VideoGenSession.cost
        case .ugc: return UGCGenSession.cost
        default: return ImageGenSession.cost
        }
    }
    private var product: Asset? {
        switch mode {
        case .video: return video.sourceAsset
        case .ugc: return ugc.productAsset
        default: return image.productAsset
        }
    }
    private var model: String {
        switch mode {
        case .video: return video.model
        case .ugc: return ugc.model
        default: return image.model
        }
    }
    private var ratio: Binding<String> {
        switch mode {
        case .video: return $video.ratio
        case .ugc: return $ugc.ratio
        default: return $image.ratio
        }
    }
    private var details: Binding<String> {
        switch mode {
        case .video: return $video.concept
        case .ugc: return $ugc.script
        default: return $image.prompt
        }
    }
    private var detailsPlaceholder: String {
        switch mode {
        case .video: return "Ajoutez des notes de mouvement, d'ambiance ou de rythme..."
        case .ugc: return "Ajoutez un script ou des points clés..."
        default: return "Ajoutez des détails, une ambiance ou un éclairage..."
        }
    }

    // MARK: Body

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            slots
            promptArea
            controls
        }
        .padding(16)
        .background(MSColor.bg.opacity(0.92), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.45), radius: 24, y: 10)
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
        .animation(MSAnimation.snappy, value: promptFocused)
        .animation(MSAnimation.gentle, value: mode)
        .onChange(of: promptFocused) { _, f in composing = f }
    }

    // MARK: Slots

    private var slots: some View {
        HStack(spacing: 10) {
            MediaSlot(url: product?.imageURL, title: mode == .video ? "Source" : "Produit", icon: "shippingbox", onTap: openProduct) {
                clearProduct()
            }
            if mode == .ugc {
                MediaSlot(url: ugc.creator?.avatarURL, title: "Créateur", icon: "person.crop.square", onTap: openCreator) {
                    withAnimation(MSAnimation.snappy) { ugc.creator = nil }
                }
                .transition(.scale(scale: 0.8).combined(with: .opacity))
            }
            PhotosPicker(selection: $photoItem, matching: .images) {
                MediaSlot.placeholder(icon: "photo.on.rectangle.angled", title: nil, dashed: true)
            }
            .buttonStyle(MSPressStyle())
            .accessibilityLabel("Ajouter un média depuis Photos")
            Spacer(minLength: 0)
        }
    }

    /// Pickers present as sheets; drop keyboard focus first so it doesn't pop back when they dismiss.
    private func openProduct() { promptFocused = false; onProduct() }
    private func openCreator() { promptFocused = false; onCreator() }

    private func clearProduct() {
        withAnimation(MSAnimation.snappy) {
            switch mode {
            case .video: video.sourceAsset = nil
            case .ugc: ugc.productAsset = nil
            default: image.productAsset = nil
            }
        }
    }

    // MARK: Inline prompt

    private var promptArea: some View {
        VStack(alignment: .leading, spacing: 6) {
            FlowLayout(spacing: 5) {
                ForEach(Array(tokens.enumerated()), id: \.offset) { _, token in
                    tokenView(token)
                }
            }
            TextField(detailsPlaceholder, text: details, axis: .vertical)
                .lineLimit(promptFocused ? 2...5 : 1...3)
                .font(MSFont.body(15))
                .foregroundStyle(MSColor.text)
                .tint(MSColor.accent)
                .focused($promptFocused)
                .submitLabel(.return)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, promptFocused ? 6 : 0)
        .overlay(alignment: .bottom) {
            Rectangle().fill(promptFocused ? MSColor.accent.opacity(0.6) : .clear).frame(height: 1)
        }
        .contentShape(Rectangle())
        .onTapGesture { promptFocused = true }
    }

    private enum Token { case text(String), product, creator, style, camera }

    private var tokens: [Token] {
        switch mode {
        case .video: return [.text("Animer"), .product, .text("avec un mouvement"), .camera, .text(", style"), .style]
        case .ugc: return [.text("Créer une vidéo UGC où"), .creator, .text("apprécie le produit"), .product]
        default: return [.text("Créer une photo produit"), .style, .text("de"), .product]
        }
    }

    /// The sentence the chips spell out, sent to the API ahead of the free-text details.
    static func leadIn(mode: StudioMode, image: ImageGenSession, video: VideoGenSession, ugc: UGCGenSession) -> String {
        switch mode {
        case .video:
            return "Animate \(video.sourceAsset?.name ?? "the product") with a \(video.camera.lowercased()) move, \(video.style.lowercased()) style"
        case .ugc:
            return "Create UGC video where \(ugc.creator?.name ?? "the creator") enjoys the product \(ugc.productAsset?.name ?? "")".trimmingCharacters(in: .whitespaces)
        default:
            return "Create a \(image.style.lowercased()) product shot of \(image.productAsset?.name ?? "the product")"
        }
    }

    @ViewBuilder
    private func tokenView(_ token: Token) -> some View {
        switch token {
        case .text(let s):
            Text(s).font(MSFont.body(15)).foregroundStyle(MSColor.text).fixedSize()
        case .product:
            Button {
                MSHaptic.tap()
                openProduct()
            } label: {
                PromptChip(imageURL: product?.imageURL, icon: "shippingbox", text: product?.name ?? "produit", filled: product != nil)
            }
            .buttonStyle(MSPressStyle())
        case .creator:
            Button {
                MSHaptic.tap()
                openCreator()
            } label: {
                PromptChip(imageURL: ugc.creator?.avatarURL, icon: "person", text: ugc.creator?.name ?? "créateur", filled: ugc.creator != nil, circular: true)
            }
            .buttonStyle(MSPressStyle())
        case .style:
            let value = mode == .video ? video.style : image.style
            optionMenu(options: mode == .video ? StudioOptions.videoStyles : StudioOptions.styles, value: value) { v in
                if mode == .video { video.style = v } else { image.style = v }
            } label: {
                PromptChip(imageURL: nil, icon: "paintbrush", text: StudioOptions.label(value), filled: true)
            }
        case .camera:
            optionMenu(options: StudioOptions.videoCameras, value: video.camera) { video.camera = $0 } label: {
                PromptChip(imageURL: nil, icon: "camera", text: StudioOptions.label(video.camera), filled: true)
            }
        }
    }

    private func optionMenu<L: View>(options: [String], value: String, set: @escaping (String) -> Void, @ViewBuilder label: () -> L) -> some View {
        Menu {
            ForEach(options, id: \.self) { o in
                Button {
                    MSHaptic.tap()
                    withAnimation(MSAnimation.snappy) { set(o) }
                } label: {
                    if o == value { Label(StudioOptions.label(o), systemImage: "checkmark") } else { Text(StudioOptions.label(o)) }
                }
            }
        } label: {
            label()
        }
        .menuOrder(.fixed)
    }

    // MARK: Controls

    private var controls: some View {
        HStack(spacing: 8) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    controlPill(icon: modelIcon, text: model, action: onModel)
                    if mode == .video {
                        optionMenu(options: StudioOptions.videoDurations.map { "\($0)s" }, value: "\(video.duration)s") { video.duration = Int($0.dropLast()) ?? 10 } label: {
                            controlPillLabel(icon: "clock", text: "\(video.duration)s")
                        }
                    } else if mode == .ugc {
                        optionMenu(options: StudioOptions.ugcDurations.map { "\($0)s" }, value: "\(ugc.duration)s") { ugc.duration = Int($0.dropLast()) ?? 15 } label: {
                            controlPillLabel(icon: "clock", text: "\(ugc.duration)s")
                        }
                    }
                    optionMenu(options: StudioOptions.ratios, value: ratio.wrappedValue) { ratio.wrappedValue = $0 } label: {
                        controlPillLabel(icon: "viewfinder", text: ratio.wrappedValue)
                    }
                    controlPill(icon: "slider.horizontal.3", text: nil, action: onMore)
                        .accessibilityLabel("Plus d'options")
                }
            }
            .mask(
                HStack(spacing: 0) {
                    Rectangle()
                    LinearGradient(colors: [.black, .clear], startPoint: .leading, endPoint: .trailing).frame(width: 14)
                }
            )
            generateButton
        }
    }

    private var modelIcon: String {
        let catalog: [StudioModel]
        switch mode {
        case .video: catalog = StudioOptions.motionModels
        case .ugc: catalog = StudioOptions.personaModels
        default: catalog = StudioOptions.imageModels
        }
        return catalog.first { $0.name == model }?.icon ?? "sparkle"
    }

    private func controlPill(icon: String, text: String?, action: @escaping () -> Void) -> some View {
        Button {
            MSHaptic.tap()
            promptFocused = false
            action()
        } label: {
            controlPillLabel(icon: icon, text: text)
        }
        .buttonStyle(MSPressStyle())
    }

    private func controlPillLabel(icon: String, text: String?) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 13, weight: .semibold))
            if let text { Text(text).font(MSFont.control(13)).lineLimit(1).fixedSize() }
        }
        .foregroundStyle(MSColor.text)
        .padding(.horizontal, text == nil ? 11 : 10)
        .frame(height: 42)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }

    private var generateButton: some View {
        Button {
            promptFocused = false
            MSHaptic.tap()
            onGenerate()
        } label: {
            HStack(spacing: 7) {
                if busy {
                    ProgressView().tint(.white).scaleEffect(0.8)
                } else {
                    Image(systemName: "paperplane.fill").font(.system(size: 15, weight: .bold))
                    Text("\(cost)").font(.system(size: 16, weight: .bold, design: .rounded)).contentTransition(.numericText())
                }
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .frame(minWidth: 82)
            .frame(height: 42)
            .background(canGenerate ? AnyShapeStyle(MSColor.accentGradient) : AnyShapeStyle(MSColor.card))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(canGenerate ? .clear : MSColor.border, lineWidth: 1))
            .opacity(canGenerate ? 1 : 0.6)
            .shadow(color: canGenerate ? MSColor.accent.opacity(0.35) : .clear, radius: 10, y: 4)
        }
        .buttonStyle(MSPressStyle())
        .disabled(!canGenerate || busy)
        .accessibilityLabel("Générer pour \(cost) crédits")
    }
}

// MARK: - Media slot

/// 84pt square thumbnail with an optional clear button, or a dashed placeholder.
struct MediaSlot: View {
    var url: String?
    var title: String
    var icon: String
    var onTap: () -> Void
    var onClear: () -> Void

    static let size: CGFloat = 84

    var body: some View {
        Button {
            MSHaptic.tap()
            onTap()
        } label: {
            if let url {
                RemoteImage(url: url, contentMode: .fill, cornerRadius: 18)
                    .frame(width: Self.size, height: Self.size)
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(MSColor.borderStrong, lineWidth: 1))
            } else {
                Self.placeholder(icon: icon, title: title, dashed: false)
            }
        }
        .buttonStyle(MSPressStyle())
        .overlay(alignment: .topTrailing) {
            if url != nil {
                Button {
                    MSHaptic.tap()
                    onClear()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 20, height: 20)
                        .background(.black.opacity(0.7), in: Circle())
                        .overlay(Circle().strokeBorder(.white.opacity(0.25), lineWidth: 1))
                }
                .buttonStyle(.plain)
                .padding(5)
                .accessibilityLabel("Retirer \(title)")
            }
        }
        .accessibilityLabel(title)
    }

    static func placeholder(icon: String, title: String?, dashed: Bool) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 22, weight: .medium)).foregroundStyle(MSColor.text2)
            if let title { Text(title).font(MSFont.caption(11)).foregroundStyle(MSColor.muted) }
        }
        .frame(width: size, height: size)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: dashed ? [5, 4] : []))
        )
    }
}

// MARK: - Inline chip

/// Inline sentence chip: tiny thumbnail (or icon) + name, sized to sit within a line of body text.
struct PromptChip: View {
    var imageURL: String?
    var icon: String
    var text: String
    var filled: Bool
    var circular: Bool = false

    var body: some View {
        HStack(spacing: 5) {
            Group {
                if let imageURL {
                    RemoteImage(url: imageURL, contentMode: .fill)
                } else {
                    ZStack {
                        MSColor.elevated
                        Image(systemName: icon).font(.system(size: 10, weight: .semibold)).foregroundStyle(MSColor.text2)
                    }
                }
            }
            .frame(width: 20, height: 20)
            .clipShape(RoundedRectangle(cornerRadius: circular ? 10 : 5, style: .continuous))
            Text(text).font(MSFont.control(14)).lineLimit(1).foregroundStyle(filled ? MSColor.text : MSColor.text2)
        }
        .padding(.leading, 4)
        .padding(.trailing, 9)
        .frame(height: 28)
        .background(MSColor.card, in: Capsule())
        .overlay(Capsule().strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: filled ? [] : [4, 3])))
        .fixedSize()
    }
}

// MARK: - Model picker sheet

struct ModelPickerSheet: View {
    var models: [StudioModel]
    @Binding var selection: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetContainer(title: "Modèle", subtitle: "Tous les modèles sont simulés dans ce prototype.") {
            VStack(spacing: 8) {
                ForEach(models) { m in
                    let on = m.name == selection
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { selection = m.name }
                        dismiss()
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: m.icon)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(on ? MSColor.highlight : MSColor.text2)
                                .frame(width: 40, height: 40)
                                .background(on ? MSColor.accent.opacity(0.14) : MSColor.elevated, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(m.name).msHeadline(15)
                                Text(m.tagline).msCaption().lineLimit(1)
                            }
                            Spacer()
                            Text(m.speed).font(MSFont.mono(11)).foregroundStyle(MSColor.muted)
                            if on { Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.accent) }
                        }
                        .padding(12)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 24)
        }
    }
}

// MARK: - Creator picker sheet

struct CreatorPickerSheet: View {
    @Binding var selection: Creator?
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetContainer(title: "Créateur", subtitle: "Tous les créateurs sont des personnages IA fictifs.") {
            ScrollView(showsIndicators: false) {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 10)], spacing: 14) {
                    ForEach(store.creators) { c in
                        CreatorPickCard(creator: c, selected: c.id == selection?.id) {
                            MSHaptic.tap()
                            withAnimation(MSAnimation.snappy) { selection = c }
                            dismiss()
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }
}
