import SwiftUI

// MARK: - Small building blocks

/// Label + wrapping chip group bound to a single String.
struct OptionChips: View {
    var label: String
    var options: [String]
    @Binding var value: String
    var icons: [String: String] = [:]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label.uppercased()).font(MSFont.caption(11)).tracking(0.6).foregroundStyle(MSColor.muted)
            FlowLayout(spacing: 8) {
                ForEach(options, id: \.self) { o in
                    MSChip(title: StudioOptions.label(o), icon: icons[o], selected: o == value) {
                        withAnimation(MSAnimation.snappy) { value = o }
                    }
                }
            }
        }
    }
}

/// Horizontal picker of image assets used as the product / source image.
struct AssetSourcePicker: View {
    var label: String
    @Binding var selected: Asset?
    var onUpload: () -> Void
    @EnvironmentObject private var store: AppStore

    private var candidates: [Asset] {
        var list = store.assets.filter { $0.kind == .image }
        if let s = selected, !list.contains(where: { $0.id == s.id }) { list.insert(s, at: 0) }
        return Array(list.prefix(14))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label.uppercased()).font(MSFont.caption(11)).tracking(0.6).foregroundStyle(MSColor.muted)
                Spacer()
                if let s = selected {
                    Button { withAnimation(MSAnimation.snappy) { selected = nil } } label: {
                        Text("Retirer · \(s.name)").font(MSFont.caption(11)).foregroundStyle(MSColor.text2).lineLimit(1)
                    }
                }
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    Button {
                        MSHaptic.tap()
                        onUpload()
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: "plus").font(.system(size: 16, weight: .semibold))
                            Text("Importer").font(MSFont.caption(10))
                        }
                        .foregroundStyle(MSColor.text2)
                        .frame(width: 64, height: 76)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                    }
                    .buttonStyle(.plain)
                    ForEach(candidates) { a in
                        let on = a.id == selected?.id
                        Button {
                            MSHaptic.tap()
                            withAnimation(MSAnimation.snappy) { selected = on ? nil : a }
                        } label: {
                            RemoteImage(url: a.imageURL, cornerRadius: MSRadius.md)
                                .frame(width: 64, height: 76)
                                .clipShape(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: on ? 2 : 1))
                                .overlay(alignment: .topTrailing) {
                                    if on {
                                        Image(systemName: "checkmark.circle.fill").font(.system(size: 14)).foregroundStyle(MSColor.accent)
                                            .background(Circle().fill(.black)).padding(4)
                                    }
                                }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 2)
            }
        }
    }
}

// MARK: - Image options (SPEC §11)

/// All image inputs. `full` includes the product picker and prompt (standalone screen);
/// the Studio options sheet passes `full: false` because prompt + product live in the generation bar.
struct ImageOptionsForm: View {
    @ObservedObject var session: ImageGenSession
    var full: Bool = true
    var onUpload: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if full {
                AssetSourcePicker(label: "Produit", selected: $session.productAsset, onUpload: onUpload)
                MSTextEditor(label: "Prompt", placeholder: StudioOptions.promptPlaceholder, text: $session.prompt, minHeight: 90)
            }
            OptionChips(label: "Style", options: StudioOptions.styles, value: $session.style)
            OptionChips(label: "Format", options: StudioOptions.ratios, value: $session.ratio)
            OptionChips(label: "Arrière-plan", options: StudioOptions.backgrounds, value: $session.background)
            OptionChips(label: "Éclairage", options: StudioOptions.lighting, value: $session.lighting)
            OptionChips(label: "Cadrage", options: StudioOptions.cameras, value: $session.camera)
            OptionChips(label: "Composition", options: StudioOptions.compositions, value: $session.composition)
            OptionChips(label: "Modèle", options: StudioOptions.models, value: $session.model)
        }
    }
}

// MARK: - Video options (SPEC §14)

struct VideoOptionsForm: View {
    @ObservedObject var session: VideoGenSession
    var full: Bool = true
    var onUpload: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if full {
                AssetSourcePicker(label: "Image source", selected: $session.sourceAsset, onUpload: onUpload)
                MSTextEditor(label: "Concept", placeholder: "Rotation lente autour du pot de karité sur un pagne wax, douce lumière du matin...", text: $session.concept, minHeight: 90)
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("DURÉE").font(MSFont.caption(11)).tracking(0.6).foregroundStyle(MSColor.muted)
                HStack(spacing: 8) {
                    ForEach(StudioOptions.videoDurations, id: \.self) { d in
                        MSChip(title: "\(d)s", icon: "timer", selected: d == session.duration) {
                            withAnimation(MSAnimation.snappy) { session.duration = d }
                        }
                    }
                }
            }
            OptionChips(label: "Format", options: StudioOptions.ratios, value: $session.ratio)
            OptionChips(label: "Mouvement de caméra", options: StudioOptions.videoCameras, value: $session.camera)
            OptionChips(label: "Style", options: StudioOptions.videoStyles, value: $session.style)
            OptionChips(label: "Modèle", options: StudioOptions.videoModels, value: $session.model)
        }
    }
}

// MARK: - UGC options (SPEC §15)

struct UGCOptionsForm: View {
    @ObservedObject var session: UGCGenSession

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OptionChips(label: "Lieu", options: StudioOptions.ugcLocations, value: $session.location)
            OptionChips(label: "Ton", options: StudioOptions.ugcTones, value: $session.tone)
            VStack(alignment: .leading, spacing: 8) {
                Text("DURÉE").font(MSFont.caption(11)).tracking(0.6).foregroundStyle(MSColor.muted)
                HStack(spacing: 8) {
                    ForEach(StudioOptions.ugcDurations, id: \.self) { d in
                        MSChip(title: "\(d)s", icon: "timer", selected: d == session.duration) {
                            withAnimation(MSAnimation.snappy) { session.duration = d }
                        }
                    }
                }
            }
            OptionChips(label: "Format", options: StudioOptions.ratios, value: $session.ratio)
            OptionChips(label: "Modèle", options: StudioOptions.ugcModels, value: $session.model)
        }
    }
}

// MARK: - Loading (SPEC §44)

/// "Creating your visual..." animated placeholder shown in place of the canvas / gallery.
struct CreatingVisualView: View {
    var title: String = "Création de votre visuel..."
    var subtitle: String = "Composition de la scène, de l'éclairage et du produit"
    var aspect: CGFloat = 0.8
    @State private var phase: CGFloat = -1
    @State private var pulse = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous)
                .fill(MSColor.card)
            RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous)
                .fill(
                    LinearGradient(colors: [.clear, MSColor.accent.opacity(0.22), .clear], startPoint: .leading, endPoint: .trailing)
                )
                .offset(x: phase * 300)
                .mask(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous)
                .strokeBorder(MSColor.accent.opacity(pulse ? 0.5 : 0.12), lineWidth: 1)
            VStack(spacing: 12) {
                ZStack {
                    Circle().fill(MSColor.accent.opacity(0.14)).frame(width: 64, height: 64).scaleEffect(pulse ? 1.15 : 0.9)
                    Image(systemName: "sparkles").font(.system(size: 24, weight: .semibold)).foregroundStyle(MSColor.highlight)
                        .rotationEffect(.degrees(pulse ? 12 : -12))
                }
                Text(title).msHeadline(16)
                Text(subtitle).msCaption()
            }
        }
        .aspectRatio(aspect, contentMode: .fit)
        .frame(maxWidth: .infinity)
        .onAppear {
            withAnimation(.linear(duration: 1.6).repeatForever(autoreverses: false)) { phase = 1.5 }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) { pulse = true }
        }
    }
}
