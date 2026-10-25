import SwiftUI
import PhotosUI
import AVKit
import Combine

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

    @State private var examplePicker = false
    @State private var presetPicker = false
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
        case .video: return video.cost
        case .ugc: return ugc.cost
        default: return image.cost
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
            if mode == .video || mode == .ugc {
                Button { promptFocused = false; examplePicker = true } label: {
                    Label("Exemples vidéo Higgsfield", systemImage: "play.rectangle")
                        .font(.subheadline)
                }
            }
            if mode == .image && image.supportsPresets {
                Button { promptFocused = false; presetPicker = true } label: {
                    Label(image.activePreset?.name ?? "Modèles Marketing Studio", systemImage: "rectangle.grid.2x2")
                        .font(.subheadline)
                }
                .disabled(image.productAsset == nil || busy)
                Text(image.productAsset == nil ? "Ajoutez une photo produit pour choisir une mise en page." : image.activePreset == nil ? "Choisissez une mise en page pour votre produit." : "Supplément de 10 % inclus dans les crédits affichés.")
                    .font(.caption).foregroundStyle(.secondary)
            }
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
        .sheet(isPresented: $examplePicker) { HiggsfieldVideoExamples() }
        .sheet(isPresented: $presetPicker) {
            MarketingPresetPicker(selection: $image.preset)
        }
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
            if mode == .image {
                MediaSlot(url: image.creator?.avatarURL, title: "Créateur", icon: "person.crop.square", onTap: openCreator) {
                    withAnimation(MSAnimation.snappy) { image.creator = nil }
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
        if mode == .image, image.creator != nil { return [.text("Photo de"), .creator, .text("avec"), .product] }
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
                let c = mode == .image ? image.creator : ugc.creator
                PromptChip(imageURL: c?.avatarURL, icon: "person", text: c?.name ?? "créateur", filled: c != nil, circular: true)
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
                    if mode == .image, image.creator != nil {
                        Menu {
                            Button { MSHaptic.tap(); image.multiShot = true; image.count = 4 } label: {
                                if image.multiShot { Label("Multi-plans (4 angles)", systemImage: "checkmark") } else { Text("Multi-plans (4 angles)") }
                            }
                            Section("Un seul plan") {
                                ForEach(API.influencerShots, id: \.id) { s in
                                    Button { MSHaptic.tap(); image.multiShot = false; image.shot = s.id } label: {
                                        if !image.multiShot && image.shot == s.id { Label(s.label, systemImage: "checkmark") } else { Text(s.label) }
                                    }
                                }
                            }
                        } label: {
                            controlPillLabel(icon: "person.crop.rectangle", text: image.multiShot ? "Multi-plans" : (API.influencerShots.first { $0.id == image.shot }?.label ?? "Plan"))
                        }
                        .menuOrder(.fixed)
                    }
                    if mode == .image, image.productAsset != nil, image.creator == nil {
                        Menu {
                            ForEach(ProductStyleOption.all, id: \.id) { s in
                                Button {
                                    MSHaptic.tap()
                                    image.productStyleId = s.id
                                } label: {
                                    if image.productStyleId == s.id { Label("\(s.emoji) \(s.label)", systemImage: "checkmark") } else { Text("\(s.emoji) \(s.label)") }
                                }
                            }
                        } label: {
                            controlPillLabel(icon: "paintbrush", text: ProductStyleOption.all.first { $0.id == image.productStyleId }?.label ?? "Style")
                        }
                        .menuOrder(.fixed)
                    }
                    RatioPickerPill(ratio: ratio)
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
        BottomSheetContainer(title: "Modèle", subtitle: "Prix en crédits Marketing Studio. Les modèles vidéo sont facturés à la seconde.") {
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


/// Format pill: shows the current frame shape; opens a popover of frame shapes with the selected one highlighted.
struct RatioPickerPill: View {
    @Binding var ratio: String
    @State private var open = false

    static func shape(_ r: String, max side: CGFloat) -> CGSize {
        let parts = r.split(separator: ":").compactMap { Double($0) }
        guard parts.count == 2, parts[0] > 0, parts[1] > 0 else { return CGSize(width: side, height: side) }
        let w = parts[0], h = parts[1]
        return w >= h ? CGSize(width: side, height: side * h / w) : CGSize(width: side * w / h, height: side)
    }

    var body: some View {
        Button { MSHaptic.tap(); open = true } label: {
            HStack(spacing: 7) {
                let s = Self.shape(ratio, max: 15)
                RoundedRectangle(cornerRadius: 2.5).strokeBorder(MSColor.accent, lineWidth: 1.6).frame(width: s.width, height: s.height).frame(width: 16, height: 16)
                Text(ratio).font(MSFont.control(13)).lineLimit(1).fixedSize()
            }
            .foregroundStyle(MSColor.text)
            .padding(.horizontal, 10)
            .frame(height: 42)
            .background(MSColor.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(open ? MSColor.accent.opacity(0.7) : MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
        .accessibilityLabel("Format \(ratio)")
        .popover(isPresented: $open, arrowEdge: .bottom) {
            VStack(alignment: .leading, spacing: 10) {
                Text("Format").msHeadline(14)
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(StudioOptions.ratios, id: \.self) { r in
                        let selected = r == ratio
                        Button {
                            MSHaptic.tap()
                            withAnimation(MSAnimation.snappy) { ratio = r }
                            open = false
                        } label: {
                            VStack(spacing: 6) {
                                let s = Self.shape(r, max: 34)
                                RoundedRectangle(cornerRadius: 5, style: .continuous)
                                    .fill(selected ? MSColor.accent.opacity(0.22) : MSColor.elevated)
                                    .overlay(RoundedRectangle(cornerRadius: 5, style: .continuous).strokeBorder(selected ? MSColor.accent : MSColor.border, lineWidth: selected ? 2 : 1))
                                    .frame(width: s.width, height: s.height)
                                    .frame(width: 40, height: 40)
                                Text(r).font(MSFont.caption(12)).foregroundStyle(selected ? MSColor.accent : MSColor.text2)
                            }
                            .padding(6)
                            .background(selected ? MSColor.accent.opacity(0.08) : .clear, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(14)
            .presentationCompactAdaptation(.popover)
            .preferredColorScheme(.dark)
        }
    }
}


/// Live ad layouts from the shared server; credentials stay on the server.
private struct MarketingPresetPicker: View {
    @Binding var selection: MarketingPreset?
    @Environment(\.dismiss) private var dismiss
    @State private var items: [MarketingPreset] = []
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Button("Mise en page libre") { selection = nil; dismiss() }
                    if loading { ProgressView("Chargement des modèles…") }
                    if let error {
                        Text(error).font(.callout)
                        Button("Réessayer") { Task { await load() } }
                    }
                    if !loading && error == nil && items.isEmpty {
                        Text("Aucun modèle disponible pour le moment.").foregroundStyle(.secondary)
                    }
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(items) { preset in
                            Button { selection = preset; dismiss() } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    AsyncImage(url: preset.preview.flatMap(URL.init(string:))) { image in
                                        image.resizable().scaledToFill()
                                    } placeholder: {
                                        Rectangle().fill(.quaternary)
                                            .overlay(Image(systemName: "rectangle.grid.2x2"))
                                    }
                                    .frame(height: 160).clipped().cornerRadius(12)
                                    HStack {
                                        Text(preset.name).font(.caption).lineLimit(2)
                                        if selection?.id == preset.id { Image(systemName: "checkmark.circle.fill") }
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }.padding()
            }
            .navigationTitle("Modèles de pub")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fermer") { dismiss() } } }
            .task { await load() }
        }
    }

    @MainActor private func load() async {
        loading = true
        error = nil
        defer { loading = false }
        do { items = try await APIClient.marketingPresets() }
        catch is CancellationError { }
        catch { self.error = error.localizedDescription }
    }
}


private struct HiggsfieldVideoExample: Identifiable {
    var id: String { source }
    let name: String
    let category: String
    let url: String
    let source: String
    static let all: [Self] = [
        .init(name: "Green Tea Macro", category: "Motion", url: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/68a696dc-2c2e-43b1-b285-511c8783db1f.mp4", source: "https://higgsfield.ai/marketing-studio/preset/green-tea-macro-6089a97b-4e49-43ed-9338-09a9c63e2783"),
        .init(name: "Pixel Block Yard", category: "Motion", url: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/353daae1-e520-486b-b7d5-83f026169305.mp4", source: "https://higgsfield.ai/marketing-studio/preset/pixel-block-yard-000b690e-7f6d-4a7c-9196-a90f15494bb6"),
        .init(name: "Before and After", category: "UGC", url: "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/a6bd1da8-b768-425e-beb6-821075efbc2e-6748bfc5a91afbfc.mp4", source: "https://higgsfield.ai/marketing-studio/preset/before-and-after-3728af13-8efa-4703-a10f-69b142c2df52"),
        .init(name: "Monospace Callouts", category: "Motion", url: "https://cdn.higgsfield.ai/marketing-studio-motion-preview/aef59e19-f388-4dcc-b55a-e43a5c48c835.mp4", source: "https://higgsfield.ai/marketing-studio/preset/monospace-callouts-46406130-acc3-43f0-b6fe-554a22cad279")
    ]
}

private struct HiggsfieldVideoExamples: View {
    @Environment(\.dismiss) private var dismiss
    @State private var category = "Tous"
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Exemples UGC et motion de Higgsfield Marketing Studio.")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Picker("Catégorie", selection: $category) {
                        ForEach(["Tous", "UGC", "Motion"], id: \.self) { Text($0).tag($0) }
                    }.pickerStyle(.segmented)
                    ForEach(HiggsfieldVideoExample.all.filter { category == "Tous" || $0.category == category }) { example in
                        HiggsfieldExamplePlayer(example: example)
                    }
                }.padding()
            }
            .navigationTitle("Inspiration vidéo")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fermer") { dismiss() } } }
        }
    }
}

private struct HiggsfieldExamplePlayer: View {
    let example: HiggsfieldVideoExample
    @State private var player: AVPlayer?
    @State private var unavailable = false
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            VideoPlayer(player: player)
                .frame(height: 300).clipShape(RoundedRectangle(cornerRadius: 12))
            if unavailable { Text("Aperçu indisponible. Consultez cet exemple sur Higgsfield.").font(.caption).foregroundStyle(.secondary) }
            Text(example.name).font(.headline)
            Text(example.category).font(.caption).foregroundStyle(.secondary)
            if let source = URL(string: example.source) {
                Link("Voir sur Higgsfield ↗", destination: source)
            }
        }
        .onAppear { if player == nil, let url = URL(string: example.url) { player = AVPlayer(url: url) } }
        .onReceive(player?.currentItem?.publisher(for: \.status).eraseToAnyPublisher() ?? Empty<AVPlayerItem.Status, Never>().eraseToAnyPublisher()) { status in
            unavailable = status == .failed
        }
        .onDisappear { player?.pause(); player = nil }
    }
}
