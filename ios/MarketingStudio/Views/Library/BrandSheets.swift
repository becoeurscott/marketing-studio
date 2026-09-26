import SwiftUI

// MARK: - Hex helpers

extension Color {
    /// Parses "#RRGGBB" / "RRGGBB". Falls back to elevated grey.
    init(hexString: String) {
        var h = hexString.trimmingCharacters(in: .whitespaces)
        if h.hasPrefix("#") { h.removeFirst() }
        guard h.count == 6, let v = UInt(h, radix: 16) else { self = MSColor.elevated; return }
        self.init(hex: v)
    }

    /// "#RRGGBB" for the resolved sRGB color.
    var hexString: String {
        let ui = UIColor(self)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        ui.getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X", Int(round(r * 255)), Int(round(g * 255)), Int(round(b * 255)))
    }
}

/// Small colored square with its hex value.
struct ColorSwatch: View {
    var hex: String
    var size: CGFloat = 44
    var showLabel: Bool = true

    var body: some View {
        VStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(hexString: hex))
                .frame(width: size, height: size)
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(MSColor.borderStrong, lineWidth: 1))
            if showLabel {
                Text(hex.uppercased()).font(MSFont.mono(10)).foregroundStyle(MSColor.muted)
            }
        }
    }
}

// MARK: - Edit a single text field of the brand

enum BrandField: String, Identifiable, CaseIterable {
    case name, website, description, industry, audience, fonts
    var id: String { rawValue }
    var title: String {
        switch self {
        case .name: return "Nom de la marque"
        case .website: return "Site web"
        case .description: return "Description"
        case .industry: return "Secteur"
        case .audience: return "Public cible"
        case .fonts: return "Polices"
        }
    }
    var placeholder: String {
        switch self {
        case .name: return "ex. Luma Skin"
        case .website: return "https://"
        case .description: return "Que vend la marque et quelles sont ses valeurs ?"
        case .industry: return "ex. Beauté, Café, Fitness"
        case .audience: return "À qui s'adresse-t-elle ?"
        case .fonts: return "Séparées par des virgules, ex. Inter, Playfair Display"
        }
    }
    var multiline: Bool { self == .description || self == .audience }
}

struct BrandFieldEditSheet: View {
    var field: BrandField
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss
    @State private var value = ""

    private let industries = ["Beauté", "Mode", "Alimentation", "Technologie", "Fitness", "Immobilier", "Café", "Maison", "Finance", "Voyage"]

    var body: some View {
        BottomSheetContainer(title: field.title) {
            VStack(alignment: .leading, spacing: 14) {
                if field.multiline {
                    MSTextEditor(placeholder: field.placeholder, text: $value, minHeight: 120)
                } else {
                    MSTextField(placeholder: field.placeholder, text: $value,
                                keyboard: field == .website ? .URL : .default,
                                autocapitalization: field == .website ? .never : .words)
                }
                if field == .industry {
                    FlowLayout(spacing: 8) {
                        ForEach(industries, id: \.self) { i in
                            MSChip(title: i, selected: value == i) { value = i }
                        }
                    }
                }
                Spacer(minLength: 0)
                MSButton(title: "Enregistrer", icon: "checkmark", isDisabled: value.trimmingCharacters(in: .whitespaces).isEmpty) {
                    var b = store.brand
                    let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
                    switch field {
                    case .name: b.name = v
                    case .website: b.website = v
                    case .description: b.description = v
                    case .industry: b.industry = v
                    case .audience: b.audience = v
                    case .fonts: b.fonts = v.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
                    }
                    store.updateBrand(b)
                    router.toast("\(field.title) mis à jour", style: .success)
                    dismiss()
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
        .onAppear {
            let b = store.brand
            switch field {
            case .name: value = b.name
            case .website: value = b.website
            case .description: value = b.description
            case .industry: value = b.industry
            case .audience: value = b.audience
            case .fonts: value = b.fonts.joined(separator: ", ")
            }
        }
    }
}

// MARK: - Palette editor

struct BrandPaletteSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss
    @State private var colors: [String] = []
    @State private var picked: Color = MSColor.accent
    @State private var hexInput = ""

    var body: some View {
        BottomSheetContainer(title: "Palette de couleurs", subtitle: "Jusqu'à 6 couleurs. Touchez une pastille pour la retirer.") {
            VStack(alignment: .leading, spacing: 18) {
                if colors.isEmpty {
                    Text("Aucune couleur pour l'instant. Ajoutez la première ci-dessous.").msBody(14)
                } else {
                    FlowLayout(spacing: 12) {
                        ForEach(Array(colors.enumerated()), id: \.offset) { i, hex in
                            Button {
                                MSHaptic.tap()
                                withAnimation(MSAnimation.snappy) { _ = colors.remove(at: i) }
                            } label: {
                                ColorSwatch(hex: hex, size: 48)
                                    .overlay(alignment: .topTrailing) {
                                        Image(systemName: "xmark").font(.system(size: 8, weight: .bold)).foregroundStyle(.white)
                                            .frame(width: 16, height: 16).background(MSColor.danger, in: Circle())
                                            .offset(x: 5, y: -5)
                                    }
                            }
                            .buttonStyle(MSPressStyle())
                        }
                    }
                }
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 12) {
                        ColorPicker("", selection: $picked, supportsOpacity: false)
                            .labelsHidden()
                            .frame(width: 44, height: 44)
                        MSTextField(placeholder: "#A855F7", text: $hexInput, icon: "number", autocapitalization: .characters)
                        MSButton(title: "Ajouter", icon: "plus", style: .secondary, size: .compact, isDisabled: colors.count >= 6, fullWidth: false) {
                            let hex = hexInput.isEmpty ? picked.hexString : normalized(hexInput)
                            guard let hex else { router.toast("Saisissez un code hexadécimal valide, ex. #A855F7", style: .warning); return }
                            withAnimation(MSAnimation.snappy) { colors.append(hex) }
                            hexInput = ""
                        }
                    }
                    Text("Choisissez avec la roue chromatique ou saisissez une valeur hexadécimale.").msCaption()
                }
                Spacer(minLength: 0)
                MSButton(title: "Enregistrer la palette", icon: "checkmark") {
                    var b = store.brand
                    b.colors = colors
                    store.updateBrand(b)
                    router.toast("Palette enregistrée", style: .success)
                    dismiss()
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
        .onAppear { colors = store.brand.colors }
    }

    private func normalized(_ s: String) -> String? {
        var h = s.trimmingCharacters(in: .whitespaces).uppercased()
        if h.hasPrefix("#") { h.removeFirst() }
        guard h.count == 6, UInt(h, radix: 16) != nil else { return nil }
        return "#" + h
    }
}

// MARK: - New brand (AppSheet.newBrand)

struct NewBrandSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var name = ""
    @State private var industry = "Beauté"
    @State private var website = ""
    @State private var description = ""
    @State private var palette: [String] = ["#A855F7", "#111111", "#FFFFFF"]
    @State private var picked: Color = MSColor.accent
    @State private var makeActive = true

    private let industries = ["Beauté", "Mode", "Alimentation", "Technologie", "Fitness", "Immobilier", "Café", "Maison"]

    var body: some View {
        BottomSheetContainer(title: "Nouveau kit de marque", subtitle: "Chaque marque conserve ses propres couleurs, polices et voix.") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    MSTextField(label: "Nom", placeholder: "ex. Urban Coffee", text: $name, icon: "paintpalette", autocapitalization: .words)
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Secteur").msCaption(color: MSColor.text2)
                        FlowLayout(spacing: 8) {
                            ForEach(industries, id: \.self) { i in
                                MSChip(title: i, selected: industry == i) { industry = i }
                            }
                        }
                    }
                    MSTextField(label: "Site web", placeholder: "https://", text: $website, icon: "globe", keyboard: .URL, autocapitalization: .never)
                    MSTextEditor(label: "Description", placeholder: "Que vend cette marque ?", text: $description, minHeight: 80)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Palette").msCaption(color: MSColor.text2)
                        HStack(spacing: 10) {
                            ForEach(Array(palette.enumerated()), id: \.offset) { i, hex in
                                Button {
                                    withAnimation(MSAnimation.snappy) { _ = palette.remove(at: i) }
                                } label: {
                                    ColorSwatch(hex: hex, size: 36, showLabel: false)
                                }
                                .buttonStyle(MSPressStyle())
                            }
                            if palette.count < 6 {
                                ColorPicker("", selection: $picked, supportsOpacity: false).labelsHidden().frame(width: 36, height: 36)
                                MSIconButton(icon: "plus", size: 32) { withAnimation(MSAnimation.snappy) { palette.append(picked.hexString) } }
                            }
                        }
                    }
                    Toggle(isOn: $makeActive) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Définir comme marque active").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                            Text("Les nouvelles générations utiliseront ce kit de marque.").msCaption()
                        }
                    }
                    .tint(MSColor.accent)
                    MSButton(title: "Créer la marque", icon: "plus", isDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty) {
                        let b = store.addBrand(name: name.trimmingCharacters(in: .whitespaces), industry: industry, colors: palette, fonts: ["Inter"], website: website, description: description, makeActive: makeActive)
                        router.dismissSheet()
                        router.toast("\(b.name) créée", style: .success)
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }
}
