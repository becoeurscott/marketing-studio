import SwiftUI

// MARK: - Steps

enum OnboardingStep: Int, CaseIterable {
    case opening, upload, analysis, goal, platforms, direction, brand, boldness
    case generation, photos, ugc, ads, copy, summary, formats, value, workflow
    case campaign, calendar, account, paywall, after

    /// Steps that show the progress header (question part of the flow).
    var progressIndex: Int? {
        switch self {
        case .upload: return 0
        case .analysis: return 1
        case .goal: return 2
        case .platforms: return 3
        case .direction: return 4
        case .brand: return 5
        case .boldness: return 6
        default: return nil
        }
    }
    static let progressCount = 7
}

// MARK: - Options

enum OnboardingGoal: String, CaseIterable, Identifiable {
    case launch, sell, social, test, auto
    var id: String { rawValue }
    var icon: String {
        switch self {
        case .launch: return "paperplane.fill"
        case .sell: return "chart.line.uptrend.xyaxis"
        case .social: return "iphone"
        case .test: return "flask.fill"
        case .auto: return "sparkles"
        }
    }
    var label: String {
        switch self {
        case .launch: return "Lancer un produit"
        case .sell: return "Vendre plus"
        case .social: return "Développer mes réseaux"
        case .test: return "Tester de nouvelles créas"
        case .auto: return "Je ne sais pas (Sokozia décide)"
        }
    }
}

enum OnboardingPlatform: String, CaseIterable, Identifiable {
    case tiktok, instagram, facebook, youtube, pinterest, google
    var id: String { rawValue }
    var label: String {
        switch self {
        case .tiktok: return "TikTok"
        case .instagram: return "Instagram"
        case .facebook: return "Facebook"
        case .youtube: return "YouTube"
        case .pinterest: return "Pinterest"
        case .google: return "Google"
        }
    }
    var icon: String {
        switch self {
        case .tiktok: return "music.note"
        case .instagram: return "camera.circle"
        case .facebook: return "person.2.circle"
        case .youtube: return "play.rectangle"
        case .pinterest: return "pin.circle"
        case .google: return "magnifyingglass.circle"
        }
    }
    var isVertical: Bool { self == .tiktok || self == .instagram }
}

enum CreativeDirection: String, CaseIterable, Identifiable {
    case luxe, epure, ugc, audacieux, surprise
    var id: String { rawValue }
    var title: String {
        switch self {
        case .luxe: return "LUXE"
        case .epure: return "ÉPURÉ"
        case .ugc: return "UGC"
        case .audacieux: return "AUDACIEUX"
        case .surprise: return "Surprenez-moi"
        }
    }
    var tags: String {
        switch self {
        case .luxe: return "Premium · Élégant · Éditorial"
        case .epure: return "Minimal · Moderne · Lumineux"
        case .ugc: return "Authentique · Humain · Social-first"
        case .audacieux: return "Énergique · Coloré · Accrocheur"
        case .surprise: return "Sokozia choisit la direction idéale"
        }
    }
    var gradient: [Color] {
        switch self {
        case .luxe: return [Color(hex: 0x3A2A12), Color(hex: 0x0E0B07)]
        case .epure: return [Color(hex: 0xE9E4DC), Color(hex: 0x9A958E)]
        case .ugc: return [Color(hex: 0xF59E0B), Color(hex: 0xBE185D)]
        case .audacieux: return [Color(hex: 0xEF4444), Color(hex: 0x7C3AED)]
        case .surprise: return [MSColor.accent, MSColor.accent2]
        }
    }
}

enum Boldness: String, CaseIterable, Identifiable {
    case prudent, creatif, fou
    var id: String { rawValue }
    var title: String {
        switch self {
        case .prudent: return "PRUDENT"
        case .creatif: return "CRÉATIF"
        case .fou: return "FOU"
        }
    }
    var subtitle: String {
        switch self {
        case .prudent: return "Éprouvé & soigné"
        case .creatif: return "Distinctif & engageant"
        case .fou: return "Inattendu & percutant"
        }
    }
    var icon: String {
        switch self {
        case .prudent: return "checkmark.shield"
        case .creatif: return "wand.and.stars"
        case .fou: return "flame"
        }
    }
}

// MARK: - Sample content

enum OnboardingSamples {
    static let productShot1 = "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shot/941ef07a-c2ab-5a0e-ac67-4e6c762c8ef2.webp"
    static let peopleShot1 = "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shots-people/834bb6b2-3a9b-48dd-9889-6934c765ccc2.webp"
    static let productShot2 = "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shot/36052145-6b41-51f2-95c1-7a0f0393a112.webp"
    static let peopleShot2 = "https://cdn.higgsfield.ai/cdn-cgi/image/width=720,quality=80,format=auto/marketing-studio-v2-product-shots-people/862de749-aa5c-4816-b028-7e254d969759.webp"
    static let all = [productShot1, peopleShot1, productShot2, peopleShot2]
}

// MARK: - Model

@MainActor
final class OnboardingModel: ObservableObject {
    @Published var step: OnboardingStep = .opening
    @Published var forward = true
    @Published var hasAccount = false

    // Product
    @Published var productImage: UIImage?
    @Published var usesSample = false
    @Published var productName = "Luma Glow Serum"
    @Published var productCategory = "Soin · Beauté"
    @Published var productDescription = "Un sérum éclat à la vitamine C qui illumine le teint dès la première semaine."

    // Answers
    @Published var goal: OnboardingGoal?
    @Published var platforms: Set<OnboardingPlatform> = [.tiktok, .instagram]
    @Published var direction: CreativeDirection?
    @Published var brandUploaded = false
    @Published var boldness: Boldness = .creatif
    @Published var plan = "creator"

    var hasProduct: Bool { productImage != nil || usesSample }

    func useSample() {
        productImage = nil
        usesSample = true
        productName = "Luma Glow Serum"
        productCategory = "Soin · Beauté"
        productDescription = "Un sérum éclat à la vitamine C qui illumine le teint dès la première semaine."
    }

    func setPhoto(_ image: UIImage) {
        productImage = image
        usesSample = false
        productName = "Votre produit"
        productCategory = "Produit · E-commerce"
        productDescription = "Un produit prêt à briller sur vos réseaux, en boutique et dans vos pubs."
    }

    var platformFeedback: String {
        let verticals = platforms.filter(\.isVertical)
        if platforms.isEmpty { return "Choisissez au moins une plateforme." }
        if verticals.count == platforms.count {
            return "Parfait. J'optimise la campagne pour le format vertical court."
        }
        if platforms.contains(.youtube) && platforms.count == 1 {
            return "Noté. Je prépare des formats horizontaux et des Shorts."
        }
        if platforms.contains(.google) || platforms.contains(.pinterest) {
            return "Très bien. J'ajoute des visuels pensés pour la recherche et l'inspiration."
        }
        return "Parfait. Je décline chaque créa pour \(platforms.count) plateformes."
    }

    func go(_ s: OnboardingStep) {
        forward = s.rawValue >= step.rawValue
        withAnimation(MSAnimation.snappy) { step = s }
    }

    func next() {
        if let n = OnboardingStep(rawValue: step.rawValue + 1) { go(n) }
    }

    func back() {
        if let p = OnboardingStep(rawValue: step.rawValue - 1) { go(p) }
    }

    /// Maps the new campaign-first answers onto the persisted `OnboardingAnswers` shape.
    func answers() -> OnboardingAnswers {
        var a = OnboardingAnswers()
        a.creating = ["Product"]
        a.wants = ["Full campaigns"]
        a.platforms = platforms.map(\.label).sorted()
        a.goal = goal.map { [$0.label] } ?? []
        a.role = []
        return a
    }
}

// MARK: - Product visual

/// The user's product photo (or the sample product) — the protagonist of every screen.
struct ProductVisual: View {
    @ObservedObject var model: OnboardingModel
    var cornerRadius: CGFloat = MSRadius.lg

    var body: some View {
        Group {
            if let img = model.productImage {
                Color.clear.overlay(Image(uiImage: img).resizable().scaledToFill())
            } else if model.usesSample {
                RemoteImage(url: OnboardingSamples.productShot1)
            } else {
                ZStack {
                    MSColor.elevated
                    Image(systemName: "shippingbox").font(.system(size: 28)).foregroundStyle(MSColor.muted)
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .accessibilityLabel(model.productName)
    }
}

// MARK: - Animated checklist

struct AnimatedChecklist: View {
    let items: [String]
    var interval: Double = 0.7
    var onDone: () -> Void = {}
    @State private var done = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                HStack(spacing: 12) {
                    ZStack {
                        if i < done {
                            Circle().fill(MSColor.success.opacity(0.15)).frame(width: 26, height: 26)
                            Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.success)
                                .transition(.scale.combined(with: .opacity))
                        } else if i == done {
                            ProgressView().tint(MSColor.highlight).scaleEffect(0.8).frame(width: 26, height: 26)
                        } else {
                            Circle().strokeBorder(MSColor.borderStrong, lineWidth: 1).frame(width: 26, height: 26)
                        }
                    }
                    Text(i == done ? "\(item)…" : item)
                        .font(MSFont.body(16))
                        .foregroundStyle(i <= done ? MSColor.text : MSColor.muted)
                }
                .animation(MSAnimation.snappy, value: done)
            }
        }
        .task {
            done = 0
            for _ in items {
                try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
                if Task.isCancelled { return }
                MSHaptic.tap()
                done += 1
            }
            try? await Task.sleep(nanoseconds: 450_000_000)
            if !Task.isCancelled { onDone() }
        }
    }
}

// MARK: - Shared bits

struct OnboardingSelectCard<Leading: View>: View {
    var title: String
    var subtitle: String? = nil
    var selected: Bool
    @ViewBuilder var leading: () -> Leading
    var action: () -> Void

    var body: some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            HStack(spacing: 14) {
                leading()
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(MSFont.headline(16)).foregroundStyle(MSColor.text)
                    if let subtitle { Text(subtitle).msCaption() }
                }
                Spacer()
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundStyle(selected ? MSColor.accent : MSColor.muted)
            }
            .padding(16)
            .background(selected ? MSColor.accent.opacity(0.12) : MSColor.card,
                        in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous)
                .strokeBorder(selected ? MSColor.accent : MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}

struct OnboardingHeadline: View {
    var title: String
    var subtitle: String? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).msTitle(28).fixedSize(horizontal: false, vertical: true)
            if let subtitle { Text(subtitle).msBody(15).fixedSize(horizontal: false, vertical: true) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
