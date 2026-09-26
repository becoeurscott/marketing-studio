import SwiftUI

/// SPEC §13. Lightweight image editor: tool list + inspector (prompt, strength, ratio) + Apply Changes (mock).
struct ImageEditorView: View {
    var imageURL: String
    var ratio: String
    var onApply: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var tool = "Retouch"
    @State private var prompt = ""
    @State private var strength = 0.6
    @State private var selectedRatio: String
    @State private var applying = false
    @State private var showInspector = true

    init(imageURL: String, ratio: String, onApply: @escaping (String) -> Void) {
        self.imageURL = imageURL
        self.ratio = ratio
        self.onApply = onApply
        _selectedRatio = State(initialValue: ratio)
    }

    static let tools: [(String, String)] = [
        ("Crop", "crop"), ("Resize", "arrow.up.left.and.arrow.down.right.square"), ("Remove Background", "scissors"),
        ("Replace Background", "photo.on.rectangle"), ("Relight", "sun.max"), ("Retouch", "wand.and.stars"),
        ("Add Text", "textformat"), ("Add Logo", "seal"), ("Expand Image", "arrow.up.left.and.down.right.magnifyingglass"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            header
            canvas
            toolStrip
            if showInspector { inspector }
            footer
        }
        .msScreen()
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            MSIconButton(icon: "xmark", size: 34) { dismiss() }
            Spacer()
            VStack(spacing: 1) {
                Text("Éditeur d'image").msHeadline(15)
                Text(tool).msCaption(color: MSColor.highlight)
            }
            Spacer()
            MSIconButton(icon: showInspector ? "slider.horizontal.below.rectangle" : "slider.horizontal.3", size: 34) {
                withAnimation(MSAnimation.snappy) { showInspector.toggle() }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.vertical, 10)
    }

    private var canvas: some View {
        ZStack {
            StudioZoomableImage(url: imageURL, aspect: StudioOptions.aspect(selectedRatio), showControls: false)
                .padding(.horizontal, MSSpacing.gutter)
            if applying {
                RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous)
                    .fill(.black.opacity(0.55))
                    .padding(.horizontal, MSSpacing.gutter)
                VStack(spacing: 10) {
                    ProgressView().tint(MSColor.highlight).scaleEffect(1.2)
                    Text("Application : \(StudioOptions.label(tool).lowercased())...").msHeadline(14)
                }
            }
        }
        .frame(maxHeight: .infinity)
    }

    private var toolStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Self.tools, id: \.0) { name, icon in
                    let on = name == tool
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { tool = name }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: icon)
                                .font(.system(size: 16, weight: .semibold))
                                .frame(width: 44, height: 44)
                                .background(on ? MSColor.accent.opacity(0.18) : MSColor.card, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: 1))
                                .foregroundStyle(on ? MSColor.highlight : MSColor.text)
                            Text(StudioOptions.label(name)).font(MSFont.caption(10)).foregroundStyle(on ? MSColor.text : MSColor.muted).lineLimit(1)
                        }
                        .frame(width: 64)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
        .padding(.vertical, 12)
    }

    private var inspector: some View {
        VStack(alignment: .leading, spacing: 12) {
            MSTextField(placeholder: inspectorPlaceholder, text: $prompt, icon: "text.cursor")
            HStack {
                Text("Intensité").msCaption(color: MSColor.text2)
                Slider(value: $strength, in: 0...1).tint(MSColor.accent)
                Text("\(Int(strength * 100))%").font(MSFont.mono(12)).foregroundStyle(MSColor.text2).frame(width: 40, alignment: .trailing)
            }
            HStack(spacing: 6) {
                Text("Format").msCaption(color: MSColor.text2)
                ForEach(StudioOptions.ratios, id: \.self) { r in
                    MSChip(title: r, selected: r == selectedRatio) { withAnimation(MSAnimation.snappy) { selectedRatio = r } }
                }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 8)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private var inspectorPlaceholder: String {
        switch tool {
        case "Replace Background": return "Décrivez le nouvel arrière-plan..."
        case "Add Text": return "Texte à ajouter, ex. -20 % pour le lancement"
        case "Relight": return "Direction de la lumière, ex. chaude depuis la gauche"
        default: return "Décrivez la modification (facultatif)"
        }
    }

    private var footer: some View {
        MSButton(title: "Appliquer", icon: "checkmark", isLoading: applying) {
            applying = true
            Task {
                try? await Task.sleep(for: .seconds(1.3))
                applying = false
                onApply(tool)
                dismiss()
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 12)
    }
}
